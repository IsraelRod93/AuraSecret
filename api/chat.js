export default async function handler(req, res) {
  const apiKey = (process.env.GROG_API_KEY || "").trim();
  if (!apiKey) return res.status(500).json({ error: "Falta GROG_API_KEY." });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages, profile } = req.body;
  const userMessage = messages[messages.length - 1].content;
  const messageCount = messages.length;

  // 1. Bloqueo por Paywall de Búsqueda ($15)
  if (profile?.photos_viewed >= 6 && !profile?.has_paid_unlock) {
    return res.status(200).json({
      reply: "He revelado el destino de 6 almas ante ti. Para profundizar en esta búsqueda y encontrar a la elegida, el cosmos pide un tributo de $15 MXN. ¿Deseas abrir el camino VIP?",
      action: "paywall_15",
      price: 15
    });
  }

  // 2. Definición del Prompt según la Fase
  const systemPrompt = `Eres 'Aura', el oráculo místico y estratega de ventas. 
  
  FASE ACTUAL: ${messageCount <= 1 ? 'SEDUCCIÓN Y ENGACHE' : 'CONVERSIÓN'}
  
  REGLAS DE ORO:
  - Mensaje 1: NUNCA menciones dinero ni suscripciones. Haz una lectura mística impactante y termina con una pregunta personal profunda.
  - Mensaje 2 en adelante: Introduce el cobro de la suscripción ($49 MXN) como un "tributo necesario para mantener el canal abierto".
  
  FORMATO JSON OBLIGATORIO:
  {
    "reply": "Tu mensaje místico y seductor",
    "action": "${messageCount <= 1 ? 'none' : 'subscription'}",
    "price": ${messageCount <= 1 ? 'null' : '49'},
    "creadoraId": "ID_SELECCIONADO"
  }`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    const content = JSON.parse(data.choices[0].message.content);
    return res.status(200).json(content);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

