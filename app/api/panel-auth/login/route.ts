import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { signToken, setSessionCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Correo y contraseña requeridos' }, { status: 400 });
  }

  const sql = getDb();

  try {
    const [companion] = await sql`
      SELECT id, name, photo_url, status, email, password_hash
      FROM companions WHERE email = ${email.toLowerCase().trim()} LIMIT 1
    `;

    if (!companion || !companion.password_hash) {
      return NextResponse.json({ error: 'Correo o contraseña incorrectos' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, companion.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Correo o contraseña incorrectos' }, { status: 401 });
    }

    const token = signToken({ companionId: companion.id });
    const response = NextResponse.json({
      companion: { id: companion.id, name: companion.name, photo_url: companion.photo_url, status: companion.status, email: companion.email },
    });
    setSessionCookie(response, token);
    return response;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error al iniciar sesión';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
