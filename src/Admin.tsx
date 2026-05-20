import React, { useState } from 'react';
import { Upload, Lock, CheckCircle, AlertCircle } from 'lucide-react';

const AdminPanel: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !password) return;

    setLoading(true);
    setError('');
    setUrl('');

    try {
      const response = await fetch(`/api/upload?filename=${file.name}`, {
        method: 'POST',
        headers: {
          'x-admin-password': password,
        },
        body: file,
      });

      const data = await response.json();

      if (response.ok) {
        setUrl(data.url);
      } else {
        setError(data.error || 'Fallo en la subida');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Panel de Modelos - Aura</h2>
        <p style={styles.subtitle}>Sube tu foto mística para el oráculo</p>

        <form onSubmit={handleUpload} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}><Lock size={16} /> Contraseña de Acceso</label>
            <input
              type="password"
              style={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña del oráculo..."
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}><Upload size={16} /> Seleccionar Foto</label>
            <input
              type="file"
              accept="image/*"
              style={styles.fileInput}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <button type="submit" style={styles.button} disabled={loading || !file || !password}>
            {loading ? 'Subiendo energía...' : 'SUBIR FOTO AL ORÁCULO'}
          </button>
        </form>

        {url && (
          <div style={styles.success}>
            <CheckCircle color="#4caf50" />
            <p>¡Foto subida con éxito!</p>
            <input readOnly value={url} style={styles.urlDisplay} onClick={(e) => (e.target as HTMLInputElement).select()} />
            <small>Copia este link y envíaselo al administrador</small>
          </div>
        )}

        {error && (
          <div style={styles.error}>
            <AlertCircle color="#f44336" />
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    backgroundColor: '#0a0a0c',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '"Cinzel", serif',
    padding: '20px',
  },
  card: {
    backgroundColor: '#1a1a1c',
    padding: '40px',
    borderRadius: '20px',
    border: '2px solid #311b92',
    maxWidth: '400px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 0 30px rgba(49, 27, 146, 0.3)',
  },
  title: { color: '#b388ff', margin: '0 0 10px 0' },
  subtitle: { color: '#7c4dff', fontSize: '0.9rem', marginBottom: '30px' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputGroup: { textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { color: '#bdbdbd', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px' },
  input: {
    backgroundColor: '#0a0a0c',
    border: '1px solid #311b92',
    borderRadius: '8px',
    padding: '12px',
    color: 'white',
    outline: 'none',
  },
  fileInput: {
    color: '#bdbdbd',
    fontSize: '0.8rem',
  },
  button: {
    backgroundColor: '#6200ea',
    color: 'white',
    border: 'none',
    padding: '15px',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '10px',
    transition: '0.3s',
  },
  success: {
    marginTop: '30px',
    padding: '20px',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: '10px',
    border: '1px solid #4caf50',
  },
  urlDisplay: {
    width: '100%',
    backgroundColor: '#0a0a0c',
    border: '1px solid #311b92',
    color: '#b388ff',
    padding: '8px',
    borderRadius: '5px',
    marginTop: '10px',
    fontSize: '0.75rem',
  },
  error: {
    marginTop: '20px',
    color: '#f44336',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
  },
};

export default AdminPanel;
