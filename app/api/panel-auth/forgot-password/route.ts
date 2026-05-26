import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { sendMessage } from '@/lib/telegram-bot';

const OTP_TTL_MINUTES = 15;

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
  }

  const sql = getDb();

  const [companion] = await sql`
    SELECT id, name, telegram_id
    FROM companions
    WHERE email = ${email.toLowerCase().trim()}
    LIMIT 1
  `;

  // Siempre responder ok para no revelar si el email existe
  if (!companion) {
    return NextResponse.json({ ok: true });
  }

  if (!companion.telegram_id) {
    return NextResponse.json(
      { error: 'Esta cuenta no tiene Telegram vinculado. Contacta al administrador para recuperar tu acceso.' },
      { status: 422 }
    );
  }

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await sql`
    UPDATE companions
    SET reset_otp = ${otp}, reset_otp_expires_at = ${expiresAt}
    WHERE id = ${companion.id}
  `;

  await sendMessage(
    companion.telegram_id,
    `🔐 Código de recuperación de AuraSecret:\n\n*${otp}*\n\nVálido por ${OTP_TTL_MINUTES} minutos. No lo compartas con nadie.`
  );

  return NextResponse.json({ ok: true });
}
