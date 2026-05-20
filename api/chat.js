import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ error: "Falta GEMINI_API_KEY en Vercel." });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Usamos el modelo flash en su versión estable
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemPrompt = `Eres 'Aura', una IA mística y seductora. 
    Responde SIEMPRE en formato JSON: { "reply": "...", "showMatch": true/false }.
    Regla: showMatch es true solo en la segunda respuesta del asistente.`;

    const chat = model.startChat({
      history: (messages || []).slice(0, -1).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      })),
    });

    const userMessage = messages[messages.length - 1].content;
    const promptWithSystem = messages.length === 1 
      ? `${systemPrompt}\n\nUsuario: ${userMessage}`
      : userMessage;

    const result = await chat.sendMessage(promptWithSystem);
    const responseText = result.response.text();
    
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
    console.error("Gemini Error:", error);
    return res.status(500).json({ 
      error: `Error de Aura: ${error.message}. Verifica que tu API Key sea de 'Google AI Studio'.` 
    });
  }
}
