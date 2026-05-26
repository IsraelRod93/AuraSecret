import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { getSession } from '@/lib/auth';
import { checkImageContent } from '@/lib/moderation';

export async function POST(request: NextRequest) {
  const filename = request.nextUrl.searchParams.get('filename');
  if (!filename) {
    return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
  }

  const adminPassword = request.headers.get('x-admin-password');
  const isAdmin = adminPassword && adminPassword === process.env.ADMIN_PASSWORD;
  const panelSession = getSession(request);

  if (!isAdmin && !panelSession) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const buffer = Buffer.from(await request.arrayBuffer());

    // Los admins saltan la moderación; las creadoras pasan por Rekognition (solo imágenes)
    const isVideo = /\.(mp4|mov|webm|avi|mkv|m4v)$/i.test(filename);
    if (!isAdmin && !isVideo) {
      const { allowed, reason } = await checkImageContent(buffer);
      if (!allowed) {
        return NextResponse.json({ error: reason }, { status: 422 });
      }
    }

    const blob = await put(filename, buffer, { access: 'public', addRandomSuffix: true });
    return NextResponse.json(blob);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
