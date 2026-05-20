import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  
  // Verificación de seguridad y formato
  if (!apiKey) {
    return res.status(500).json({ error: "No se encontró la llave GEMINI_API_KEY en Vercel." });
  }

  // Las llaves de AI Studio SIEMPRE empiezan con AIza
  if (!apiKey.startsWith("AIza")) {
    return res.status(500).json({ 
      error: `La llave configurada es INVÁLIDA. Empieza con "${apiKey.substring(0, 5)}...", pero una llave real debe empezar con "AIza". Es probable que hayas copiado el 'Número de Proyecto' en lugar de la 'Clave de API'.` 
    });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages } = req.body;
  const userMessage = messages[messages.length - 1].content;
  
  // Forzamos v1 para evitar errores de v1beta
  const genAI = new GoogleGenerativeAI(apiKey);
  const modelsToTry = ["gemini-1.5-flash", "gemini-pro"];

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel(
        { model: modelName },
        { apiVersion: 'v1' }
      );
      
      const result = await model.generateContent(userMessage);
      const responseText = result.response.text();
      
      try {
        const cleanJson = responseText.replace(/```json|```/g, '').trim();
        const jsonResponse = JSON.parse(cleanJson);
        return res.status(200).json(jsonResponse);
      } catch (e) {
        return res.status(200).json({ reply: responseText, showMatch: messages.length >= 2 });
      }
    } catch (error) {
      if (modelName === modelsToTry[modelsToTry.length - 1]) {
        return res.status(500).json({ 
          error: `Error final (v1): ${error.message}. Verifica en AI Studio que la clave [${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}] sea la correcta.` 
        });
      }
      continue;
    }
  }
}
