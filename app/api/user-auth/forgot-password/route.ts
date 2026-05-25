import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { validateTelegramInitData } from '@/lib/telegram';

const BOT_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
const OTP_TTL_MINUTES = 15;

async function ensureOtpColumns(sql: ReturnType<typeof getDb>) {
  await sql`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS reset_otp TEXT,
    ADD COLUMN IF NOT EXISTS reset_otp_expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS reset_otp_telegram_id BIGINT
  `.catch(() => {});
}

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendTelegramMessage(chatId: number, text: string) {
  await fetch(`${BOT_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

export async function POST(request: NextRequest) {
  const { email, initData } = await request.json();

  if (!email || !initData) {
    return NextResponse.json({ error: 'Email e initData requeridos' }, { status: 400 });
  }

  const validated = validateTelegramInitData(initData);
  if (!validated) {
    return NextResponse.json({ error: 'Sesión de Telegram inválida' }, { status: 401 });
  }

  const telegramId = validated.user.id;
  const sql = getDb();
  await ensureOtpColumns(sql);

  const [user] = await sql`
    SELECT id FROM users WHERE email = ${email.toLowerCase().trim()} LIMIT 1
  `;

  // Siempre responder OK para no revelar si el email existe
  if (!user) {
    return NextResponse.json({ ok: true });
  }

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await sql`
    UPDATE users SET
      reset_otp = ${otp},
      reset_otp_expires_at = ${expiresAt},
      reset_otp_telegram_id = ${telegramId}
    WHERE id = ${user.id}
  `;

  await sendTelegramMessage(
    telegramId,
    `🔐 Tu código de recuperación de AuraSecret:\n\n*${otp}*\n\nVálido por ${OTP_TTL_MINUTES} minutos. No lo compartas con nadie.`
  );

  return NextResponse.json({ ok: true });
}
