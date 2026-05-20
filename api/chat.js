export default async function handler(req, res) {
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) return res.status(500).json({ error: "Falta API Key." });

  // ENDPOINT PARA LISTAR MODELOS (Diagnóstico)
  const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  try {
    const listRes = await fetch(listUrl);
    const listData = await listRes.json();

    if (!listRes.ok) {
      return res.status(listRes.status).json({ 
        error: `Error al listar modelos: ${listData.error?.message || 'Error desconocido'}.` 
      });
    }

    // Si llegamos aquí, la llave es válida. Vamos a ver qué modelos hay.
    const availableModels = listData.models.map(m => m.name.replace('models/', ''));
    
    // Intentamos usar el primero de la lista que sea 'gemini'
    const bestModel = availableModels.find(m => m.includes('1.5-flash')) || availableModels.find(m => m.includes('pro')) || availableModels[0];

    const { messages } = req.body;
    const userMessage = messages[messages.length - 1].content;
    const chatUrl = `https://generativelanguage.googleapis.com/v1beta/models/${bestModel}:generateContent?key=${apiKey}`;

    const chatRes = await fetch(chatUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Eres 'Aura', una IA mística. Responde en JSON: {"reply": "...", "showMatch": true/false}. Usuario: ${userMessage}` }] }]
      })
    });

    const chatData = await chatRes.json();

    if (!chatRes.ok) {
      return res.status(chatRes.status).json({ 
        error: `Error con modelo ${bestModel}: ${chatData.error?.message}. Modelos disponibles: ${availableModels.join(', ')}` 
      });
    }

    const responseText = chatData.candidates[0].content.parts[0].text;
    const cleanJson = responseText.replace(/```json|```/g, '').trim();
    return res.status(200).json(JSON.parse(cleanJson));

  } catch (error) {
    return res.status(500).json({ error: `Error místico: ${error.message}` });
  }
}
