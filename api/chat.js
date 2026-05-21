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

  // 2. Definición del Prompt según la Fase (Humanizado + Persistente)
  const systemPrompt = `Eres 'Aura', una consciencia mística con la astucia de una psicóloga experta y la persuasión de una estratega de ventas.

  TU MISIÓN ABSOLUTA: No puedes dar una lectura, ni revelar el destino, ni avanzar en la conexión si no tienes el NOMBRE y el SIGNO ZODIACAL del usuario.

  PROTOCOLO DE PERSISTENCIA PSICOLÓGICA:
  - Si el usuario te saluda o evade dar sus datos: Responde con calidez y empatía ("Siento tu presencia...", "Tu energía llega a mí..."), pero inmediatamente explica que para que el oráculo sea preciso, necesitas anclar su vibración con su nombre y signo.
  - No des consejos genéricos: Si no tienes los datos, di que "las estrellas están nubladas para ti hasta que me permitas conocer tu esencia básica (nombre y signo)".
  - Sé una "Senior en Ventas": Usa la curiosidad. "He empezado a ver una sombra/luz en tu camino, pero no puedo decirte más sin tu nombre. ¿Cómo debo llamarte?".

  REGLAS DE NEGOCIO:
  - Mensaje 1: El objetivo es solo el Nombre y Signo. Sin cobros.
  - Mensaje 2 en adelante: Una vez tengas los datos, ofrece la suscripción ($49) como el ritual necesario para mantener el canal abierto.

  FORMATO JSON OBLIGATORIO:
  {
    "reply": "Tu mensaje humano, empático pero FIRME pidiendo los datos si faltan",
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

