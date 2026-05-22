import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { signUserToken, setUserSessionCookie } from '@/lib/user-auth';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Correo y contraseña requeridos' }, { status: 400 });
  }

  const sql = getDb();

  try {
    const [user] = await sql`
      SELECT id, first_name, email, password_hash, age, looking_for, subscription_status, options_unlocked
      FROM users WHERE email = ${email.toLowerCase().trim()} LIMIT 1
    `;

    if (!user || !user.password_hash) {
      return NextResponse.json({ error: 'Correo o contraseña incorrectos' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Correo o contraseña incorrectos' }, { status: 401 });
    }

    const token = signUserToken({ userId: user.id });
    const response = NextResponse.json({
      user: {
        id: user.id,
        first_name: user.first_name,
        email: user.email,
        age: user.age,
        looking_for: user.looking_for,
        subscription_status: user.subscription_status,
        options_unlocked: user.options_unlocked,
      },
    });
    setUserSessionCookie(response, token);
    return response;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error al iniciar sesión';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
