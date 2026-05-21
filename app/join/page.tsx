"use client";

import { useState } from 'react';
import { User, Camera, DollarSign, Sparkles } from 'lucide-react';

export default function JoinPage() {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('49');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [modelId, setModelId] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);

    try {
      const uploadRes = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        body: file,
      });
      const uploadData = await uploadRes.json();

      if (!uploadData.url) throw new Error(uploadData.error || 'Upload failed');

      const res = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, photo_url: uploadData.url, price: Number(price) }),
      });
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      setModelId(data.companion.id);
      setStep(2);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error en el registro');
    } finally {
      setLoading(false);
    }
  };

  const handleStripeConnect = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId }),
      });
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      await fetch('/api/join', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companionId: modelId, stripe_account_id: data.accountId }),
      });

      window.location.href = data.url;
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error conectando con Stripe');
    } finally {
      setLoading(false);
    }
  };

  if (step === 2) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center font-serif p-5">
        <div className="bg-card p-10 rounded-2xl border-2 border-primary max-w-md w-full text-center">
          <Sparkles className="text-primary mx-auto" size={48} />
          <h2 className="text-primary mt-4 mb-2">Casi lista!</h2>
          <p className="text-muted-foreground text-sm mb-8">
            Para recibir tus pagos (80% para ti), necesitamos vincular tu cuenta bancaria a traves de Stripe.
          </p>
          <button
            className="bg-primary text-primary-foreground w-full p-4 rounded-lg font-bold cursor-pointer disabled:opacity-50"
            onClick={handleStripeConnect}
            disabled={loading}
          >
            {loading ? 'Conectando...' : 'VINCULAR MI BANCO'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen flex items-center justify-center font-serif p-5">
      <div className="bg-card p-10 rounded-2xl border-2 border-primary max-w-md w-full text-center">
        <h2 className="text-primary mb-2">Unete a AURA</h2>
        <p className="text-muted-foreground text-sm mb-8">Gana dinero como companera en Aura</p>

        <form onSubmit={handleRegister} className="flex flex-col gap-5 text-left">
          <div className="flex flex-col gap-2">
            <label className="text-primary text-xs flex items-center gap-1">
              <User size={16} /> Nombre Artistico
            </label>
            <input
              className="bg-background border border-border rounded-lg p-3 text-foreground outline-none"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Luna Mistica"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-primary text-xs flex items-center gap-1">
              <DollarSign size={16} /> Precio base por contenido (MXN)
            </label>
            <input
              type="number"
              className="bg-background border border-border rounded-lg p-3 text-foreground outline-none"
              value={price}
              onChange={e => setPrice(e.target.value)}
              required
            />
            <small className="text-primary">Tu recibes el 80% de cada venta.</small>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-primary text-xs flex items-center gap-1">
              <Camera size={16} /> Tu mejor foto
            </label>
            <input
              type="file"
              accept="image/*"
              className="text-muted-foreground text-sm"
              onChange={e => setFile(e.target.files?.[0] || null)}
              required
            />
          </div>

          <button
            type="submit"
            className="bg-primary text-primary-foreground p-4 rounded-lg font-bold cursor-pointer mt-2 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Procesando...' : 'CREAR MI PERFIL'}
          </button>
        </form>
      </div>
    </div>
  );
}
