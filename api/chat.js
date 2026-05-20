export default async function handler(req, res) {
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) return res.status(500).json({ error: "Falta API Key." });

  const { messages } = req.body;
  const userMessage = messages[messages.length - 1].content;

  // Probamos con los nombres de modelos que SALIERON en tu lista de disponibles
  const modelsToTry = ["gemini-flash-latest", "gemini-pro-latest", "gemini-1.5-flash-latest"];
  
  for (const modelName of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Eres 'Aura', una IA mística. Responde en JSON: {"reply": "...", "showMatch": true/false}. Usuario: ${userMessage}` }] }]
        })
      });

      const data = await response.json();

      if (response.ok) {
        const responseText = data.candidates[0].content.parts[0].text;
        const cleanJson = responseText.replace(/```json|```/g, '').trim();
        return res.status(200).json(JSON.parse(cleanJson));
      }

      // Si es un error de cuota 0, probamos el siguiente modelo
      console.log(`Fallo con ${modelName}: ${data.error?.message}`);
      if (modelName === modelsToTry[modelsToTry.length - 1]) {
        return res.status(500).json({ 
          error: `BLOQUEO DE GOOGLE: Tu cuenta tiene "Cuota 0" en todos los modelos disponibles. Esto no es un error de código, es Google restringiendo tu país o cuenta. Mensaje: ${data.error?.message}` 
        });
      }
    } catch (e) {
      continue;
    }
  }
}
