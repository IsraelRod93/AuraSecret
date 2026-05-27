import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ensurePayoutSchema, STARS_TO_MXN, getMinWithdrawalStars, MIN_WITHDRAWAL_STARS } from '@/lib/payout';

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const sql = getDb();
  await ensurePayoutSchema(sql);

  const [companion] = await sql`
    SELECT earnings_stars, mp_email, clabe, created_at FROM companions
    WHERE id = ${session.companionId}::uuid LIMIT 1
  `;

  const [pending] = await sql`
    SELECT COALESCE(SUM(amount_stars), 0)::int AS total
    FROM withdrawal_requests
    WHERE companion_id = ${session.companionId}::uuid AND status = 'pending'
  `;

  const earningsStars = companion?.earnings_stars || 0;
  const pendingStars = pending?.total || 0;

  const minWithdrawalStars = getMinWithdrawalStars(companion?.created_at ?? null);

  return NextResponse.json({
    earningsStars,
    pendingStars,
    availableStars: Math.max(0, earningsStars - pendingStars),
    estimatedMxn: +(earningsStars * STARS_TO_MXN).toFixed(2),
    minWithdrawalStars,
    starsToMxn: STARS_TO_MXN,
    mpEmail: companion?.mp_email || null,
    clabe: companion?.clabe || null,
    isNewCreator: minWithdrawalStars < MIN_WITHDRAWAL_STARS,
  });
}
