import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { signToken, setSessionCookie } from '@/lib/auth';
import { validateTelegramInitData } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  const { email, password, name, photo_url, age, location, personality_type, tagline, description, initData } = await request.json();

  if (!email || !password || !name || !photo_url) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 });
  }

  if (age && Number(age) < 18) {
    return NextResponse.json({ error: 'Debes tener al menos 18 años' }, { status: 403 });
  }

  const telegramId: number | null = initData
    ? (validateTelegramInitData(initData)?.user?.id ?? null)
    : null;

  const sql = getDb();

  try {
    const existing = await sql`SELECT id FROM companions WHERE email = ${email.toLowerCase().trim()} LIMIT 1`;
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Ya existe una cuenta con este correo' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [companion] = await sql`
      INSERT INTO companions (name, type, photo_url, status, email, password_hash, description, tagline, age, location, personality_type, telegram_id)
      VALUES (
        ${name}, 'human', ${photo_url}, 'active',
        ${email.toLowerCase().trim()}, ${passwordHash},
        ${description || 'Modelo ' + name},
        ${tagline || 'Nueva en Aura'},
        ${age ? Number(age) : null},
        ${location || null},
        ${personality_type || null},
        ${telegramId}
      )
      RETURNING id, name, photo_url, status, email
    `;
    
    const token = signToken({ companionId: companion.id });
    const response = NextResponse.json({ companion });
    setSessionCookie(response, token);
    return response;
  } catch (error) {
    console.error("CRÍTICO - ERROR EN API REGISTER:", error);
    console.error('ERROR EN REGISTRO DE COMPANION:', error);
    const msg = error instanceof Error ? error.message : 'Error en el registro';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
