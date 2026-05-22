const BOT_API = 'https://api.telegram.org/bot';

function getBotToken() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN not configured');
  return token;
}

export const STAR_PRICES = {
  GALLERY_UNLOCK: 150,
  SUBSCRIPTION_WEEKLY: 350,
  VAULT_BASE: 200,
} as const;

export async function createInvoiceLink(params: {
  title: string;
  description: string;
  payload: string;
  prices: { label: string; amount: number }[];
}) {
  const token = getBotToken();

  const res = await fetch(`${BOT_API}${token}/createInvoiceLink`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: params.title,
      description: params.description,
      payload: params.payload,
      provider_token: '',
      currency: 'XTR',
      prices: params.prices,
    }),
  });

  const data = await res.json();
  if (!data.ok) throw new Error(data.description || 'Failed to create invoice');
  return data.result as string;
}

export async function answerPreCheckoutQuery(preCheckoutQueryId: string, ok: boolean, errorMessage?: string) {
  const token = getBotToken();

  await fetch(`${BOT_API}${token}/answerPreCheckoutQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pre_checkout_query_id: preCheckoutQueryId,
      ok,
      error_message: errorMessage,
    }),
  });
}
