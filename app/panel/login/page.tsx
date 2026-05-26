"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Globe, Lock, Eye, EyeOff, ArrowLeft, X } from 'lucide-react';
import { OracleOrb } from '@/components/oracle-orb';
import { CelestialBackground } from '@/components/celestial-background';
import { Spinner } from '@/components/ui/spinner';

type ResetStep = 'email' | 'code';

export default function PanelLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(false);

  // Forgot password modal state
  const [showReset, setShowReset] = useState(false);
  const [resetStep, setResetStep] = useState<ResetStep>('email');
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleTelegram = async () => {
    setTelegramLoading(true);
    try {
      const tg = (window as any).Telegram?.WebApp;
      const botUrl = 'https://t.me/AuraSecretx_bot';

      if (tg?.initData) {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData: tg.initData }),
        });
        if (res.ok) {
          router.push('/panel/dashboard');
          return;
        }
        window.location.reload();
      } else {
        window.location.href = botUrl;
      }
    } catch {
      // fallback
      window.location.href = 'https://t.me/AuraSecretx_bot';
    } finally {
      setTelegramLoading(false);
    }
  };

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

  const openReset = () => {
    setResetEmail(email); // pre-fill with whatever they typed
    setResetStep('email');
    setResetError('');
    setResetSuccess(false);
    setShowReset(true);
  };

  const handleRequestOtp = async () => {
    if (!resetEmail.includes('@')) { setResetError('Ingresa un email válido'); return; }
    setResetLoading(true);
    setResetError('');
    try {
      const res = await fetch('/api/panel-auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResetError(data.error || 'Error al enviar código');
        return;
      }
      setResetStep('code');
    } catch {
      setResetError('Error de conexión');
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetOtp || resetOtp.length < 6) { setResetError('Ingresa el código de 6 dígitos'); return; }
    if (resetNewPassword.length < 8) { setResetError('La contraseña debe tener al menos 8 caracteres'); return; }
    setResetLoading(true);
    setResetError('');
    try {
      const res = await fetch('/api/panel-auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, otp: resetOtp, newPassword: resetNewPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResetError(data.error || 'Error al cambiar contraseña');
        return;
      }
      setResetSuccess(true);
      // Pre-fill login form with new password
      setEmail(resetEmail);
      setPassword(resetNewPassword);
      setTimeout(() => setShowReset(false), 2000);
    } catch {
      setResetError('Error de conexión');
    } finally {
      setResetLoading(false);
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
          <button
            type="button"
            onClick={openReset}
            className="self-end text-[11px] text-primary cursor-pointer underline underline-offset-[3px] block text-right mt-1 bg-transparent border-none p-0"
          >
            ¿Olvidaste tu contraseña?
          </button>
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

      <button
        className="btn-ghost w-full relative z-10"
        onClick={handleTelegram}
        disabled={telegramLoading}
        style={{ opacity: telegramLoading ? 0.45 : 1 }}
      >
        <span className="inline-flex items-center gap-2">
          <Sparkles size={14} /> {telegramLoading ? 'Conectando...' : 'Continuar con Telegram'}
        </span>
      </button>
      
      <p className="text-center text-fg-muted text-[11px] mt-auto relative z-10">
        ¿No tienes cuenta?{' '}
        <a href="/panel/register" className="text-primary underline underline-offset-2">Regístrate</a>
      </p>

      {/* ── Forgot password modal ── */}
      {showReset && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm px-4 pb-8">
          <div className="w-full max-w-sm bg-background border border-border rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-base text-foreground">
                {resetStep === 'email' ? 'Recuperar contraseña' : 'Ingresa el código'}
              </h3>
              <button
                onClick={() => setShowReset(false)}
                className="text-muted-foreground bg-transparent border-none cursor-pointer p-1"
              >
                <X size={18} />
              </button>
            </div>

            {resetSuccess ? (
              <p className="text-green-400 text-sm text-center py-4">
                ✓ Contraseña cambiada. Iniciando sesión...
              </p>
            ) : resetStep === 'email' ? (
              <>
                <p className="text-xs text-muted-foreground">
                  Te enviaremos un código de 6 dígitos por Telegram al número vinculado con tu cuenta.
                </p>
                <input
                  type="email"
                  className="input-aura w-full"
                  placeholder="tu@email.com"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  autoFocus
                />
                {resetError && <p className="text-red-400 text-xs">{resetError}</p>}
                <button
                  onClick={handleRequestOtp}
                  disabled={resetLoading || !resetEmail.includes('@')}
                  className="btn-primary w-full"
                  style={{ opacity: (resetLoading || !resetEmail.includes('@')) ? 0.45 : 1 }}
                >
                  {resetLoading ? 'Enviando...' : 'Enviar código por Telegram'}
                </button>
              </>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  Revisa tu Telegram. Ingresa el código de 6 dígitos y tu nueva contraseña.
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className="input-aura w-full text-center text-xl tracking-[0.4em] font-bold"
                  placeholder="123456"
                  value={resetOtp}
                  onChange={e => setResetOtp(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                />
                <input
                  type="password"
                  className="input-aura w-full"
                  placeholder="Nueva contraseña (mín. 8 caracteres)"
                  value={resetNewPassword}
                  onChange={e => setResetNewPassword(e.target.value)}
                />
                {resetError && <p className="text-red-400 text-xs">{resetError}</p>}
                <button
                  onClick={handleResetPassword}
                  disabled={resetLoading || resetOtp.length < 6 || resetNewPassword.length < 8}
                  className="btn-primary w-full"
                  style={{ opacity: (resetLoading || resetOtp.length < 6 || resetNewPassword.length < 8) ? 0.45 : 1 }}
                >
                  {resetLoading ? 'Cambiando...' : 'Cambiar contraseña'}
                </button>
                <button
                  onClick={() => { setResetStep('email'); setResetError(''); }}
                  className="w-full text-xs text-muted-foreground bg-transparent border-none cursor-pointer"
                >
                  ← Volver / reenviar código
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
