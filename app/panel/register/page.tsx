"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Mail, Lock, User, Calendar, MapPin, Heart, Camera, ChevronRight, ChevronLeft } from 'lucide-react';

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
    setStep(step + 1);
  };

  const handleRegister = async () => {
    if (!ageConfirm || !termsAccepted) return;
    setError('');
    setLoading(true);

    try {
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
      setError(e instanceof Error ? e.message : 'Error en el registro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center font-serif p-5">
      <div className="bg-card p-8 rounded-2xl border-2 border-primary max-w-md w-full">
        <div className="text-center mb-6">
          <Sparkles className="text-primary mx-auto mb-3" size={40} />
          <h1 className="text-primary text-2xl mb-1">Únete a AURA</h1>
          <p className="text-muted-foreground text-sm">Crea tu perfil y empieza a ganar</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className={`w-3 h-3 rounded-full transition-colors ${s <= step ? 'bg-primary' : 'bg-border'}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-primary text-xs flex items-center gap-1"><Mail size={14} /> Correo electrónico</label>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  className="bg-background border border-border rounded-lg p-3 text-foreground outline-none text-sm"
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="tu@correo.com" required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-primary text-xs flex items-center gap-1"><Lock size={14} /> Contraseña</label>
                <input
                  type="password"
                  name="new-password"
                  autoComplete="new-password"
                  className="bg-background border border-border rounded-lg p-3 text-foreground outline-none text-sm"
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres" required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-primary text-xs flex items-center gap-1"><Lock size={14} /> Confirmar contraseña</label>
                <input
                  type="password"
                  name="confirm-password"
                  autoComplete="new-password"
                  className="bg-background border border-border rounded-lg p-3 text-foreground outline-none text-sm"
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repite tu contraseña" required
                />
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-primary text-xs flex items-center gap-1"><User size={14} /> Nombre artístico</label>
                <input
                  className="bg-background border border-border rounded-lg p-3 text-foreground outline-none text-sm"
                  value={name} onChange={e => setName(e.target.value)}
                  placeholder="Ej: Luna Mística" required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-primary text-xs flex items-center gap-1"><Calendar size={14} /> Edad</label>
                  <input
                    type="number" min="18" max="60"
                    className="bg-background border border-border rounded-lg p-3 text-foreground outline-none text-sm"
                    value={age} onChange={e => setAge(e.target.value)}
                    placeholder="25" required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-primary text-xs flex items-center gap-1"><MapPin size={14} /> Ciudad</label>
                  <input
                    className="bg-background border border-border rounded-lg p-3 text-foreground outline-none text-sm"
                    value={location} onChange={e => setLocation(e.target.value)}
                    placeholder="CDMX" required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-primary text-xs flex items-center gap-1"><Heart size={14} /> Personalidad</label>
                <select
                  className="bg-background border border-border rounded-lg p-3 text-foreground outline-none text-sm"
                  value={personality} onChange={e => setPersonality(e.target.value)} required
                >
                  <option value="">Selecciona tu estilo...</option>
                  {PERSONALITY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-primary text-xs flex items-center gap-1"><Sparkles size={14} /> Frase que te describe</label>
                <input
                  className="bg-background border border-border rounded-lg p-3 text-foreground outline-none text-sm"
                  value={tagline} onChange={e => setTagline(e.target.value)}
                  placeholder="Ej: La vida es corta para ser aburrida..."
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-primary text-xs flex items-center gap-1">Sobre ti (breve)</label>
                <textarea
                  className="bg-background border border-border rounded-lg p-3 text-foreground outline-none text-sm resize-none"
                  rows={2} value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Cuéntale a tus admiradores algo sobre ti..."
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-primary text-xs flex items-center gap-1"><Camera size={14} /> Foto de perfil</label>
                {photoPreview ? (
                  <div className="relative w-24 h-24 mx-auto">
                    <img src={photoPreview} alt="" className="w-24 h-24 rounded-full object-cover border-2 border-primary" />
                    <button
                      type="button"
                      onClick={() => handlePhotoChange(null)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                    >✕</button>
                  </div>
                ) : (
                  <label className="bg-background border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary transition-colors">
                    <Camera className="mx-auto mb-2 text-muted-foreground" size={24} />
                    <span className="text-muted-foreground text-sm">Toca para subir tu foto</span>
                    <input
                      type="file" accept="image/*" className="hidden"
                      onChange={e => handlePhotoChange(e.target.files?.[0] || null)}
                    />
                  </label>
                )}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-4">
              <div className="bg-background rounded-xl p-4 text-center">
                {photoPreview && <img src={photoPreview} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-primary mx-auto mb-3" />}
                <p className="text-foreground font-medium">{name}</p>
                <p className="text-muted-foreground text-sm">{age} años · {location}</p>
              </div>

              <div className="flex flex-col gap-3 mt-2">
                <label className="flex items-start gap-2 text-sm text-foreground cursor-pointer">
                  <input
                    type="checkbox" checked={ageConfirm} onChange={e => setAgeConfirm(e.target.checked)}
                    className="mt-1 accent-primary" required
                  />
                  <span>Confirmo que tengo <strong>18 años o más</strong> y que la información es verídica.</span>
                </label>

                <label className="flex items-start gap-2 text-sm text-foreground cursor-pointer">
                  <input
                    type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)}
                    className="mt-1 accent-primary" required
                  />
                  <span>Acepto los <a href="/terms" className="text-primary underline">términos de servicio</a> y confirmo que todo el contenido que suba será legal y de mi propiedad.</span>
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && <p className="text-red-400 text-sm text-center mt-3">{error}</p>}

        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <button
              type="button"
              onClick={() => { setError(''); setStep(step - 1); }}
              className="flex items-center justify-center gap-1 px-4 py-3 rounded-lg border border-border text-muted-foreground text-sm"
            >
              <ChevronLeft size={16} /> Atrás
            </button>
          )}
          {step < 3 ? (
            <button
              type="button"
              onClick={nextStep}
              className="flex-1 flex items-center justify-center gap-1 bg-primary text-primary-foreground p-3 rounded-lg font-bold text-sm"
            >
              Siguiente <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRegister}
              className="flex-1 bg-primary text-primary-foreground p-3 rounded-lg font-bold text-sm disabled:opacity-50"
              disabled={loading || !ageConfirm || !termsAccepted}
            >
              {loading ? 'Creando perfil...' : 'CREAR MI PERFIL'}
            </button>
          )}
        </div>

        <p className="text-center text-muted-foreground text-sm mt-6">
          ¿Ya tienes cuenta?{' '}
          <a href="/panel/login" className="text-primary underline">Inicia sesión</a>
        </p>
      </div>
    </div>
  );
}
