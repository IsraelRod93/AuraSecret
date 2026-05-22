import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { getDb } from '@/lib/db';
import { sendMessage } from '@/lib/telegram-bot';
import type Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const sql = getDb();

  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata || {};

        if (metadata.type === 'subscription') {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const periodEnd = new Date((subscription as any).current_period_end * 1000);

          await sql`
            UPDATE users SET subscription_status = 'active', subscription_expires_at = ${periodEnd.toISOString()}
            WHERE id = ${metadata.userId}::uuid
          `;
        }

        if (metadata.type === 'gallery_unlock') {
          await sql`
            UPDATE users SET options_unlocked = true, gallery_views = 0
            WHERE id = ${metadata.userId}::uuid
          `;

          const [payer] = await sql`
            SELECT referred_by FROM users WHERE id = ${metadata.userId}::uuid LIMIT 1
          `;
          if (payer?.referred_by) {
            await sql`
              UPDATE users SET options_unlocked = true
              WHERE id = ${payer.referred_by} AND options_unlocked = false
            `;
          }
        }

        if (metadata.type === 'vault_purchase') {
          const paymentId = session.payment_intent as string || session.id;
          const [existing] = await sql`
            SELECT id FROM purchases WHERE stripe_payment_id = ${paymentId} LIMIT 1
          `;
          if (!existing) {
            await sql`
              INSERT INTO purchases (user_id, vault_item_id, companion_id, amount, stripe_payment_id, status)
              VALUES (${metadata.userId}::uuid, ${metadata.vaultItemId}::uuid, ${metadata.companionId || null}::uuid, ${session.amount_total || 0}, ${paymentId}, 'completed')
            `;
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const checkoutSessions = await stripe.checkout.sessions.list({
          subscription: subscription.id,
          limit: 1,
        });
        const userId = checkoutSessions.data[0]?.metadata?.userId;

        if (userId) {
          await sql`
            UPDATE users SET subscription_status = 'expired' WHERE id = ${userId}::uuid
          `;

          const [user] = await sql`
            SELECT telegram_id FROM users WHERE id = ${userId}::uuid LIMIT 1
          `;
          if (user?.telegram_id) {
            await sendMessage(user.telegram_id, '<b>Tu acceso Premium ha expirado</b>\n\nTus conexiones te extranan... Renueva tu suscripcion para seguir hablando sin limites.').catch(() => {});
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const checkoutSessions = await stripe.checkout.sessions.list({
            subscription: invoice.subscription as string,
            limit: 1,
          });
          const userId = checkoutSessions.data[0]?.metadata?.userId;

          if (userId) {
            await sql`
              UPDATE users SET subscription_status = 'expired' WHERE id = ${userId}::uuid
            `;

            const [user] = await sql`
              SELECT telegram_id FROM users WHERE id = ${userId}::uuid LIMIT 1
            `;
            if (user?.telegram_id) {
              await sendMessage(user.telegram_id, '<b>Hubo un problema con tu pago</b>\n\nNo pudimos renovar tu suscripcion Premium. Actualiza tu metodo de pago para no perder tus conversaciones.').catch(() => {});
            }
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook processing failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
