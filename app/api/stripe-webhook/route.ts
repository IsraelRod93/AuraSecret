import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { getSupabase } from '@/lib/supabase';
import type Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const db = getSupabase();

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

          await db
            .from('users')
            .update({
              subscription_status: 'active',
              subscription_expires_at: periodEnd.toISOString(),
            })
            .eq('id', metadata.userId);
        }

        if (metadata.type === 'gallery_unlock') {
          await db
            .from('users')
            .update({ options_unlocked: true })
            .eq('id', metadata.userId);
        }

        if (metadata.type === 'vault_purchase') {
          await db.from('purchases').insert({
            user_id: metadata.userId,
            vault_item_id: metadata.vaultItemId,
            companion_id: session.metadata?.companionId || null,
            amount: session.amount_total || 0,
            stripe_payment_id: session.payment_intent as string,
            status: 'completed',
          });
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
          await db
            .from('users')
            .update({ subscription_status: 'expired' })
            .eq('id', userId);
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
            await db
              .from('users')
              .update({ subscription_status: 'expired' })
              .eq('id', userId);
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
