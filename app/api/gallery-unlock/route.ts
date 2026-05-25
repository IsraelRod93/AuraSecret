import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Este metodo de pago ya no esta disponible. Usa Telegram Stars.' },
    { status: 410 }
  );
}
