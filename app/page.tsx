"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { AuraChat } from "@/components/aura-chat";

const WELCOME_KEY = "aura_welcome_done";

export default function Home() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [hasPanel, setHasPanel] = useState(false);
  const [hasUser, setHasUser] = useState(false);

  useEffect(() => {
    try {
      const cookies = typeof document !== 'undefined' ? document.cookie : '';
      const parts = cookies.split('; ').filter(Boolean);
      const hp = parts.some((c) => c.startsWith('panel_session='));
      const hu = parts.some((c) => c.startsWith('user_session='));
      setHasPanel(hp);
      setHasUser(hu);

      if (hp && !hu) {
        router.replace('/panel/dashboard');
        return;
      }
      if (hu && !hp) {
        router.replace('/explore');
        return;
      }

      if (!localStorage.getItem(WELCOME_KEY) && !hu && !hp) {
        router.replace('/welcome');
        return;
      }

      setReady(true);
    } catch {
      setReady(true);
    }
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Sparkles className="text-primary animate-pulse" size={28} />
      </div>
    );
  }

  // Si hay sesión en ambos, sugerimos destino al usuario
  if (hasPanel && hasUser) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
        <h2 className="text-2xl font-semibold">Tienes sesión en Cliente y Creador</h2>
        <p className="text-muted-foreground">¿A dónde quieres ir ahora?</p>
        <div className="flex gap-4">
          <button className="btn" onClick={() => router.push('/explore')}>Ir a Explorar</button>
          <button className="btn btn-primary" onClick={() => router.push('/panel/dashboard')}>Ir al Panel</button>
        </div>
      </div>
    );
  }

  return <AuraChat />;
}
