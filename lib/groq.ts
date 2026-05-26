const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GroqOptions {
  messages: GroqMessage[];
  jsonMode?: boolean;
  temperature?: number;
}

const GROQ_TIMEOUT_MS = 8_000;

export async function callGroq({ messages, jsonMode = false, temperature = 0.8 }: GroqOptions) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not configured');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature,
        max_tokens: 150,
        ...(jsonMode && { response_format: { type: 'json_object' } }),
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Groq API error: ${response.status} ${err}`);
    }

    const data = await response.json();
    return data.choices[0].message.content as string;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Groq timeout: la respuesta tardó más de 8 segundos');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
