"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function PanelLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/panel-auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al iniciar sesión');
        return;
      }

      router.push('/panel/dashboard');
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center font-serif p-5">
      <div className="bg-card p-8 rounded-2xl border-2 border-primary max-w-md w-full">
        <div className="text-center mb-8">
          <Sparkles className="text-primary mx-auto mb-3" size={40} />
          <h1 className="text-primary text-2xl mb-1">Bienvenida</h1>
          <p className="text-muted-foreground text-sm">Inicia sesión en tu panel</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-primary text-xs flex items-center gap-1">
              <Mail size={14} /> Correo electrónico
            </label>
            <input
              type="email"
              className="bg-background border border-border rounded-lg p-3 text-foreground outline-none text-sm"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-primary text-xs flex items-center gap-1">
              <Lock size={14} /> Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="bg-background border border-border rounded-lg p-3 pr-10 text-foreground outline-none text-sm w-full"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            className="bg-primary text-primary-foreground p-4 rounded-lg font-bold mt-2 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'ENTRAR'}
          </button>
        </form>

        <p className="text-center text-muted-foreground text-sm mt-6">
          ¿No tienes cuenta?{' '}
          <a href="/panel/register" className="text-primary underline">Regístrate</a>
        </p>
      </div>
    </div>
  );
}
