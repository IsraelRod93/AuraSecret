import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { signToken, setSessionCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const { email, password, name, photo_url, age, location, personality_type, tagline, description } = await request.json();

  if (!email || !password || !name || !photo_url) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 });
  }

  if (age && Number(age) < 18) {
    return NextResponse.json({ error: 'Debes tener al menos 18 años' }, { status: 403 });
  }

  const sql = getDb();
  console.log('VERIFICANDO DB:', { sql: !!sql });

  try {
    console.log('DEBUG_REGISTRO: Iniciando proceso');
    const existing = await sql`SELECT id FROM companions WHERE email = ${email.toLowerCase().trim()} LIMIT 1`;
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Ya existe una cuenta con este correo' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    console.log("API REGISTER: Intentando insertar en la base de datos...");
    console.log('DEBUG_REGISTRO: Intentando INSERT con data:', { name, email, age, location });
    const [companion] = await sql`
      INSERT INTO companions (name, type, photo_url, status, email, password_hash, description, tagline, age, location, personality_type)
      VALUES (
        ${name}, 'human', ${photo_url}, 'active',
        ${email.toLowerCase().trim()}, ${passwordHash},
        ${description || 'Modelo ' + name},
        ${tagline || 'Nueva en Aura'},
        ${age ? Number(age) : null},
        ${location || null},
        ${personality_type || null}
      )
      RETURNING id, name, photo_url, status, email
    `;
    console.log('DEBUG_REGISTRO: Insert finalizado correctamente:', companion);
    
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
