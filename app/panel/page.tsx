"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, LogIn } from 'lucide-react';

function getCookie(name: string) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
}

export default function PanelHome() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('companionId') || getCookie('companionId');
    if (saved) {
      setCookie('companionId', saved);
      localStorage.setItem('companionId', saved);
      router.replace(`/panel/${saved}`);
    } else {
      setChecking(false);
    }
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
            href="/panel/join"
            className="block bg-primary text-primary-foreground w-full p-4 rounded-lg font-bold"
          >
            CREAR MI PERFIL
          </a>

          <button
            onClick={() => {
              const id = prompt('Ingresa tu ID de companera:');
              if (id) {
                setCookie('companionId', id);
                localStorage.setItem('companionId', id);
                router.push(`/panel/${id}`);
              }
            }}
            className="flex items-center justify-center gap-2 w-full p-4 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogIn size={18} /> Ya tengo cuenta
          </button>
        </div>
      </div>
    </div>
  );
}
