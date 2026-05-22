export async function payWithTelegram(params: {
  type: 'gallery_unlock' | 'subscription' | 'vault_purchase';
  userId?: string;
  vaultItemId?: string;
  companionId?: string;
  plan?: 'weekly' | 'monthly';
}): Promise<boolean> {
  const res = await fetch('/api/pay', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();

  if (!data.invoiceUrl) {
    throw new Error(data.error || 'No se pudo crear el pago');
  }

  const tg = (window as any).Telegram?.WebApp;

  if (tg?.openInvoice) {
    return new Promise((resolve) => {
      tg.openInvoice(data.invoiceUrl, (status: string) => {
        resolve(status === 'paid');
      });
    });
  }

  window.open(data.invoiceUrl, '_blank');
  return false;
}

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
