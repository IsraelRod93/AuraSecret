"use client";

import { useState } from 'react';
import { User, Camera, Sparkles, MapPin, Calendar, Heart } from 'lucide-react';

const PERSONALITY_OPTIONS = [
  { value: 'romantica', label: 'Romantica' },
  { value: 'aventurera', label: 'Aventurera' },
  { value: 'intelectual', label: 'Intelectual' },
  { value: 'divertida', label: 'Divertida' },
  { value: 'misteriosa', label: 'Misteriosa' },
  { value: 'coqueta', label: 'Coqueta' },
];

export default function PanelJoinPage() {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [location, setLocation] = useState('');
  const [personality, setPersonality] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [ageConfirm, setAgeConfirm] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modelId, setModelId] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profilePhoto) return;
    setLoading(true);

    try {
      const uploadRes = await fetch(`/api/upload?filename=${encodeURIComponent(profilePhoto.name)}`, {
        method: 'POST',
        body: profilePhoto,
      });
      const uploadData = await uploadRes.json();
      if (!uploadData.url) throw new Error(uploadData.error || 'Upload failed');

      const res = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          photo_url: uploadData.url,
          age: age ? Number(age) : null,
          location: location || null,
          personality_type: personality || null,
          tagline: tagline || null,
          description: description || null,
        }),
      });
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      setModelId(data.companion.id);
      localStorage.setItem('companionId', data.companion.id);
      document.cookie = `companionId=${data.companion.id};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
      setDone(true);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error en el registro');
    } finally {
      setLoading(false);
    }
  };

  if (done && modelId) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center font-serif p-5">
        <div className="bg-card p-10 rounded-2xl border-2 border-primary max-w-md w-full text-center">
          <Sparkles className="text-primary mx-auto" size={48} />
          <h2 className="text-primary mt-4 mb-2">Perfil creado!</h2>
          <p className="text-muted-foreground text-sm mb-4">
            Tu ID de companera: <code className="bg-background px-2 py-1 rounded text-xs">{modelId}</code>
          </p>
          <p className="text-muted-foreground text-xs mb-6">
            Guarda este ID para acceder a tu dashboard en el futuro.
          </p>
          <a
            href={`/panel/${modelId}`}
            className="block bg-primary text-primary-foreground w-full p-4 rounded-lg font-bold"
          >
            IR A MI DASHBOARD
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen flex items-center justify-center font-serif p-5">
      <div className="bg-card p-8 rounded-2xl border-2 border-primary max-w-md w-full text-center">
        <h2 className="text-primary mb-2">Unete a AURA</h2>
        <p className="text-muted-foreground text-sm mb-6">Crea tu perfil y empieza a ganar</p>

        <form onSubmit={handleRegister} className="flex flex-col gap-4 text-left">
          <div className="flex flex-col gap-1.5">
            <label className="text-primary text-xs flex items-center gap-1">
              <User size={14} /> Nombre Artistico
            </label>
            <input
              className="bg-background border border-border rounded-lg p-3 text-foreground outline-none text-sm"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Luna Mistica"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-primary text-xs flex items-center gap-1">
                <Calendar size={14} /> Edad
              </label>
              <input
                type="number"
                min="18"
                max="60"
                className="bg-background border border-border rounded-lg p-3 text-foreground outline-none text-sm"
                value={age}
                onChange={e => setAge(e.target.value)}
                placeholder="25"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-primary text-xs flex items-center gap-1">
                <MapPin size={14} /> Ciudad
              </label>
              <input
                className="bg-background border border-border rounded-lg p-3 text-foreground outline-none text-sm"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="CDMX"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-primary text-xs flex items-center gap-1">
              <Heart size={14} /> Personalidad
            </label>
            <select
              className="bg-background border border-border rounded-lg p-3 text-foreground outline-none text-sm"
              value={personality}
              onChange={e => setPersonality(e.target.value)}
              required
            >
              <option value="">Selecciona tu estilo...</option>
              {PERSONALITY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-primary text-xs flex items-center gap-1">
              <Sparkles size={14} /> Frase que te describe
            </label>
            <input
              className="bg-background border border-border rounded-lg p-3 text-foreground outline-none text-sm"
              value={tagline}
              onChange={e => setTagline(e.target.value)}
              placeholder="Ej: La vida es corta para ser aburrida..."
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-primary text-xs flex items-center gap-1">
              Sobre ti (breve)
            </label>
            <textarea
              className="bg-background border border-border rounded-lg p-3 text-foreground outline-none text-sm resize-none"
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Cuentale a tus admiradores algo sobre ti..."
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-primary text-xs flex items-center gap-1">
              <Camera size={14} /> Foto de perfil
            </label>
            <input
              type="file"
              accept="image/*"
              className="text-muted-foreground text-sm"
              onChange={e => setProfilePhoto(e.target.files?.[0] || null)}
              required
            />
            <small className="text-muted-foreground text-xs">Visible en la galeria. Sube mas fotos desde tu dashboard.</small>
          </div>

          <div className="flex flex-col gap-3 mt-2">
            <label className="flex items-start gap-2 text-sm text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={ageConfirm}
                onChange={e => setAgeConfirm(e.target.checked)}
                className="mt-1 accent-primary"
                required
              />
              <span>Confirmo que tengo <strong>18 anos o mas</strong> y que la informacion proporcionada es veridica.</span>
            </label>

            <label className="flex items-start gap-2 text-sm text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={e => setTermsAccepted(e.target.checked)}
                className="mt-1 accent-primary"
                required
              />
              <span>Acepto los <a href="/terms" className="text-primary underline">terminos de servicio</a> y confirmo que todo el contenido que suba sera legal y de mi propiedad.</span>
            </label>
          </div>

          <button
            type="submit"
            className="bg-primary text-primary-foreground p-4 rounded-lg font-bold cursor-pointer mt-2 disabled:opacity-50"
            disabled={loading || !ageConfirm || !termsAccepted}
          >
            {loading ? 'Creando perfil...' : 'CREAR MI PERFIL'}
          </button>
        </form>
      </div>
    </div>
  );
}
