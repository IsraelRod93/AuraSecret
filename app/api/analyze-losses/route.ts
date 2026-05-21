import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { callGroq } from '@/lib/groq';

export async function GET() {
  try {
    const { data: logs, error: dbError } = await getSupabase()
      .from('loss_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (dbError) throw dbError;

    if (!logs || logs.length === 0) {
      return NextResponse.json({ reply: "Aun no hay suficientes datos de perdida para analizar." });
    }

    const analysis = await callGroq({
      messages: [
        {
          role: 'system',
          content: 'Eres un experto en Optimizacion de Tasa de Conversion (CRO) y Psicologia de Ventas. Tu objetivo es analizar logs de conversaciones abandonadas y encontrar POR QUE el cliente se fue.',
        },
        {
          role: 'user',
          content: `Analiza estos logs de abandonos y dime: 1. Patron comun de salida. 2. Recomendacion para el prompt de Aura.\nLogs: ${JSON.stringify(logs)}`,
        },
      ],
    });

    return NextResponse.json({ analysis });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
