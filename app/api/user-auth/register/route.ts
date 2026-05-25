import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb, ensureUserSchema } from '@/lib/db';
import { signUserToken, setUserSessionCookie } from '@/lib/user-auth';
import { validateTelegramInitData } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  const { email, password, name, age, lookingFor, initData } = await request.json();

  const telegramId: number | null = initData
    ? (validateTelegramInitData(initData)?.user?.id ?? null)
    : null;

  if (!email || !password || !name) {
    return NextResponse.json({ error: 'Nombre, correo y contraseña requeridos' }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
  }

  const sql = getDb();

  const retryIfUserSchemaError = async <T>(work: () => Promise<T>): Promise<T> => {
    try {
      return await work();
    } catch (error) {
      const msg = error instanceof Error ? error.message : '';
      if (/column "email" does not exist/i.test(msg) || /column "password_hash" does not exist/i.test(msg)) {
        await ensureUserSchema(sql);
        return await work();
      }
      throw error;
    }
  };

  try {
    const existing = await retryIfUserSchemaError(async () => {
      return await sql`
        SELECT id FROM users WHERE email = ${email.toLowerCase().trim()} LIMIT 1
      `;
    });
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Ya existe una cuenta con este correo' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [user] = await retryIfUserSchemaError(async () => {
      return await sql`
        INSERT INTO users (first_name, email, password_hash, age, looking_for, telegram_id)
        VALUES (
          ${name},
          ${email.toLowerCase().trim()},
          ${passwordHash},
          ${age ? Number(age) : null},
          ${lookingFor || null},
          ${telegramId}
        )
        ON CONFLICT (telegram_id) DO UPDATE SET
          email = EXCLUDED.email,
          password_hash = EXCLUDED.password_hash,
          first_name = EXCLUDED.first_name
        RETURNING id, first_name, email, age, looking_for, subscription_status, options_unlocked
      `;
    });

    const token = signUserToken({ userId: user.id });
    const response = NextResponse.json({ user });
    setUserSessionCookie(response, token);
    return response;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error en el registro';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
