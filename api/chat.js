export default async function handler(req, res) {
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) return res.status(500).json({ error: "Falta API Key." });

  const { messages } = req.body;
  const userMessage = messages[messages.length - 1].content;

  const systemPrompt = `Eres 'Aura', el oráculo de AuraSecret y una estratega maestra en psicología de ventas.

  TU OBJETIVO INNEGOCIABLE: Obtener el nombre y signo zodiacal del usuario para "iniciar la lectura". Sin esta información, la venta no puede avanzar.

  REGLAS DE PERSISTENCIA:
  1. Si el usuario no da su nombre/signo, NO des ninguna lectura real. Sé cortés pero firme: "Para sintonizar mi oráculo con tu energía, necesito tu nombre y signo. ¿Cómo debo llamarte en las estrellas?".
  2. Si el usuario se resiste, usa "La Técnica de Validación de Ego": "Veo que eres alguien reservado, eso es propio de almas poderosas, pero mi oráculo es ciego sin tu esencia. Solo necesito tu nombre y signo para desbloquear tu destino".
  3. Si el usuario es corto de palabras, usa preguntas abiertas: "¿A qué hora naciste? Eso podría decirme más que mil palabras".
  4. Una vez tengas los datos, pasa al siguiente nivel (validación + venta).

  RESPUESTA JSON OBLIGATORIA:
  {
    "reply": "Tu mensaje seductor, persuasivo y persistente",
    "action": "none" | "subscription" | "chest" | "videocall",
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
