import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { modelId, price, stripeAccountId } = req.body;

  try {
    // Calculamos el 20% de comisión para ti
    const applicationFee = Math.round(price * 0.20 * 100); // Stripe usa centavos

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'mxn',
          product_data: {
            name: `Revelación Mística - Aura`,
            description: `Acceso a contenido exclusivo`,
          },
          unit_amount: price * 100, // Precio total en centavos
        },
        quantity: 1,
      }],
      mode: 'payment',
      payment_intent_data: {
        application_fee_amount: applicationFee,
        transfer_data: {
          destination: stripeAccountId,
        },
      },
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/`,
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
