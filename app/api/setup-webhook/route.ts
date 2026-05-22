import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  if (!secret || secret !== process.env.MIGRATION_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const webhookSecret = process.env.WEBHOOK_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aura-secret.vercel.app';

  if (!botToken || !webhookSecret) {
    return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN y WEBHOOK_SECRET son requeridos' }, { status: 500 });
  }

  const res = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: `${appUrl}/api/telegram-webhook`,
      secret_token: webhookSecret,
      allowed_updates: ['message', 'pre_checkout_query', 'callback_query'],
    }),
  });

  const data = await res.json();
  return NextResponse.json(data);
}
