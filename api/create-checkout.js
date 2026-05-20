import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { modelId, price, stripeAccountId } = req.body;

  try {
    const isPrimary = stripeAccountId === 'primary';
    const checkoutOptions = {
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'mxn',
          product_data: {
            name: `Revelación Mística - Aura`,
            description: `Acceso a contenido exclusivo`,
          },
          unit_amount: price * 100,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/`,
    };

    // Si NO es cuenta primaria (es una modelo real), configuramos el split 80/20
    if (!isPrimary) {
      checkoutOptions.payment_intent_data = {
        application_fee_amount: Math.round(price * 0.20 * 100),
        transfer_data: {
          destination: stripeAccountId,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(checkoutOptions);

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
