export function openPaymentLink(url: string) {
  try {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.openLink) {
      tg.openLink(url);
    } else if (tg?.openTelegramLink) {
      window.open(url, '_blank');
    } else {
      window.location.href = url;
    }
  } catch {
    window.location.href = url;
  }
}
