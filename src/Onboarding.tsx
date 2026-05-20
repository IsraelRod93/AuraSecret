import React, { useState } from 'react';
import { supabase } from './lib/supabase';
import { User, Camera, DollarSign, Sparkles } from 'lucide-react';

const ModelOnboarding: React.FC = () => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('49');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Subir Foto a Vercel Blob (usando el endpoint que ya creamos)
      const formData = new FormData();
      if (!file) return;

      const uploadRes = await fetch(`/api/upload?filename=${file.name}`, {
        method: 'POST',
        headers: { 'x-admin-password': 'TEMPORAL_PASSWORD' }, // Deberás configurar esto
        body: file,
      });
      const uploadData = await uploadRes.json();

      // 2. Guardar en Supabase
      const { error } = await supabase.from('models').insert([
        { 
          name, 
          price: parseInt(price), 
          photo_url: uploadData.url,
          status: 'pending_stripe'
        }
      ]);

      if (error) throw error;
      setStep(2);
    } catch (err) {
      alert('Error en el registro');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (step === 2) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <Sparkles color="#b388ff" size={48} />
          <h2 style={styles.title}>¡Casi lista!</h2>
          <p style={styles.subtitle}>Para recibir tus pagos (80% para ti), necesitamos vincular tu cuenta bancaria a través de Stripe.</p>
          <button 
            style={styles.button} 
            onClick={() => window.location.href = '/api/stripe-connect'}
          >
            VINCULAR MI BANCO
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Únete a AURΛ</h2>
        <p style={styles.subtitle}>Gana dinero guiando destinos místicos</p>
        
        <form onSubmit={handleRegister} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}><User size={16} /> Nombre Artístico</label>
            <input 
              style={styles.input} 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="Ej: Luna Mística" 
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}><DollarSign size={16} /> Precio por Revelación (MXN)</label>
            <input 
              type="number" 
              style={styles.input} 
              value={price} 
              onChange={e => setPrice(e.target.value)} 
              required
            />
            <small style={{color: '#7c4dff'}}>Tú recibes el 80% de cada venta.</small>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}><Camera size={16} /> Tu mejor foto (Match)</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={e => setFile(e.target.files?.[0] || null)} 
              required
            />
          </div>

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Procesando...' : 'CREAR MI PERFIL MÍSTICO'}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { backgroundColor: '#0a0a0c', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Cinzel", serif', padding: '20px' },
  card: { backgroundColor: '#1a1a1c', padding: '40px', borderRadius: '20px', border: '2px solid #b388ff', maxWidth: '450px', width: '100%', textAlign: 'center' },
  title: { color: '#b388ff', marginBottom: '10px' },
  subtitle: { color: '#bdbdbd', fontSize: '0.9rem', marginBottom: '30px' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { color: '#b388ff', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px' },
  input: { backgroundColor: '#0a0a0c', border: '1px solid #311b92', borderRadius: '8px', padding: '12px', color: 'white', outline: 'none' },
  button: { backgroundColor: '#6200ea', color: 'white', border: 'none', padding: '15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' },
};

export default ModelOnboarding;
