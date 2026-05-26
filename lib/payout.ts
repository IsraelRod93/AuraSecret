import { getDb } from '@/lib/db';

// 1 Star = $0.15 MXN (tasa conservadora después de la comisión de Telegram/Fragment)
export const STARS_TO_MXN = 0.15;
// Retiro mínimo: 500 Stars (~$75 MXN)
export const MIN_WITHDRAWAL_STARS = 500;

let tableReady = false;

export async function ensurePayoutSchema(sql: ReturnType<typeof getDb>) {
  if (tableReady) return;
  // Balance acumulado en la tabla companions
  await sql`ALTER TABLE companions ADD COLUMN IF NOT EXISTS earnings_stars INTEGER DEFAULT 0`.catch(() => {});
  await sql`ALTER TABLE companions ADD COLUMN IF NOT EXISTS mp_email TEXT`.catch(() => {});
  await sql`ALTER TABLE companions ADD COLUMN IF NOT EXISTS clabe TEXT`.catch(() => {});

  // Tabla de solicitudes de retiro
  await sql`
    CREATE TABLE IF NOT EXISTS withdrawal_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      companion_id UUID NOT NULL,
      amount_stars INTEGER NOT NULL,
      amount_mxn NUMERIC(10,2) NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      mp_payment_id TEXT,
      mp_email TEXT,
      clabe TEXT,
      error_msg TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      processed_at TIMESTAMPTZ
    )
  `.catch(() => {});
  await sql`
    CREATE INDEX IF NOT EXISTS wr_companion_status_idx ON withdrawal_requests (companion_id, status)
  `.catch(() => {});

  // Columna de idempotencia para evitar doble acreditación
  await sql`ALTER TABLE purchases ADD COLUMN IF NOT EXISTS earnings_credited BOOLEAN DEFAULT false`.catch(() => {});

  tableReady = true;
}

export async function creditCreatorEarnings(
  sql: ReturnType<typeof getDb>,
  companionId: string,
  totalStars: number,
  chargeId: string
) {
  const creatorStars = Math.round(totalStars * 0.8);
  if (creatorStars <= 0) return;
  await ensurePayoutSchema(sql);

  // Solo acredita si esta compra no ha sido acreditada aún (protección contra webhooks duplicados)
  const [updated] = await sql`
    UPDATE companions
    SET earnings_stars = COALESCE(earnings_stars, 0) + ${creatorStars}
    WHERE id = ${companionId}::uuid
    AND EXISTS (
      SELECT 1 FROM purchases
      WHERE stripe_payment_id = ${chargeId}
      AND (earnings_credited = false OR earnings_credited IS NULL)
    )
    RETURNING id
  `;

  if (updated) {
    await sql`
      UPDATE purchases SET earnings_credited = true
      WHERE stripe_payment_id = ${chargeId}
    `;
  }
}

export async function processPayoutViaMercadoPago(params: {
  withdrawalId: string;
  amountMxn: number;
  mpEmail: string;
  description: string;
}): Promise<{ success: boolean; paymentId?: string; error?: string }> {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return { success: false, error: 'MP_ACCESS_TOKEN no configurado' };

  try {
    // Transferencia de tu cuenta MP → cuenta MP de la creadora
    const res = await fetch('https://api.mercadopago.com/v1/money_transfer', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': params.withdrawalId,
      },
      body: JSON.stringify({
        amount: params.amountMxn,
        currency_id: 'MXN',
        reason: params.description,
        external_reference: params.withdrawalId,
        collector: { email: params.mpEmail },
      }),
    });

    const data = await res.json();

    if (res.ok && data.id) {
      return { success: true, paymentId: String(data.id) };
    }

    // Fallback: algunos países usan endpoint distinto
    return {
      success: false,
      error: data.message || data.error || `HTTP ${res.status}`,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error de red' };
  }
}
