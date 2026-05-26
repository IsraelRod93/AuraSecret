import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  const { email, otp, newPassword } = await request.json();

  if (!email || !otp || !newPassword) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 });
  }

  const sql = getDb();

  const [companion] = await sql`
    SELECT id, reset_otp, reset_otp_expires_at
    FROM companions
    WHERE email = ${email.toLowerCase().trim()}
    LIMIT 1
  `;

  if (!companion || !companion.reset_otp) {
    return NextResponse.json({ error: 'Código inválido o expirado' }, { status: 400 });
  }

  if (companion.reset_otp !== String(otp).trim()) {
    return NextResponse.json({ error: 'Código incorrecto' }, { status: 400 });
  }

  if (!companion.reset_otp_expires_at || new Date(companion.reset_otp_expires_at) < new Date()) {
    return NextResponse.json({ error: 'El código ha expirado' }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await sql`
    UPDATE companions
    SET password_hash = ${passwordHash}, reset_otp = NULL, reset_otp_expires_at = NULL
    WHERE id = ${companion.id}
  `;

  return NextResponse.json({ ok: true });
}
