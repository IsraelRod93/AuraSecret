export default async function handler(req, res) {
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  
  if (!apiKey) return res.status(500).json({ error: "Falta API Key." });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages } = req.body;
  const userMessage = messages[messages.length - 1].content;

  // URL Directa a la API de Google (v1beta es la más compatible con Flash)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

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
        error: `Google API Error: ${data.error?.message || 'Error desconocido'}.` 
      });
    }

    const responseText = data.candidates[0].content.parts[0].text;
    
    try {
      const cleanJson = responseText.replace(/```json|```/g, '').trim();
      const jsonResponse = JSON.parse(cleanJson);
      return res.status(200).json(jsonResponse);
    } catch (e) {
      return res.status(200).json({ 
        reply: responseText, 
        showMatch: messages.length >= 2 
      });
    }

  } catch (error) {
    return res.status(500).json({ error: `Error de red: ${error.message}` });
  }
}
