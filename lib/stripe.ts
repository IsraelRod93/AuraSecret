import Stripe from 'stripe';

let _stripe: Stripe;

export function getStripe() {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
    _stripe = new Stripe(key);
  }
  return _stripe;
}

export const PRICES = {
  SUBSCRIPTION_WEEKLY: 9900,
  SUBSCRIPTION_MONTHLY: 24900,
  GALLERY_UNLOCK: 4900,
} as const;
