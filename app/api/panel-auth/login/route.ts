import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { signToken, setSessionCookie } from '@/lib/auth';
import { validateTelegramInitData } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  const { email, password, initData } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Correo y contraseña requeridos' }, { status: 400 });
  }

  const sql = getDb();

  try {
    const [companion] = await sql`
      SELECT id, name, photo_url, status, email, password_hash
      FROM companions WHERE email = ${email.toLowerCase().trim()} LIMIT 1
    `;

    console.log("LOGIN DEBUG: Búsqueda de companion para email:", email.toLowerCase().trim(), "Resultado encontrado:", !!companion);

    if (!companion || !companion.password_hash) {
      console.log("LOGIN DEBUG: Companion no encontrado o sin password_hash");
      return NextResponse.json({ error: 'Correo o contraseña incorrectos' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, companion.password_hash);
    console.log("LOGIN DEBUG: Validación de contraseña:", valid);

    if (!valid) {
      return NextResponse.json({ error: 'Correo o contraseña incorrectos' }, { status: 401 });
    }

    // Si viene initData de Telegram y la cuenta no tiene telegram_id, lo guardamos
    if (initData && !companion.telegram_id) {
      const telegramId = validateTelegramInitData(initData)?.user?.id ?? null;
      if (telegramId) {
        await sql`UPDATE companions SET telegram_id = ${telegramId} WHERE id = ${companion.id}`.catch(() => {});
      }
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
