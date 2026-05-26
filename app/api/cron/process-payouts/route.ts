import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { processPayoutViaMercadoPago } from '@/lib/payout';
import { sendMessage } from '@/lib/telegram-bot';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sql = getDb();

  // Lock: only pick up requests that haven't been touched in 5+ minutes (avoid double-processing)
  const pending = await sql`
    SELECT wr.id, wr.companion_id, wr.amount_stars, wr.amount_mxn, wr.mp_email, wr.clabe,
           c.telegram_id, c.name
    FROM withdrawal_requests wr
    JOIN companions c ON c.id = wr.companion_id
    WHERE wr.status = 'pending'
    AND wr.created_at < NOW() - INTERVAL '5 minutes'
    ORDER BY wr.created_at ASC
    LIMIT 50
  `;

  if (pending.length === 0) {
    return NextResponse.json({ processed: 0, message: 'No pending payouts' });
  }

  // Mark all as 'processing' atomically before touching MP (prevents double-fire between cron runs)
  const ids = pending.map(r => r.id);
  await sql`
    UPDATE withdrawal_requests SET status = 'processing'
    WHERE id = ANY(${ids}::uuid[]) AND status = 'pending'
  `;

  let succeeded = 0;
  let failed = 0;

  for (const wr of pending) {
    const mpEmail = wr.mp_email;
    if (!mpEmail) {
      await sql`
        UPDATE withdrawal_requests SET status = 'failed', error_msg = 'Sin email de Mercado Pago configurado', processed_at = NOW()
        WHERE id = ${wr.id}
      `;
      if (wr.telegram_id) {
        await sendMessage(
          wr.telegram_id,
          `<b>No pudimos procesar tu retiro</b> 😔\n\nNo tienes un email de Mercado Pago configurado en tu perfil. Agrégalo en Configuración → Método de cobro e intenta de nuevo.`
        ).catch(() => {});
      }
      failed++;
      continue;
    }

    const result = await processPayoutViaMercadoPago({
      withdrawalId: wr.id,
      amountMxn: Number(wr.amount_mxn),
      mpEmail,
      description: `Retiro Aura Secret — ${wr.amount_stars} Stars`,
    });

    if (result.success) {
      await sql`
        UPDATE withdrawal_requests
        SET status = 'completed', mp_payment_id = ${result.paymentId || null}, processed_at = NOW()
        WHERE id = ${wr.id}
      `;
      if (wr.telegram_id) {
        await sendMessage(
          wr.telegram_id,
          `<b>Tu pago está en camino!</b> 💸\n\nTransferimos <b>$${Number(wr.amount_mxn).toFixed(2)} MXN</b> (${wr.amount_stars} Stars) a tu cuenta de Mercado Pago.\n\nLlegará en 1-2 días hábiles. ¡Sigue creando! ✨`
        ).catch(() => {});
      }
      succeeded++;
    } else {
      await sql`
        UPDATE withdrawal_requests
        SET status = 'failed', error_msg = ${result.error || 'Error desconocido'}, processed_at = NOW()
        WHERE id = ${wr.id}
      `;
      if (wr.telegram_id) {
        await sendMessage(
          wr.telegram_id,
          `<b>Problema con tu retiro</b> ⚠️\n\nNo pudimos transferir tu pago automáticamente. Nuestro equipo lo revisará en las próximas 24h. Disculpa el inconveniente.`
        ).catch(() => {});
      }
      failed++;
    }
  }

  return NextResponse.json({ processed: pending.length, succeeded, failed });
}
