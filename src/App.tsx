import React, { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMatch, setShowMatch] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages.map(m => ({ role: m.role, content: m.content })) }),
      });

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      if (data.showMatch) {
        setTimeout(() => setShowMatch(true), 1000);
      }
    } catch (error) {
      console.error("Error calling API:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>AURΛ</h1>
        <p style={styles.subtitle}>Tu Oráculo Personal</p>
      </header>

      <div style={styles.chatBox} ref={scrollRef}>
        {messages.length === 0 && (
          <div style={styles.welcome}>
            <p>Dime tu nombre y signo para revelar tu destino...</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={m.role === 'user' ? styles.userMsg : styles.aiMsg}>
            <div style={m.role === 'user' ? styles.userBubble : styles.aiBubble}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div style={styles.loading}>Aura está canalizando...</div>}

        {showMatch && (
          <div style={styles.matchCard}>
            <div style={styles.blurContainer}>
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=500" 
                alt="Destiny Match" 
                style={styles.blurredImg}
              />
              <div style={styles.overlayText}>99% MATCH</div>
            </div>
            <div style={styles.cardContent}>
              <h3 style={styles.cardTitle}>Tu Alma Gemela Detectada</h3>
              <p style={styles.cardDesc}>Tu energía vibra en sintonía con ella. ¿Quieres ver lo que el destino tiene para ti?</p>
              <button style={styles.buyButton} onClick={() => alert("Redirigiendo a pago...")}>
                DESBLOQUEAR FOTOS POR $35 MXN
              </button>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={sendMessage} style={styles.inputArea}>
        <input
          style={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe aquí..."
          disabled={showMatch}
        />
        <button type="submit" style={styles.sendBtn} disabled={loading || showMatch}>
          {loading ? '...' : '✦'}
        </button>
      </form>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    backgroundColor: '#0a0a0c',
    color: '#e0e0e0',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: '"Cinzel", serif',
    maxWidth: '500px',
    margin: '0 auto',
    overflow: 'hidden',
  },
  header: {
    padding: '20px',
    textAlign: 'center',
    borderBottom: '1px solid #2d1b4d',
    background: 'linear-gradient(180deg, #1a0b2e 0%, #0a0a0c 100%)',
  },
  title: {
    margin: 0,
    letterSpacing: '5px',
    color: '#b388ff',
    fontSize: '2rem',
  },
  subtitle: {
    margin: 0,
    fontSize: '0.8rem',
    color: '#7c4dff',
    opacity: 0.8,
  },
  chatBox: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  welcome: {
    textAlign: 'center',
    marginTop: '50px',
    color: '#9e9e9e',
    fontStyle: 'italic',
  },
  userMsg: { alignSelf: 'flex-end', maxWidth: '80%' },
  aiMsg: { alignSelf: 'flex-start', maxWidth: '80%' },
  userBubble: {
    backgroundColor: '#311b92',
    padding: '12px 16px',
    borderRadius: '15px 15px 0 15px',
    fontSize: '0.95rem',
  },
  aiBubble: {
    backgroundColor: '#1a1a1c',
    border: '1px solid #311b92',
    padding: '12px 16px',
    borderRadius: '15px 15px 15px 0',
    fontSize: '0.95rem',
    color: '#d1c4e9',
  },
  loading: {
    fontSize: '0.8rem',
    color: '#b388ff',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  inputArea: {
    padding: '15px',
    display: 'flex',
    gap: '10px',
    backgroundColor: '#121214',
  },
  input: {
    flex: 1,
    backgroundColor: '#1c1c1e',
    border: '1px solid #2d1b4d',
    borderRadius: '25px',
    padding: '12px 20px',
    color: '#fff',
    outline: 'none',
  },
  sendBtn: {
    backgroundColor: '#6200ea',
    border: 'none',
    borderRadius: '50%',
    width: '45px',
    height: '45px',
    color: 'white',
    fontSize: '1.2rem',
    cursor: 'pointer',
    boxShadow: '0 0 15px rgba(98, 0, 234, 0.4)',
  },
  matchCard: {
    backgroundColor: '#1a1a1c',
    borderRadius: '20px',
    overflow: 'hidden',
    border: '2px solid #b388ff',
    marginTop: '20px',
    animation: 'fadeIn 0.5s ease-out',
  },
  blurContainer: {
    position: 'relative',
    height: '250px',
    overflow: 'hidden',
  },
  blurredImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    filter: 'blur(15px)',
    transform: 'scale(1.1)',
  },
  overlayText: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#fff',
    textShadow: '0 0 10px rgba(0,0,0,0.8)',
  },
  cardContent: {
    padding: '20px',
    textAlign: 'center',
  },
  cardTitle: { margin: '0 0 10px 0', color: '#b388ff' },
  cardDesc: { fontSize: '0.85rem', color: '#bdbdbd', marginBottom: '15px' },
  buyButton: {
    backgroundColor: '#ff4081',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '25px',
    fontWeight: 'bold',
    cursor: 'pointer',
    width: '100%',
    boxShadow: '0 0 20px rgba(255, 64, 129, 0.4)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
};

export default App;
