import { put } from '@vercel/blob';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const { searchParams } = new URL(req.url);
  const filename = searchParams.get('filename');
  const password = req.headers.get('x-admin-password');

  // Seguridad básica: Contraseña simple para el MVP
  if (password !== process.env.ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  if (!filename) {
    return new Response(JSON.stringify({ error: 'Filename is required' }), { status: 400 });
  }

  try {
    const blob = await put(filename, req.body, {
      access: 'public',
    });

    return new Response(JSON.stringify(blob), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
