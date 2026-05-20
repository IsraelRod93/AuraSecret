import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || !apiKey.startsWith('AIza')) {
    return res.status(500).json({ error: "La API Key no parece válida o no empieza con 'AIza'. Búscala en Google AI Studio." });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Intentamos con el modelo más reciente y estable
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    const result = await model.generateContent(messages[messages.length - 1].content);
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
    
    // Si falla el modelo flash, intentamos con el Pro original como último recurso
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const modelFallback = genAI.getGenerativeModel({ model: "gemini-pro" });
        const resultFallback = await modelFallback.generateContent(messages[messages.length - 1].content);
        return res.status(200).json({ 
            reply: resultFallback.response.text(), 
            showMatch: messages.length >= 2 
        });
    } catch (fallbackError) {
        return res.status(500).json({ 
            error: `Error crítico: Google no encuentra el modelo. Esto pasa si tu API Key es muy antigua o de Google Cloud. Por favor, genera una NUEVA en aistudio.google.com.` 
        });
    }
  }
}
