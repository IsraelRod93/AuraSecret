import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // 1. Diagnóstico de Variable de Entorno
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ 
      error: "La llave (GEMINI_API_KEY) no está llegando al servidor de Vercel. Verifica que la agregaste en 'Settings > Environment Variables' del PROYECTO y no del equipo." 
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const systemPrompt = `Eres 'Aura', una IA mística y seductora. Responde siempre en JSON: { "reply": "...", "showMatch": true/false }.`;

    const chat = model.startChat({
      history: (messages || []).slice(0, -1).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      })),
    });

    const userMessage = messages[messages.length - 1].content;
    const result = await chat.sendMessage(userMessage);
    const responseText = result.response.text();
    
    try {
        const cleanJson = responseText.replace(/```json|```/g, '').trim();
        const jsonResponse = JSON.parse(cleanJson);
        return res.status(200).json(jsonResponse);
    } catch (e) {
        return res.status(200).json({ reply: responseText, showMatch: messages.length >= 2 });
    }

  } catch (error) {
    console.error("Gemini Error:", error);
    // 2. Diagnóstico de error de Google
    return res.status(500).json({ 
      error: `Google rechazó la llave. Detalles: ${error.message || 'Error desconocido'}. Asegúrate de que la llave sea de 'Google AI Studio' y no de 'Google Cloud'.` 
    });
  }
}
