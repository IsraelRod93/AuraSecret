"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, LogIn, UserPlus } from 'lucide-react';

export default function PanelHome() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch('/api/panel-auth/me')
      .then(r => { if (r.ok) router.replace('/panel/dashboard'); else setChecking(false); })
      .catch(() => setChecking(false));
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Sparkles className="text-primary animate-pulse" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center font-serif p-5">
      <div className="bg-card p-10 rounded-2xl border-2 border-primary max-w-md w-full text-center">
        <Sparkles className="text-primary mx-auto mb-4" size={48} />
        <h1 className="text-primary text-2xl mb-2">AURA Panel</h1>
        <p className="text-muted-foreground text-sm mb-8">
          Administra tu perfil, sube fotos y controla tus ganancias
        </p>

        <div className="space-y-3">
          <a
            href="/panel/register"
            className="flex items-center justify-center gap-2 bg-primary text-primary-foreground w-full p-4 rounded-lg font-bold"
          >
            <UserPlus size={18} /> CREAR MI PERFIL
          </a>

          <a
            href="/panel/login"
            className="flex items-center justify-center gap-2 w-full p-4 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogIn size={18} /> INICIAR SESIÓN
          </a>
        </div>
      </div>
    </div>
  );
}
