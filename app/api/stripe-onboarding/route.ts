import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  const { modelId } = await request.json();
  const stripe = getStripe();

  try {
    const account = await stripe.accounts.create({
      type: 'express',
      capabilities: {
        transfers: { requested: true },
      },
    });

    const origin = request.headers.get('origin') || '';
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${origin}/join?error=retry`,
      return_url: `${origin}/dashboard/${modelId}`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url, accountId: account.id, modelId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Stripe onboarding failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
