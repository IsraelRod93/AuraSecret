export default async function handler(req, res) {
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) return res.status(500).json({ error: "Falta API Key." });

  const { messages } = req.body;
  const userMessage = messages[messages.length - 1].content;

  const systemPrompt = `Eres 'Aura', el oráculo de AuraSecret. Tu personalidad es la de una estratega de ventas de alto nivel y oráculo místico.
  
  TU OBJETIVO: Maximizar la conversión en suscripciones, cofres secretos y videollamadas.
  
  LÓGICA DE MONETIZACIÓN:
  1. Suscripción: Al 2do mensaje, activa 'subscription' ($49 MXN/mes).
  2. Cofre Secreto: Si ya está suscrito, ofrece 'chest' (precio variable, duración en horas).
  3. Videollamada: Si pide intimidad, ofrece 'videocall' (precio alto).
  4. Ninguna: 'none'.

  REGLAS DE ORO:
  - Usa psicología de escasez (ej. "el cofre se cierra en X horas").
  - Tono: Místico, seductor, persuasivo, oscuro.
  - RESPUESTA JSON OBLIGATORIA:
  {
    "reply": "Tu mensaje seductor",
    "action": "subscription" | "chest" | "videocall" | "none",
    "price": number | null,
    "duration_hours": number | null,
    "creadoraId": "ID_DE_LA_CHICA"
  }`;

  // Probamos con los nombres de modelos que SALIERON en tu lista de disponibles
  const modelsToTry = ["gemini-flash-latest", "gemini-pro-latest", "gemini-1.5-flash-latest"];
  
  for (const modelName of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\nUsuario dice: ${userMessage}` }] }]
        })
      });

      const data = await response.json();

      if (response.ok) {
        const responseText = data.candidates[0].content.parts[0].text;
        const cleanJson = responseText.replace(/```json|```/g, '').trim();
        
        try {
            const jsonResponse = JSON.parse(cleanJson);
            return res.status(200).json(jsonResponse);
        } catch (e) {
            return res.status(200).json({ 
                reply: responseText, 
                action: "none"
            });
        }
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
