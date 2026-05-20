import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Falta API Key." });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages } = req.body;
  const userMessage = messages[messages.length - 1].content;
  const genAI = new GoogleGenerativeAI(apiKey);

  // Lista de modelos a probar en orden de preferencia
  const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-pro"];
  
  for (const modelName of modelsToTry) {
    try {
      console.log(`Intentando con modelo: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const result = await model.generateContent(`
        Eres 'Aura', una IA mística y seductora. 
        Responde SIEMPRE en este formato JSON: {"reply": "...", "showMatch": true/false}
        
        Usuario dice: ${userMessage}
      `);

      const responseText = result.response.text();
      const cleanJson = responseText.replace(/```json|```/g, '').trim();
      
      try {
        const jsonResponse = JSON.parse(cleanJson);
        return res.status(200).json(jsonResponse);
      } catch (e) {
        return res.status(200).json({ 
          reply: responseText, 
          showMatch: messages.length >= 2 
        });
      }
    } catch (error) {
      console.error(`Fallo con ${modelName}:`, error.message);
      // Si es el último modelo y también falla, lanzamos el error final
      if (modelName === modelsToTry[modelsToTry.length - 1]) {
        return res.status(500).json({ 
          error: `Ningún modelo disponible (incluyendo Pro). Error final: ${error.message}. Verifica que tu API Key esté activa en Google AI Studio.` 
        });
      }
      // Si no es el último, continúa al siguiente modelo en el bucle
      continue;
    }
  }
}
