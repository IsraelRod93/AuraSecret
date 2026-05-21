"use client";

import { useState } from 'react';
import { Upload, Lock, CheckCircle, AlertCircle } from 'lucide-react';

export default function AdminPage() {
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
      const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
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
    } catch {
      setError('Error de conexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background min-h-screen flex items-center justify-center font-serif p-5">
      <div className="bg-card p-10 rounded-2xl border-2 border-border max-w-md w-full text-center shadow-[0_0_30px_rgba(49,27,146,0.3)]">
        <h2 className="text-primary mb-2">Panel de Modelos - Aura</h2>
        <p className="text-muted-foreground text-sm mb-8">Sube tu foto mistica para el oraculo</p>

        <form onSubmit={handleUpload} className="flex flex-col gap-5">
          <div className="text-left flex flex-col gap-2">
            <label className="text-muted-foreground text-xs flex items-center gap-1">
              <Lock size={16} /> Contrasena de Acceso
            </label>
            <input
              type="password"
              className="bg-background border border-border rounded-lg p-3 text-foreground outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contrasena del oraculo..."
            />
          </div>

          <div className="text-left flex flex-col gap-2">
            <label className="text-muted-foreground text-xs flex items-center gap-1">
              <Upload size={16} /> Seleccionar Foto
            </label>
            <input
              type="file"
              accept="image/*"
              className="text-muted-foreground text-sm"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <button
            type="submit"
            className="bg-primary text-primary-foreground border-none p-4 rounded-lg font-bold cursor-pointer mt-2 transition-colors hover:bg-primary/90 disabled:opacity-50"
            disabled={loading || !file || !password}
          >
            {loading ? 'Subiendo energia...' : 'SUBIR FOTO AL ORACULO'}
          </button>
        </form>

        {url && (
          <div className="mt-8 p-5 bg-green-500/10 rounded-xl border border-green-500">
            <CheckCircle className="text-green-500 mx-auto" />
            <p className="text-foreground mt-2">Foto subida con exito!</p>
            <input
              readOnly
              value={url}
              className="w-full bg-background border border-border text-primary p-2 rounded mt-2 text-xs"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <small className="text-muted-foreground">Copia este link</small>
          </div>
        )}

        {error && (
          <div className="mt-5 text-destructive flex items-center justify-center gap-2">
            <AlertCircle />
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
