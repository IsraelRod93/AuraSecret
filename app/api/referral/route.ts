import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  try {
    const sql = getDb();

    const [user] = await sql`
      SELECT telegram_id, referral_count, options_unlocked FROM users WHERE id = ${userId}::uuid LIMIT 1
    `;

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const referralCode = `ref_${user.telegram_id}`;
    const referralLink = `https://t.me/AuraSecretx_bot?start=${referralCode}`;
    const count = user.referral_count || 0;
    const rewardUnlocked = count >= 3 || user.options_unlocked;

    return NextResponse.json({
      referralLink,
      referralCode,
      referralCount: count,
      rewardUnlocked,
      nextRewardAt: rewardUnlocked ? null : 3 - count,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
