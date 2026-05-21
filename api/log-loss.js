import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId, lastAiMessage, lastUserMessage, currentPhase } = req.body;

  try {
    const { error } = await supabase.from('loss_logs').insert([
      { 
        user_id: userId, 
        last_ai_message: lastAiMessage, 
        last_user_message: lastUserMessage, 
        current_phase: currentPhase 
      }
    ]);

    if (error) throw error;
    return res.status(200).json({ status: 'success' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
