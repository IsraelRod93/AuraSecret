const BOT_API = 'https://api.telegram.org/bot';

function getBotToken() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN not configured');
  return token;
}

export async function sendMessage(chatId: string | number, text: string) {
  const token = getBotToken();
  const res = await fetch(`${BOT_API}${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    }),
  });
  return res.json();
}
