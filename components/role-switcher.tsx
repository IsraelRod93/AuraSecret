"use client";

import React from "react";
import { User, Camera, Sparkles, Heart, MessageCircle, Shield, DollarSign, Flame, Zap } from "lucide-react";
import { useTweaks } from "@/hooks/use-tweaks";

export function RoleSwitcher() {
  const [tweaks, setTweak] = useTweaks();

  return (
    <div className="role-switcher">
      <div className="text-[10px] font-semibold text-muted-foreground tracking-[0.2em] uppercase mb-1.5 ml-1">
        VISTA · PROTOTIPO
      </div>
      <div className="rs-pill">
        <div className={`rs-thumb ${tweaks.role === 'creadora' ? 'right' : ''}`} />
        <button 
          onClick={() => setTweak('role', 'cliente')}
          className={tweaks.role === 'cliente' ? 'active' : ''}
        >
          <User size={14} /> Cliente
        </button>
        <button 
          onClick={() => setTweak('role', 'creadora')}
          className={tweaks.role === 'creadora' ? 'active' : ''}
        >
          <Camera size={14} /> Creadora
        </button>
      </div>
    </div>
  );
}

export function SideInfo() {
  const [tweaks] = useTweaks();
  const isClient = tweaks.role === 'cliente';

  return (
    <div className="side-info">
      <div className="serif gradient-text text-[28px] tracking-[0.15em] mb-1.5">
        AURASECRET
      </div>
      <div className="text-[11px] text-muted-foreground tracking-[0.2em] uppercase">
        prototipo · {isClient ? 'lado cliente' : 'lado creadora'}
      </div>
      <div className="divider my-[18px]" />

      {isClient ? (
        <>
          <h3 className="serif text-[20px] mb-2">Flujo del cliente</h3>
          <p className="text-[13px] text-muted-foreground leading-[1.55] mb-3.5">
            Llega buscando una conexión. Aura le pregunta cómo se siente,
            sugiere afinidades, y abre la galería. Cuando hace match,
            chatea, ve nuevas fotos y desbloquea contenido directo del chat.
          </p>
        </>
      ) : (
        <>
          <h3 className="serif text-[20px] mb-2">Flujo de la creadora</h3>
          <p className="text-[13px] text-muted-foreground leading-[1.55] mb-3.5">
            Llega a ver cuánto ha ganado. Sube fotos en segundos con precio
            sugerido, responde a sus fans con respuestas rápidas, y ve quién
            gasta más para no perder un cliente VIP.
          </p>
        </>
      )}

      <div className="space-y-4">
        {(isClient ? [
          { ic: Sparkles, t: 'Aura conoce sus emociones', d: 'No es un login frío — es una conversación' },
          { ic: Heart,    t: 'Swipe sin perder el contexto', d: 'Match → chat en un toque, sin fricciones' },
          { ic: MessageCircle, t: 'Vault accesible desde el chat', d: 'El contenido vive donde sucede la conversación' },
          { ic: Shield,   t: 'Pago seguro Telegram Stars', d: 'Un solo flujo de pago — sin tarjetas' },     
        ] : [
          { ic: DollarSign, t: 'Ganancias visibles en 1 segundo', d: 'La primera pantalla es siempre dinero' }, 
          { ic: Camera,   t: 'Subir = 3 toques', d: 'Sugerencia de precio + 80% para ti' },
          { ic: Flame,    t: 'Detecta VIPs automáticamente', d: 'Sabes a quién contestar primero' },        
          { ic: Zap,      t: 'Tips inteligentes de Aura', d: 'Aprende patrones que te hacen ganar más' },    
        ]).map((row, i) => {
          const Ic = row.ic;
          return (
            <div key={i} className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                <Ic size={14} className="text-primary" />
              </div>
              <div>
                <div className="text-[13px] font-semibold">{row.t}</div>
                <div className="text-[12px] text-muted-foreground mt-0.5">{row.d}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="divider my-5" />
      <div className="text-[11px] text-muted-foreground leading-relaxed">
        Tip: usa el selector de abajo o el panel <b className="text-foreground">Tweaks</b> para        
        ver el otro lado de la app.
      </div>
    </div>
  );
}
