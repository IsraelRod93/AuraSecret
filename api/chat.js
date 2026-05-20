export default async function handler(req, res) {
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) return res.status(500).json({ error: "Falta API Key." });

  const { messages } = req.body;
  const userMessage = messages[messages.length - 1].content;

  // Forzamos el modelo 2.0 Flash que es el más estable y con mejor cuota gratuita
  const modelName = "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `Eres 'Aura', una IA mística. Responde en JSON: {"reply": "...", "showMatch": true/false}. Usuario: ${userMessage}` }]
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `Error de Cuota/API: ${data.error?.message || 'Intenta de nuevo en unos segundos.'}` 
      });
    }

    const responseText = data.candidates[0].content.parts[0].text;
    const cleanJson = responseText.replace(/```json|```/g, '').trim();
    
    try {
      return res.status(200).json(JSON.parse(cleanJson));
    } catch (e) {
      return res.status(200).json({ reply: responseText, showMatch: messages.length >= 2 });
    }

  } catch (error) {
    return res.status(500).json({ error: `Error de red: ${error.message}` });
  }
}
