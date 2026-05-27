import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { STARS_TO_MXN, getMinWithdrawalStars } from '@/lib/payout';

// POST: registrar datos de pago
export async function POST(request: NextRequest) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { mpEmail, clabe } = await request.json();
  if (!mpEmail && !clabe) {
    return NextResponse.json({ error: 'Proporciona un correo de Mercado Pago o una CLABE' }, { status: 400 });
  }

  const sql = getDb();
  await sql`
    UPDATE companions SET mp_email = ${mpEmail || null}, clabe = ${clabe || null}
    WHERE id = ${session.companionId}::uuid
  `;

  return NextResponse.json({ ok: true });
}

// PUT: solicitar retiro
export async function PUT(request: NextRequest) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { amountStars } = await request.json();
  const amountMxn = +(amountStars * STARS_TO_MXN).toFixed(2);
  const sql = getDb();

  // Fetch companion's created_at to determine their minimum withdrawal threshold
  const [comp] = await sql`SELECT created_at FROM companions WHERE id = ${session.companionId}::uuid LIMIT 1`;
  const minWithdrawal = getMinWithdrawalStars(comp?.created_at ?? null);

  if (!amountStars || amountStars < minWithdrawal) {
    return NextResponse.json({
      error: `El mínimo de retiro es ${minWithdrawal} Stars (~$${(minWithdrawal * STARS_TO_MXN).toFixed(0)} MXN)`,
    }, { status: 400 });
  }

  // CTE atómica: rate-limit + balance check + INSERT en una sola query.
  // El INSERT solo ocurre si recent=0, saldo suficiente y método de pago configurado.
  const [result] = await sql`
    WITH
      rate_check AS (
        SELECT COUNT(*)::int AS recent
        FROM withdrawal_requests
        WHERE companion_id = ${session.companionId}::uuid
          AND created_at > NOW() - INTERVAL '60 seconds'
      ),
      balance AS (
        SELECT
          c.earnings_stars - COALESCE((
            SELECT SUM(amount_stars)::int FROM withdrawal_requests
            WHERE companion_id = c.id AND status = 'pending'
          ), 0) AS available,
          c.mp_email,
          c.clabe
        FROM companions c
        WHERE c.id = ${session.companionId}::uuid
      ),
      inserted AS (
        INSERT INTO withdrawal_requests (companion_id, amount_stars, amount_mxn, mp_email, clabe)
        SELECT ${session.companionId}::uuid, ${amountStars}, ${amountMxn}, b.mp_email, b.clabe
        FROM balance b, rate_check r
        WHERE r.recent = 0
          AND b.available >= ${amountStars}
          AND (b.mp_email IS NOT NULL OR b.clabe IS NOT NULL)
        RETURNING id
      )
    SELECT
      (SELECT available FROM balance)       AS available,
      (SELECT mp_email  FROM balance)       AS mp_email,
      (SELECT clabe     FROM balance)       AS clabe,
      (SELECT recent    FROM rate_check)    AS recent,
      (SELECT id        FROM inserted)      AS inserted_id
  `;

  if (!result.mp_email && !result.clabe) {
    return NextResponse.json({ error: 'Primero registra tu Mercado Pago o CLABE' }, { status: 400 });
  }
  if (result.recent > 0) {
    return NextResponse.json({ error: 'Espera 60 segundos antes de solicitar otro retiro' }, { status: 429 });
  }
  if (result.available < amountStars) {
    return NextResponse.json({ error: `Solo tienes ${result.available} Stars disponibles` }, { status: 400 });
  }
  if (!result.inserted_id) {
    return NextResponse.json({ error: 'No se pudo crear la solicitud, intenta de nuevo' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, amountStars, amountMxn });
}
