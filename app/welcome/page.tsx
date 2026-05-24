"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles, Heart, Camera, ArrowLeft, ArrowRight, Check,
  MessageCircle, Flame, Image, Shield, Globe, Lock, User, Calendar, MapPin,
} from "lucide-react";
import { CelestialBackground } from "@/components/celestial-background";
import { OracleOrb } from "@/components/oracle-orb";
import { useTelegram } from "@/components/telegram-provider";

type Stage = "welcome" | "choose" | "register" | "login" | "success";

export default function WelcomePage() {
  const router = useRouter();
  const { appUser } = useTelegram();
  const [stage, setStage] = useState<Stage>("welcome");
  const [role, setRole] = useState<"cliente" | "creadora">("cliente");
  const [formData, setFormData] = useState({
    name: "", age: "", city: "", email: "", password: "",
    tagline: "", personality: "", looking_for: "",
  });

  useEffect(() => {
    if (appUser?.first_name && !formData.name) {
      setFormData(prev => ({ ...prev, name: appUser.first_name || "" }));
    }
  }, [appUser]);

  const handleChoose = (action: "register" | "login", chosenRole?: "cliente" | "creadora") => {
    if (action === "login") {
      setStage("login");
    } else if (chosenRole) {
      setRole(chosenRole);
      setStage("register");
    }
  };

  const handleRegisterComplete = () => {
    setStage("success");
  };

  const markWelcomeDone = () => {
    try {
      localStorage.setItem("aura_welcome_done", "1");
    } catch {
      // ignore
    }
  };

  const handleSuccess = () => {
    markWelcomeDone();
    if (role === "creadora") {
      router.push("/panel");
    } else {
      router.push("/");
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <CelestialBackground />
      <div className="relative z-10 min-h-screen">
        {stage === "welcome" && (
          <WelcomeScreen onChoose={handleChoose} onContinue={() => setStage("choose")} />
        )}
        {stage === "choose" && (
          <ChooseRoleScreen
            onBack={() => setStage("welcome")}
            onChoose={handleChoose}
          />
        )}
        {stage === "register" && (
          <RegisterScreen
            role={role}
            formData={formData}
            setFormData={setFormData}
            onBack={() => setStage("choose")}
            onComplete={handleRegisterComplete}
          />
        )}
        {stage === "login" && (
          <LoginScreen
            onBack={() => setStage("welcome")}
            onSuccess={(role) => {
              markWelcomeDone();
              router.push(role === 'companion' ? "/panel/dashboard" : "/");
            }}
          />
        )}
        {stage === "success" && (
          <SuccessScreen
            role={role}
            name={formData.name}
            onContinue={handleSuccess}
          />
        )}
      </div>
    </div>
  );
}

function WelcomeScreen({ onChoose, onContinue }: {
  onChoose: (action: "login", role?: undefined) => void;
  onContinue: () => void;
}) {
  const router = useRouter();
  const handleTelegram = async () => {
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
          router.replace('/');
          return;
        }
        window.location.reload();
      } else {
        window.location.href = botUrl;
      }
    } catch {
      window.location.href = 'https://t.me/AuraSecretx_bot';
    }
  };
  return (
    <div className="min-h-screen flex flex-col px-6 pt-[90px] pb-7 justify-between">
      <div className="text-center">
        <h1 className="font-serif text-[44px] font-light tracking-[0.34em] gradient-text">
          AURA
        </h1>
        <p className="font-serif text-xs text-muted-foreground tracking-[0.32em] uppercase mt-1">
          · secret ·
        </p>
      </div>

      <div className="flex flex-col items-center gap-6 mx-auto">
        <OracleOrb size={200} />
        <div className="text-center max-w-[300px]">
          <p className="font-serif text-[28px] leading-tight mb-2.5">
            Tu energia,<br />
            <span className="gradient-text">tu conexion</span>
          </p>
          <p className="font-serif text-sm text-muted-foreground italic leading-relaxed">
            Un espacio intimo entre quien busca y quien comparte.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <button className="btn-primary text-center" onClick={onContinue}>
          <span className="inline-flex items-center gap-2">
            <Sparkles size={14} /> Comenzar
          </span>
        </button>
        <button className="btn-ghost text-center" onClick={() => onChoose("login")}>
          Ya tengo cuenta
        </button>
        <p className="text-center text-[10px] text-muted-foreground mt-2.5 tracking-wide">
          +18 · Pago seguro Telegram Stars · Terminos y privacidad
        </p>
      </div>
    </div>
  );
}

