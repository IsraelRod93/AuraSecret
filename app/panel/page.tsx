"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { CelestialBackground } from "@/components/celestial-background";
import { OracleOrb } from "@/components/oracle-orb";

export default function PanelHome() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/api/panel-auth/me")
      .then((r) => {
        if (r.ok) router.replace("/panel/dashboard");
        else setChecking(false);
      })
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
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col justify-between"
      style={{ padding: "90px 24px 28px" }}
    >
      <CelestialBackground />

      <div className="relative z-10 text-center">
        <h1
          className="serif gradient-text"
          style={{ fontSize: 44, letterSpacing: "0.34em", fontWeight: 300 }}
        >
          AURA
        </h1>
        <p
          className="serif text-muted-foreground"
          style={{ fontSize: 12, letterSpacing: "0.32em", textTransform: "uppercase", marginTop: 4 }}
        >
          · panel creadora ·
        </p>
      </div>

      <div className="relative z-10 text-center my-auto">
        <div className="grid place-items-center mb-6">
          <OracleOrb size={200} />
        </div>
        <div style={{ textAlign: 'center', maxWidth: 300 }} className="mx-auto">
          <h2 className="serif text-[28px] leading-[1.2] mb-2.5">
            Tu mundo,<br />
            tu energía,<br />
            <span className="gradient-text">tus ganancias</span>
          </h2>
          <p className="text-fg-soft text-sm leading-[1.55] max-w-[280px] mx-auto italic serif">
            Un espacio íntimo para compartir tu contenido y recibir el{" "}
            <strong style={{ color: "var(--green)" }}>80%</strong> de cada venta.
          </p>
        </div>
      </div>

      <div className="relative z-10 grid gap-2.5">
        <a href="/panel/login" className="btn-primary w-full text-center">
          <span className="inline-flex items-center gap-2">
            <Sparkles size={14} /> Entrar a mi panel
          </span>
        </a>
        <a href="/panel/register" className="btn-ghost w-full text-center">
          Crear mi perfil
        </a>
        <p className="text-center text-[10px] text-muted-foreground mt-2.5 tracking-wider">
          +18 · Pago seguro Telegram Stars · Términos y privacidad
        </p>
      </div>
    </div>
  );
}
