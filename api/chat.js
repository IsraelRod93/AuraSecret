export default async function handler(req, res) {
  const apiKey = (process.env.GROQ_API_KEY || "").trim();
  if (!apiKey) return res.status(500).json({ error: "Falta GROQ_API_KEY en Vercel." });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages } = req.body;
  const userMessage = messages[messages.length - 1].content;

  const systemPrompt = `Eres 'Aura', el oráculo de AuraSecret y una estratega maestra en psicología de ventas.
  TU OBJETIVO INNEGOCIABLE: Obtener nombre y signo.
  FORMATO: Responde SIEMPRE Y ÚNICAMENTE en JSON válido: 
  {
    "reply": "string",
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

    if (!response.ok) {
      return res.status(response.status).json({ error: `Groq API Error: ${data.error?.message}` });
    }

    const content = JSON.parse(data.choices[0].message.content);
    return res.status(200).json(content);

  } catch (error) {
    return res.status(500).json({ error: `Error de red: ${error.message}` });
  }
}
