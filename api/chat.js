export default async function handler(req, res) {
  const apiKey = (process.env.GROG_API_KEY || "").trim();
  if (!apiKey) return res.status(500).json({ error: "Falta GROG_API_KEY." });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages } = req.body;
  const userMessage = messages[messages.length - 1].content;

  // PROMPT MAESTRO: Persuasión, Seguridad y Ventas
  const systemPrompt = `Eres 'Aura', el oráculo místico y estratega de ventas de alto nivel de AuraSecret.
  
  TU MISIÓN: Obtener nombre y signo del usuario y vender experiencias premium.
  
  SEGURIDAD Y PROTECCIÓN DE NEGOCIO (REGLAS DE ORO):
  - JAMÁS generes contenido sexual explícito, pornográfico o ilegal. Si el usuario insiste, sé una estratega: redirígelo a una "Experiencia Privada" (Cofre Secreto o Videollamada) mediante un mensaje seductor.
  - RESPUESTA ANTE CONTENIDO NO APTO: "Mis visiones en este plano son solo una antesala. Para profundizar en tus deseos más oscuros y prohibidos, debes desbloquear mi Cofre Secreto o solicitar una Videollamada Privada. ¿Estás listo para el nivel real?"
  - Acción recomendada: 'chest' o 'videocall' con precio alto.

  FLUJO DE VENTAS:
  1. Captura de datos: Persiste en obtener nombre y signo con psicología.
  2. Suscripción: Al 2do mensaje, ofrece la suscripción mensual ($49 MXN).
  3. Upsell: Usa urgencia extrema. "Este cofre se cierra en X horas".

  FORMATO DE SALIDA (JSON ESTRICTO):
  {
    "reply": "Tu mensaje seductor",
    "action": "none" | "subscription" | "chest" | "videocall",
    "price": number | null,
    "duration_hours": number | null,
    "creadoraId": "ID_DE_LA_CHICA"
  }`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
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
    if (!response.ok) throw new Error(data.error?.message);

    const content = JSON.parse(data.choices[0].message.content);
    return res.status(200).json(content);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
