"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Globe, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { OracleOrb } from '@/components/oracle-orb';
import { CelestialBackground } from '@/components/celestial-background';

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
    <div className="absolute inset-0 flex flex-col px-[22px] py-[76px] pb-7 overflow-hidden">
      <CelestialBackground />
      
      <button onClick={() => router.back()} className="bg-transparent border-none text-fg-muted cursor-pointer p-1 mb-[22px] self-start inline-flex items-center gap-1 text-[12px] relative z-10">
        <ArrowLeft size={16} /> Atrás
      </button>

      <div className="text-center mb-7 relative z-10">
        <div className="grid place-items-center mb-4">
          <OracleOrb size={120} />
        </div>
        <div className="serif gradient-text text-[24px] tracking-[0.32em] font-light">
          AURA
        </div>
        <div className="serif text-[16px] text-fg-soft mt-3 italic">
          Bienvenida de vuelta
        </div>
      </div>

      <form onSubmit={handleLogin} className="flex flex-col gap-3.5 mb-[22px] relative z-10">
        <div className="space-y-1.5">
          <label className="inline-flex items-center gap-1.5 text-[11px] text-primary font-medium tracking-wide uppercase pl-1">
            <Globe size={12} /> Email
          </label>
          <input
            type="email"
            className="input-aura"
            autoFocus
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="inline-flex items-center gap-1.5 text-[11px] text-primary font-medium tracking-wide uppercase pl-1">
            <Lock size={12} /> Contraseña
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              className="input-aura pr-10"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Tu contraseña"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground bg-transparent border-none cursor-pointer"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <a className="self-end text-[11px] text-primary cursor-pointer underline underline-offset-[3px] block text-right mt-1">
            ¿Olvidaste tu contraseña?
          </a>
        </div>

        {error && (
          <p className="text-red-400 text-[12px] text-center mt-1">{error}</p>
        )}

        <button
          type="submit"
          className="btn-primary w-full mt-2"
          disabled={loading || !email.includes('@') || password.length < 6}
          style={{ opacity: (loading || !email.includes('@') || password.length < 6) ? 0.45 : 1 }}
        >
          {loading ? 'Entrando...' : 'Iniciar sesión'}
        </button>
      </form>

      <div className="relative my-[22px] mx-0 relative z-10">
        <div className="divider" />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-[10px] text-fg-muted tracking-[0.18em]">
          O
        </span>
      </div>

      <button className="btn-ghost w-full relative z-10">
        <span className="inline-flex items-center gap-2">
          <Sparkles size={14} /> Continuar con Telegram
        </span>
      </button>
      
      <p className="text-center text-fg-muted text-[11px] mt-auto relative z-10">
        ¿No tienes cuenta?{' '}
        <a href="/panel/register" className="text-primary underline underline-offset-2">Regístrate</a>
      </p>
    </div>
  );
}
