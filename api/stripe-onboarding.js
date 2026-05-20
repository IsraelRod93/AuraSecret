import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { modelId } = req.body;

  try {
    // 1. Crear cuenta de Stripe Connect Express para la modelo
    const account = await stripe.accounts.create({
      type: 'express',
      capabilities: {
        transfers: { requested: true },
      },
    });

    // 2. Generar el link de Onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${req.headers.origin}/join?error=retry`,
      return_url: `${req.headers.origin}/join?success=true`,
      type: 'account_onboarding',
    });

    // 3. En un entorno real, aquí guardaríamos el account.id en Supabase para ese modelId
    // Pero para el MVP, devolvemos el ID para que la modelo lo complete.

    return res.status(200).json({ url: accountLink.url, accountId: account.id });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