function ChooseRoleScreen({ onBack, onChoose }: {
  onBack: () => void;
  onChoose: (action: "register" | "login", role?: "cliente" | "creadora") => void;
}) {
  return (
    <div className="min-h-screen flex flex-col px-5 pt-[76px] pb-7">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-xs text-muted-foreground mb-3.5 self-start bg-transparent border-none cursor-pointer p-1"
      >
        <ArrowLeft size={16} /> Atras
      </button>

      <div className="mb-7">
        <h2 className="font-serif text-[28px] leading-tight mb-1.5">
          ¿Como te unes a Aura?
        </h2>
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          Tu perfil se crea segun lo que elijas. Podras cambiar despues.
        </p>
      </div>

      <div className="flex flex-col gap-3.5 flex-1">
        <RoleCard
          title="Soy cliente"
          subtitle="Busco conexiones, conversaciones, contenido"
          icon={Heart}
          accent="oklch(0.72 0.20 350)"
          accentSoft="oklch(0.55 0.18 350 / 0.18)"
          features={[
            "Conoce mujeres reales o companeras IA",
            "Chat directo, sin esperas",
            "Contenido exclusivo en cada vault",
          ]}
          onClick={() => onChoose("register", "cliente")}
        />
        <RoleCard
          title="Soy creadora"
          subtitle="Quiero compartir contenido y generar ingresos"
          icon={Camera}
          accent="oklch(0.78 0.16 70)"
          accentSoft="oklch(0.65 0.16 70 / 0.18)"
          features={[
            "Recibes el 80% de cada venta",
            "Sube fotos y crea paquetes en segundos",
            "Tus datos quedan privados y verificados",
          ]}
          onClick={() => onChoose("register", "creadora")}
        />
      </div>

      <p className="text-center text-[11px] text-muted-foreground mt-3.5">
        ¿Ya tienes cuenta?{" "}
        <button
          onClick={() => onChoose("login" as any)}
          className="bg-transparent border-none text-primary underline underline-offset-[3px] cursor-pointer text-[11px]"
        >
          Inicia sesion
        </button>
      </p>
    </div>
  );
}

function RoleCard({ title, subtitle, icon: Icon, accent, accentSoft, features, onClick }: {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ size?: number }>;
  accent: string;
  accentSoft: string;
  features: string[];
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 text-left p-5 rounded-[22px] cursor-pointer relative overflow-hidden transition-all duration-200"
      style={{
        background: "var(--card)",
        border: `1.5px solid oklch(0.30 0.06 295 / 0.35)`,
        color: "var(--foreground)",
      }}
    >
      <div
        className="absolute -top-[30px] -right-[30px] w-[140px] h-[140px] rounded-full pointer-events-none opacity-50"
        style={{ background: `radial-gradient(circle, ${accentSoft}, transparent 70%)` }}
      />

      <div className="flex items-start gap-3.5 mb-3 relative">
        <div
          className="w-[46px] h-[46px] rounded-[14px] flex-shrink-0 grid place-items-center"
          style={{ background: accentSoft, color: accent }}
        >
          <Icon size={22} />
        </div>
        <div className="flex-1">
          <p className="font-serif text-xl leading-tight">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{subtitle}</p>
        </div>
        <ArrowRight size={18} className="text-muted-foreground" />
      </div>

      <div className="flex flex-col gap-2 relative">
        {features.map((f, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <div
              className="w-4 h-4 rounded-full flex-shrink-0 mt-0.5 grid place-items-center"
              style={{ background: accentSoft, color: accent }}
            >
              <Check size={10} />
            </div>
            <span className="text-xs text-muted-foreground leading-snug flex-1">{f}</span>
          </div>
        ))}
      </div>
    </button>
  );
}

