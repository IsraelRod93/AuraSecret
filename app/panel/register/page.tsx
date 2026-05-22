"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Mail, Lock, User, Calendar, MapPin, 
  Heart, Camera, ChevronRight, ChevronLeft,
  Globe, Shield, DollarSign, ArrowLeft, Check
} from 'lucide-react';
import { CelestialBackground } from '@/components/celestial-background';

const PERSONALITY_OPTIONS = [
  { value: 'romantica', label: 'Romántica' },
  { value: 'aventurera', label: 'Aventurera' },
  { value: 'intelectual', label: 'Intelectual' },
  { value: 'divertida', label: 'Divertida' },
  { value: 'misteriosa', label: 'Misteriosa' },
  { value: 'coqueta', label: 'Coqueta' },
];

export default function PanelRegister() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [location, setLocation] = useState('');
  const [personality, setPersonality] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Step 3
  const [ageConfirm, setAgeConfirm] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handlePhotoChange = (file: File | null) => {
    setProfilePhoto(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
    } else {
      setPhotoPreview(null);
    }
  };

  const validateStep1 = () => {
    if (!email || !password) return 'Completa todos los campos';
    if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
    if (password !== confirmPassword) return 'Las contraseñas no coinciden';
    return null;
  };

  const validateStep2 = () => {
    if (!name || !age || !location || !personality || !profilePhoto) return 'Completa todos los campos y sube tu foto';
    if (Number(age) < 18) return 'Debes tener al menos 18 años';
    return null;
  };

  const nextStep = () => {
    setError('');
    if (step === 1) {
      const err = validateStep1();
      if (err) { setError(err); return; }
    }
    if (step === 2) {
      const err = validateStep2();
      if (err) { setError(err); return; }
    }
    if (step < 3) setStep(step + 1);
    else handleRegister();
  };

  const handleRegister = async () => {
    console.log("BOTÓN PRESIONADO - INICIANDO FLUJO DE REGISTRO");
    try {
      if (!ageConfirm || !termsAccepted) {
        console.log("Validación fallida: términos o edad no aceptados");
        return;
      }
      setError('');
      setLoading(true);

      const uploadRes = await fetch(`/api/upload?filename=${encodeURIComponent(profilePhoto!.name)}`, {
        method: 'POST',
        body: profilePhoto,
      });
      const uploadData = await uploadRes.json();
      if (!uploadData.url) throw new Error(uploadData.error || 'Error al subir foto');

      const res = await fetch('/api/panel-auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email, password, name,
          photo_url: uploadData.url,
          age: Number(age),
          location, personality_type: personality,
          tagline: tagline || null,
          description: description || null,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error en el registro');
        return;
      }

      router.push('/panel/dashboard');
    } catch (e) {
      console.error("ERROR EN FRONTEND:", e);
      setError(e instanceof Error ? e.message : 'Error en el registro');
    } finally {
      setLoading(false);
    }
  };

  const totalSteps = 3;

  return (
    <div className="absolute inset-0 flex flex-col px-[22px] py-[76px] pb-6 overflow-hidden">
      <CelestialBackground />

      {/* Top: back + progress */}
      <div className="flex items-center gap-2.5 mb-[18px] relative z-10">
        <button onClick={() => step === 1 ? router.back() : setStep(step - 1)} className="bg-transparent border-none text-fg-soft cursor-pointer p-1">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-gold transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
        <div className="text-[11px] text-fg-muted min-w-[30px] text-right">
          {step}/{totalSteps}
        </div>
      </div>

      {/* Role chip */}
      <div className="chip self-start bg-primary-soft text-primary border-primary mb-[18px] relative z-10">
        <Camera size={11} /> Creadora
      </div>

      {/* Step content */}
      <div className="mb-[22px] relative z-10">
        <h1 className="serif text-[26px] leading-[1.15] mb-1">
          {step === 1 && "Crea tu cuenta"}
          {step === 2 && "Tu perfil artístico"}
          {step === 3 && "Verifica tu edad"}
        </h1>
        <p className="text-[13px] text-fg-muted">
          {step === 1 && "Email y contraseña para entrar a tu panel"}
          {step === 2 && "Estos datos aparecerán en tu perfil de Aura"}
          {step === 3 && "Solo +18 pueden compartir contenido"}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-3.5 relative z-10">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3.5">
              <FormField label="Email" icon={Globe}>
                <input className="input-aura" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" />
              </FormField>
              <FormField label="Contraseña" icon={Lock}>
                <input className="input-aura" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" />
              </FormField>
              <FormField label="Confirmar" icon={Lock}>
                <input className="input-aura" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repite tu contraseña" />
              </FormField>
              
              <div className="bg-green-soft/10 border border-green/30 rounded-xl p-3.5 flex items-start gap-3">
                <DollarSign size={14} className="text-green mt-1 flex-shrink-0" />
                <div className="text-[12px] text-fg-soft leading-relaxed">
                  Recibes el <b className="text-green">80%</b> de cada venta. Sin comisiones ocultas, retiros cuando quieras.
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3.5 pb-4">
              <FormField label="Nombre artístico" icon={User}>
                <input className="input-aura" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Valeria" />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Edad" icon={Calendar}>
                  <input className="input-aura" type="number" min="18" value={age} onChange={e => setAge(e.target.value)} placeholder="24" />
                </FormField>
                <FormField label="Ciudad" icon={MapPin}>
                  <input className="input-aura" value={location} onChange={e => setLocation(e.target.value)} placeholder="CDMX" />
                </FormField>
              </div>
              <FormField label="Personalidad" icon={Heart}>
                <div className="grid grid-cols-3 gap-1.5">
                  {PERSONALITY_OPTIONS.map(p => (
                    <button key={p.value} onClick={() => setPersonality(p.value)} className={`
                      py-2.5 rounded-xl text-[12px] font-medium border transition-all
                      ${personality === p.value ? 'bg-primary-soft border-primary text-primary' : 'bg-white/5 border-white/10 text-fg-soft'}
                    `}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </FormField>
              <FormField label="Frase que te describe" icon={Sparkles}>
                <input className="input-aura" value={tagline} onChange={e => setTagline(e.target.value)} placeholder="Ej: Me encantan las noches largas" />
              </FormField>
              <FormField label="Foto de perfil" icon={Camera}>
                {photoPreview ? (
                  <div className="relative w-24 h-24 mx-auto">
                    <img src={photoPreview} alt="" className="w-24 h-24 rounded-full object-cover border-2 border-primary" />
                    <button onClick={() => handlePhotoChange(null)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs border-none cursor-pointer">✕</button>
                  </div>
                ) : (
                  <label className="block bg-white/5 border-2 border-dashed border-white/10 rounded-2xl p-5 text-center cursor-pointer hover:border-primary transition-colors">
                    <Camera className="mx-auto mb-1 text-fg-muted" size={24} />
                    <span className="text-fg-muted text-[13px]">Sube tu mejor foto</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e => handlePhotoChange(e.target.files?.[0] || null)} />
                  </label>
                )}
              </FormField>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3.5">
              <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/10">
                {photoPreview && <img src={photoPreview} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-primary mx-auto mb-3" />}
                <p className="text-foreground font-medium text-base">{name}</p>
                <p className="text-fg-muted text-[12px]">{age} años · {location}</p>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <label className="flex items-start gap-3 text-[13px] text-fg-soft cursor-pointer">
                  <input type="checkbox" checked={ageConfirm} onChange={e => setAgeConfirm(e.target.checked)} className="mt-1 accent-primary" />
                  <span>Confirmo que tengo <strong className="text-foreground">18 años o más</strong> y que la información es verídica.</span>
                </label>
                <label className="flex items-start gap-3 text-[13px] text-fg-soft cursor-pointer">
                  <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} className="mt-1 accent-primary" />
                  <span>Acepto los <a href="/terms" className="text-primary underline">términos de servicio</a> y confirmo que mi contenido es legal.</span>
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && <p className="text-red-400 text-[12px] text-center mb-3 relative z-10">{error}</p>}

      <button
        onClick={nextStep}
        disabled={loading || (step === 3 && (!ageConfirm || !termsAccepted))}
        className="btn-primary w-full relative z-10"
        style={{ opacity: loading ? 0.45 : 1 }}
      >
        {loading ? 'Creando...' : step === 3 ? 'Finalizar registro' : 'Continuar'}
      </button>

      <p className="text-center text-fg-muted text-[11px] mt-4 relative z-10">
        ¿Ya tienes cuenta?{' '}
        <a href="/panel/login" className="text-primary underline underline-offset-2">Inicia sesión</a>
      </p>
    </div>
  );
}

function FormField({ label, icon: Ic, children }: { label: string; icon?: any; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="inline-flex items-center gap-1.5 text-[11px] text-primary font-medium tracking-wide uppercase pl-1">
        {Ic && <Ic size={12} />} {label}
      </label>
      {children}
    </div>
  );
}
