import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ensurePayoutSchema, STARS_TO_MXN, MIN_WITHDRAWAL_STARS } from '@/lib/payout';

// POST: registrar datos de pago
// PUT: solicitar retiro
export async function POST(request: NextRequest) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { mpEmail, clabe } = await request.json();
  if (!mpEmail && !clabe) {
    return NextResponse.json({ error: 'Proporciona un correo de Mercado Pago o una CLABE' }, { status: 400 });
  }

  const sql = getDb();
  await ensurePayoutSchema(sql);

  await sql`
    UPDATE companions SET mp_email = ${mpEmail || null}, clabe = ${clabe || null}
    WHERE id = ${session.companionId}::uuid
  `;

  return NextResponse.json({ ok: true });
}

export async function PUT(request: NextRequest) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { amountStars } = await request.json();

  if (!amountStars || amountStars < MIN_WITHDRAWAL_STARS) {
    return NextResponse.json({
      error: `El mínimo de retiro es ${MIN_WITHDRAWAL_STARS} Stars (~$${(MIN_WITHDRAWAL_STARS * STARS_TO_MXN).toFixed(0)} MXN)`,
    }, { status: 400 });
  }

  const sql = getDb();
  await ensurePayoutSchema(sql);

  // Verificar saldo disponible (descontar retiros pendientes)
  const [companion] = await sql`
    SELECT earnings_stars, mp_email, clabe FROM companions
    WHERE id = ${session.companionId}::uuid LIMIT 1
  `;

  if (!companion?.mp_email && !companion?.clabe) {
    return NextResponse.json({ error: 'Primero registra tu Mercado Pago o CLABE' }, { status: 400 });
  }

  const [pending] = await sql`
    SELECT COALESCE(SUM(amount_stars), 0)::int AS total
    FROM withdrawal_requests
    WHERE companion_id = ${session.companionId}::uuid AND status = 'pending'
  `;

  const available = (companion.earnings_stars || 0) - (pending?.total || 0);
  if (amountStars > available) {
    return NextResponse.json({ error: `Solo tienes ${available} Stars disponibles` }, { status: 400 });
  }

  const amountMxn = +(amountStars * STARS_TO_MXN).toFixed(2);

  await sql`
    INSERT INTO withdrawal_requests (companion_id, amount_stars, amount_mxn, mp_email, clabe)
    VALUES (
      ${session.companionId}::uuid,
      ${amountStars},
      ${amountMxn},
      ${companion.mp_email || null},
      ${companion.clabe || null}
    )
  `;

  return NextResponse.json({ ok: true, amountStars, amountMxn });
}