function RegisterScreen({ role, formData, setFormData, onBack, onComplete }: {
  role: "cliente" | "creadora";
  formData: any;
  setFormData: any;
  onBack: () => void;
  onComplete: () => void;
}) {
  const { appUser } = useTelegram();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const isCreator = role === "creadora";
  const accent = isCreator ? "oklch(0.78 0.16 70)" : "oklch(0.72 0.20 350)";
  const accentSoft = isCreator ? "oklch(0.65 0.16 70 / 0.18)" : "oklch(0.55 0.18 350 / 0.18)";

  const set = (k: string, v: string) => setFormData((p: Record<string, string>) => ({ ...p, [k]: v }));

  const steps = isCreator
    ? [
        { title: "Tu nombre artistico", sub: "Como te conoceran tus clientes" },
        { title: "Cuentanos de ti", sub: "Estos datos apareceran en tu perfil" },
        { title: "Tu energia", sub: "Ayuda a Aura a recomendarte" },
        { title: "Crea tu cuenta", sub: "Email y contrasena para el panel" },
      ]
    : [
        { title: "Tu nombre", sub: "Como te llamamos" },
        { title: "¿Que te trae aqui?", sub: "Aura adaptara tus recomendaciones" },
        { title: "Crea tu cuenta", sub: "Email y contrasena" },
      ];

  const total = steps.length;
  const cur = steps[step];

  const canNext = () => {
    if (isCreator) {
      if (step === 0) return formData.name.length >= 2;
      if (step === 1) return !!formData.age && !!formData.city;
      if (step === 2) return !!formData.personality && formData.tagline.length >= 4;
      if (step === 3) return formData.email.includes("@") && formData.password.length >= 6;
    } else {
      if (step === 0) return formData.name.length >= 2 && !!formData.age;
      if (step === 1) return !!formData.looking_for;
      if (step === 2) return formData.email.includes("@") && formData.password.length >= 6;
    }
    return false;
  };

  const handleNext = async () => {
    if (!canNext()) return;
    if (step < total - 1) {
      setStep(step + 1);
    } else {
      setLoading(true);
      try {
        if (isCreator) {
          const res = await fetch("/api/panel-auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: formData.email,
              password: formData.password,
              name: formData.name,
              age: Number(formData.age),
              location: formData.city,
              personality_type: formData.personality.toLowerCase(),
              tagline: formData.tagline,
              photo_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.name}`,
            }),
          });
          if (!res.ok) {
            const data = await res.json();
            alert(data.error || "Error al registrar");
            return;
          }
        } else {
          const res = await fetch("/api/user-auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: formData.email,
              password: formData.password,
              name: formData.name,
              age: formData.age ? Number(formData.age) : undefined,
              lookingFor: formData.looking_for,
            }),
          });
          if (!res.ok) {
            const data = await res.json();
            alert(data.error || "Error al registrar");
            return;
          }
        }
        onComplete();
      } finally {
        setLoading(false);
      }
    }
  };

  const personalities = ["Romantica", "Aventurera", "Coqueta", "Misteriosa", "Divertida", "Intelectual"];
  const lookingForOptions = [
    { v: "conversacion", t: "Una conversacion real", d: "Alguien con quien hablar de verdad", ic: MessageCircle },
    { v: "distraccion", t: "Distraccion y diversion", d: "Algo ligero, sin compromisos", ic: Sparkles },
    { v: "contenido", t: "Contenido exclusivo", d: "Fotos y videos privados", ic: Image },
    { v: "todo", t: "Todo lo anterior", d: "Quiero explorar sin restricciones", ic: Flame },
  ];

  return (
    <div className="min-h-screen flex flex-col px-5 pt-[76px] pb-6">
      <div className="flex items-center gap-2.5 mb-4">
        <button
          onClick={() => (step === 0 ? onBack() : setStep(step - 1))}
          className="bg-transparent border-none text-muted-foreground cursor-pointer p-1"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 h-1 rounded-sm bg-muted overflow-hidden">
          <div
            className="h-full rounded-sm transition-all duration-300"
            style={{
              width: `${((step + 1) / total) * 100}%`,
              background: `linear-gradient(90deg, ${accent}, var(--primary))`,
            }}
          />
        </div>
        <span className="text-[11px] text-muted-foreground min-w-[30px] text-right">
          {step + 1}/{total}
        </span>
      </div>

      <div
        className="chip self-start mb-4"
        style={{ background: accentSoft, color: accent, borderColor: accent }}
      >
        {isCreator ? <Camera size={11} /> : <Heart size={11} />}
        {isCreator ? "Creadora" : "Cliente"}
      </div>

      <div className="mb-5">
        <h2 className="font-serif text-[26px] leading-tight mb-1">{cur.title}</h2>
        <p className="text-[13px] text-muted-foreground">{cur.sub}</p>
      </div>

      <div className="flex-1 flex flex-col gap-3.5 overflow-y-auto no-scrollbar">
        {isCreator ? (
          <>
            {step === 0 && (
              <FormField label="Nombre artistico" icon={User}>
                <input
                  className="input-aura"
                  autoFocus
                  value={formData.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Ej: Valeria"
                />
              </FormField>
            )}
            {step === 1 && (
              <>
                <FormField label="Edad" icon={Calendar}>
                  <input
                    className="input-aura"
                    type="number"
                    min={18}
                    value={formData.age}
                    onChange={(e) => set("age", e.target.value)}
                    placeholder="24"
                  />
                </FormField>
                <FormField label="Ciudad" icon={MapPin}>
                  <input
                    className="input-aura"
                    value={formData.city}
                    onChange={(e) => set("city", e.target.value)}
                    placeholder="CDMX"
                  />
                </FormField>
                <div className="rounded-xl p-2.5 px-3 flex gap-2 items-start text-[11px]"
                  style={{
                    background: "oklch(0.55 0.18 300 / 0.10)",
                    border: "1px solid oklch(0.55 0.18 300 / 0.25)",
                  }}>
                  <Shield size={14} className="flex-shrink-0 mt-0.5" style={{ color: "oklch(0.85 0.10 300)" }} />
                  <span className="text-muted-foreground leading-snug">
                    Tu ubicacion nunca se muestra a clientes. Se usa solo para emparejarte por zona horaria.
                  </span>
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <FormField label="Frase que te describe" icon={Sparkles}>
                  <input
                    className="input-aura"
                    value={formData.tagline}
                    onChange={(e) => set("tagline", e.target.value)}
                    placeholder="Ej: Me encantan las noches largas"
                  />
                </FormField>
                <FormField label="Personalidad" icon={Heart}>
                  <div className="grid grid-cols-3 gap-1.5">
                    {personalities.map((p) => (
                      <button
                        key={p}
                        onClick={() => set("personality", p)}
                        className="p-2.5 rounded-xl cursor-pointer text-xs font-medium transition-all"
                        style={{
                          background: formData.personality === p ? accentSoft : "var(--card)",
                          border: `1.5px solid ${formData.personality === p ? accent : "oklch(0.30 0.06 295 / 0.35)"}`,
                          color: formData.personality === p ? accent : "var(--muted-foreground)",
                        }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </FormField>
              </>
            )}
            {step === 3 && (
              <>
                <FormField label="Email" icon={Globe}>
                  <input className="input-aura" type="email" value={formData.email}
                    onChange={(e) => set("email", e.target.value)} placeholder="tu@email.com" />
                </FormField>
                <FormField label="Contrasena" icon={Lock}>
                  <input className="input-aura" type="password" value={formData.password}
                    onChange={(e) => set("password", e.target.value)} placeholder="Minimo 6 caracteres" />
                </FormField>
                <div className="rounded-[14px] p-3.5" style={{
                  background: "oklch(0.30 0.16 155 / 0.15)",
                  border: "1px solid oklch(0.65 0.16 155 / 0.30)",
                }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-semibold" style={{ color: "oklch(0.78 0.16 155)" }}>Tu ganancia</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Recibes el <strong style={{ color: "oklch(0.78 0.16 155)" }}>80%</strong> de cada venta via Telegram Stars.
                    Sin comisiones ocultas, retiros cuando quieras.
                  </p>
                </div>
              </>
            )}
          </>
        ) : (
          <>
            {step === 0 && (
              <>
                <FormField label="Como te llamas" icon={User}>
                  <input className="input-aura" autoFocus value={formData.name}
                    onChange={(e) => set("name", e.target.value)} placeholder="Tu nombre" />
                </FormField>
                <FormField label="Edad" icon={Calendar}>
                  <input className="input-aura" type="number" min={18} value={formData.age}
                    onChange={(e) => set("age", e.target.value)} placeholder="24" />
                </FormField>
              </>
            )}
            {step === 1 && (
              <FormField label="¿Que buscas hoy?" icon={Heart}>
                <div className="flex flex-col gap-2">
                  {lookingForOptions.map((opt) => {
                    const on = formData.looking_for === opt.v;
                    const OptIcon = opt.ic;
                    return (
                      <button
                        key={opt.v}
                        onClick={() => set("looking_for", opt.v)}
                        className="flex items-center gap-3 p-3.5 rounded-[14px] cursor-pointer text-left transition-all"
                        style={{
                          background: on ? accentSoft : "var(--card)",
                          border: `1.5px solid ${on ? accent : "oklch(0.30 0.06 295 / 0.35)"}`,
                          color: "var(--foreground)",
                        }}
                      >
                        <div
                          className="w-9 h-9 rounded-[10px] flex-shrink-0 grid place-items-center"
                          style={{
                            background: on ? accent : "oklch(0.20 0.04 290 / 0.6)",
                            color: on ? "white" : "var(--muted-foreground)",
                          }}
                        >
                          <OptIcon size={16} />
                        </div>
                        <div className="flex-1">
                          <p className="text-[13px] font-semibold">{opt.t}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{opt.d}</p>
                        </div>
                        {on && (
                          <div
                            className="w-[22px] h-[22px] rounded-full grid place-items-center flex-shrink-0"
                            style={{ background: accent, color: "white" }}
                          >
                            <Check size={12} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </FormField>
            )}
            {step === 2 && (
              <>
                <FormField label="Email" icon={Globe}>
                  <input className="input-aura" type="email" value={formData.email}
                    onChange={(e) => set("email", e.target.value)} placeholder="tu@email.com" />
                </FormField>
                <FormField label="Contrasena" icon={Lock}>
                  <input className="input-aura" type="password" value={formData.password}
                    onChange={(e) => set("password", e.target.value)} placeholder="Minimo 6 caracteres" />
                </FormField>
                <div className="rounded-xl p-2.5 px-3 flex gap-2 items-start text-[11px]"
                  style={{
                    background: "oklch(0.55 0.18 300 / 0.08)",
                    border: "1px solid oklch(0.55 0.18 300 / 0.25)",
                  }}>
                  <Shield size={14} className="flex-shrink-0 mt-0.5" style={{ color: "oklch(0.85 0.10 300)" }} />
                  <span className="text-muted-foreground leading-snug">
                    Tu identidad es privada. Las creadoras solo veran tu nombre y tu energia.
                  </span>
                </div>
              </>
            )}
          </>
        )}
      </div>

      <button
        onClick={handleNext}
        disabled={!canNext() || loading}
        className="mt-4 p-3.5 rounded-[14px] border-none font-semibold text-sm tracking-wide uppercase cursor-pointer transition-all"
        style={{
          background: canNext()
            ? `linear-gradient(135deg, ${accent}, var(--primary))`
            : "oklch(0.20 0.04 290)",
          color: "white",
          opacity: canNext() ? 1 : 0.45,
          boxShadow: canNext() ? `0 10px 30px ${accentSoft}` : "none",
        }}
      >
        {loading ? "Creando..." : step === total - 1 ? "Crear mi perfil" : "Continuar"}
      </button>
    </div>
  );
}

function FormField({ label, icon: Icon, children }: {
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-wide mb-1.5"
        style={{ color: "oklch(0.85 0.10 300)" }}>
        <Icon size={12} /> {label}
      </label>
      {children}
    </div>
  );
}

function LoginScreen({ onBack, onSuccess }: {
  onBack: () => void;
  onSuccess: (role: 'companion' | 'user') => void;
}) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email.includes("@") || pass.length < 6) return;
    setLoading(true);
    setError("");
    try {
      const companionRes = await fetch("/api/panel-auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });
      if (companionRes.ok) {
        onSuccess('companion');
        return;
      }

      const userRes = await fetch("/api/user-auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });
      if (userRes.ok) {
        onSuccess('user');
        return;
      }

      const data = await userRes.json();
      setError(data.error || "Credenciales incorrectas");
    } catch {
      setError("Error de conexion");
    } finally {
      setLoading(false);
    }
  };

  const valid = email.includes("@") && pass.length >= 6;

  return (
    <div className="min-h-screen flex flex-col px-5 pt-[76px] pb-7">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-xs text-muted-foreground mb-5 self-start bg-transparent border-none cursor-pointer p-1"
      >
        <ArrowLeft size={16} /> Atras
      </button>

      <div className="text-center mb-7">
        <div className="grid place-items-center mb-4">
          <OracleOrb size={120} />
        </div>
        <h2 className="font-serif text-2xl font-light tracking-[0.32em] gradient-text">
          AURA
        </h2>
        <p className="font-serif text-base text-muted-foreground mt-3 italic">
          Bienvenido de vuelta
        </p>
      </div>

      <div className="flex flex-col gap-3.5 mb-5">
        <FormField label="Email" icon={Globe}>
          <input className="input-aura" autoFocus type="email" value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" />
        </FormField>
        <FormField label="Contrasena" icon={Lock}>
          <input className="input-aura" type="password" value={pass}
            onChange={(e) => setPass(e.target.value)} placeholder="Tu contrasena" />
        </FormField>
      </div>

      {error && <p className="text-red-400 text-sm text-center mb-3">{error}</p>}

      <button
        className="btn-primary text-center"
        onClick={handleLogin}
        disabled={!valid || loading}
        style={{ opacity: valid && !loading ? 1 : 0.4 }}
      >
        {loading ? "Entrando..." : "Iniciar sesion"}
      </button>

      <div className="relative my-5">
        <div className="divider" />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-[10px] text-muted-foreground tracking-[0.18em]">
          O
        </span>
      </div>

      <button className="btn-ghost text-center inline-flex items-center justify-center gap-2" onClick={handleTelegram}>
        <Sparkles size={14} /> Continuar con Telegram
      </button>
    </div>
  );
}

function SuccessScreen({ role, name, onContinue }: {
  role: "cliente" | "creadora";
  name: string;
  onContinue: () => void;
}) {
  const isCreator = role === "creadora";
  const accent = isCreator ? "oklch(0.78 0.16 70)" : "oklch(0.72 0.20 350)";

  useEffect(() => {
    const t = setTimeout(onContinue, 2400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen grid place-items-center p-8 text-center">
      <div>
        <div
          className="w-[90px] h-[90px] rounded-full mx-auto mb-5 grid place-items-center"
          style={{
            background: `radial-gradient(circle, ${accent}, oklch(0.40 0.16 290))`,
            boxShadow: `0 0 40px ${accent}, 0 0 80px ${accent}`,
            animation: "orbBreathe 2s ease-in-out infinite",
          }}
        >
          <Check size={44} className="text-white" strokeWidth={2.5} />
        </div>
        <h2 className="font-serif text-[30px] gradient-text mb-1.5">
          ¡Bienvenid{isCreator ? "a" : "o"}, {name || (isCreator ? "creadora" : "a Aura")}!
        </h2>
        <p className="font-serif text-base text-muted-foreground italic mb-5 max-w-[280px] mx-auto leading-snug">
          {isCreator
            ? "Tu perfil esta listo. Vamos a tu panel para subir tu primera foto."
            : "Aura esta sintiendo tu energia. Te llevo con ella."}
        </p>
        <span className="tap-dots">
          <span /><span /><span />
        </span>
      </div>
    </div>
  );
}
