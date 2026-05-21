import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const GROG_KEY = process.env.GROG_API_KEY;

export default async function handler(req, res) {
  try {
    // 1. Obtener los últimos logs de pérdida
    const { data: logs, error: dbError } = await supabase
      .from('loss_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (dbError) throw dbError;

    if (!logs || logs.length === 0) {
      return res.status(200).json({ reply: "Aún no hay suficientes datos de pérdida para analizar." });
    }

    // 2. Pedirle a la IA que analice patrones
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROG_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { 
            role: "system", 
            content: "Eres un experto en Optimización de Tasa de Conversión (CRO) y Psicología de Ventas. Tu objetivo es analizar logs de conversaciones abandonadas y encontrar POR QUÉ el cliente se fue." 
          },
          { 
            role: "user", 
            content: `Analiza estos logs de abandonos y dime: 1. Patrón común de salida. 2. Recomendación para el prompt de Aura. 
            Logs: ${JSON.stringify(logs)}` 
          }
        ]
      })
    });

    const aiData = await response.json();
    return res.status(200).json({ analysis: aiData.choices[0].message.content });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
