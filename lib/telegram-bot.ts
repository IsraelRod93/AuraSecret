const BOT_API = 'https://api.telegram.org/bot';

const WEBAPP_URL = 'https://aura-secret.vercel.app';
const BOT_USERNAME = 'AuraSecretx_bot';

function getBotToken() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN not configured');
  return token;
}

export { WEBAPP_URL, BOT_USERNAME };

export async function sendMessage(chatId: string | number, text: string, replyMarkup?: object) {
  const token = getBotToken();
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
  };
  if (replyMarkup) body.reply_markup = replyMarkup;
  const res = await fetch(`${BOT_API}${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function sendPhoto(chatId: string | number, photoUrl: string, caption: string, replyMarkup?: object) {
  const token = getBotToken();
  const body: Record<string, unknown> = {
    chat_id: chatId,
    photo: photoUrl,
    caption,
    parse_mode: 'HTML',
  };
  if (replyMarkup) body.reply_markup = replyMarkup;
  const res = await fetch(`${BOT_API}${token}/sendPhoto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}
