import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ensurePayoutSchema, processPayoutViaMercadoPago } from '@/lib/payout';

function authCheck(request: NextRequest) {
  const pw = request.headers.get('x-admin-password');
  return pw === process.env.ADMIN_PASSWORD;
}

// GET: lista de retiros pendientes
export async function GET(request: NextRequest) {
  if (!authCheck(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const sql = getDb();
  await ensurePayoutSchema(sql);

  const pending = await sql`
    SELECT wr.id, wr.amount_stars, wr.amount_mxn, wr.mp_email, wr.clabe,
           wr.status, wr.created_at, c.name as companion_name
    FROM withdrawal_requests wr
    JOIN companions c ON c.id = wr.companion_id
    WHERE wr.status = 'pending'
    ORDER BY wr.created_at ASC
  `;

  const [totals] = await sql`
    SELECT
      COUNT(*)::int AS count,
      COALESCE(SUM(amount_stars), 0)::int AS total_stars,
      COALESCE(SUM(amount_mxn), 0)::numeric AS total_mxn
    FROM withdrawal_requests WHERE status = 'pending'
  `;

  return NextResponse.json({ pending, totals });
}

// POST: procesar todos los retiros pendientes via Mercado Pago
export async function POST(request: NextRequest) {
  if (!authCheck(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const sql = getDb();
  await ensurePayoutSchema(sql);

  const pending = await sql`
    SELECT id, amount_mxn, mp_email, clabe, companion_id
    FROM withdrawal_requests WHERE status = 'pending'
  `;

  const results = { success: 0, failed: 0, manual: 0, errors: [] as string[] };

  for (const wr of pending) {
    if (wr.mp_email) {
      // Pago automático via Mercado Pago
      const result = await processPayoutViaMercadoPago({
        withdrawalId: wr.id,
        amountMxn: Number(wr.amount_mxn),
        mpEmail: wr.mp_email,
        description: 'Ganancias AuraSecret',
      });

      if (result.success) {
        await sql`
          UPDATE withdrawal_requests
          SET status = 'completed', mp_payment_id = ${result.paymentId!}, processed_at = NOW()
          WHERE id = ${wr.id}
        `;
        results.success++;
      } else {
        await sql`
          UPDATE withdrawal_requests SET error_msg = ${result.error!} WHERE id = ${wr.id}
        `;
        results.failed++;
        results.errors.push(`${wr.id}: ${result.error}`);
      }
    } else {
      // Sin MP email → marcar como "manual" (SPEI)
      await sql`
        UPDATE withdrawal_requests SET status = 'manual_required' WHERE id = ${wr.id}
      `;
      results.manual++;
    }
  }

  return NextResponse.json(results);
}

// DELETE: generar CSV SPEI para retiros manuales
export async function DELETE(request: NextRequest) {
  if (!authCheck(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const sql = getDb();
  const manual = await sql`
    SELECT wr.id, wr.amount_mxn, wr.clabe, c.name as companion_name
    FROM withdrawal_requests wr
    JOIN companions c ON c.id = wr.companion_id
    WHERE wr.status IN ('pending', 'manual_required') AND wr.clabe IS NOT NULL
    ORDER BY wr.created_at ASC
  `;

  if (manual.length === 0) {
    return NextResponse.json({ error: 'Sin retiros con CLABE pendientes' }, { status: 404 });
  }

  // CSV compatible con la mayoría de bancos mexicanos
  const header = 'Beneficiario,CLABE,Monto MXN,Concepto,Referencia\n';
  const rows = manual.map(r =>
    `${r.companion_name},${r.clabe},${Number(r.amount_mxn).toFixed(2)},Ganancias AuraSecret,${r.id.slice(0, 8)}`
  ).join('\n');

  // Marcar como en proceso
  await sql`
    UPDATE withdrawal_requests SET status = 'manual_required'
    WHERE id = ANY(${manual.map(r => r.id)})
  `;

  return new Response(header + rows, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="retiros-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
