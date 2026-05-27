"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User, Camera, MapPin, Heart, Calendar, ArrowLeft,
  Sparkles, Wallet, LogOut, CreditCard, ArrowDownToLine, Lightbulb,
} from "lucide-react";
import { Companion, BalanceData, PERSONALITY_OPTIONS, fmt } from "./types";
import { LoadingSpinner, Field } from "./shared";

function PayoutTab() {
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mpEmail, setMpEmail] = useState('');
  const [clabe, setClabe] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);
  const [savedPayment, setSavedPayment] = useState(false);
  const [withdrawStars, setWithdrawStars] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [requestMsg, setRequestMsg] = useState('');

  const loadBalance = async () => {
    const res = await fetch('/api/panel-auth/balance');
    const d = await res.json();
    setBalance(d);
    setMpEmail(d.mpEmail || '');
    setClabe(d.clabe || '');
  };

  useEffect(() => {
    loadBalance().finally(() => setLoading(false));
  }, []);

  const handleSavePayment = async () => {
    setSavingPayment(true);
    try {
      await fetch('/api/panel-auth/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mpEmail: mpEmail || null, clabe: clabe || null }),
      });
      setSavedPayment(true);
      setTimeout(() => setSavedPayment(false), 2000);
    } finally { setSavingPayment(false); }
  };

  const handleWithdraw = async () => {
    const stars = Number(withdrawStars);
    if (!stars) return;
    setRequesting(true);
    setRequestMsg('');
    try {
      const res = await fetch('/api/panel-auth/payout', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountStars: stars }),
      });
      const data = await res.json();
      if (res.ok) {
        setRequestMsg(`Retiro solicitado: ★${stars} (~$${data.amountMxn} MXN). El admin lo procesará en 1-3 días.`);
        setWithdrawStars('');
        await loadBalance();
      } else {
        setRequestMsg(data.error || 'Error al solicitar retiro');
      }
    } finally { setRequesting(false); }
  };

  if (loading) return <LoadingSpinner />;

  const hasPaymentMethod = !!(mpEmail || clabe);
  const canWithdraw = balance && balance.availableStars >= balance.minWithdrawalStars;
  const withdrawAmount = Number(withdrawStars);
  const withdrawValid = withdrawAmount >= (balance?.minWithdrawalStars || 500) && withdrawAmount <= (balance?.availableStars || 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
      {/* Balance hero */}
      <div
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, oklch(0.30 0.16 155 / 0.20), oklch(0.18 0.08 295 / 0.40))",
          border: "1px solid oklch(0.65 0.16 155 / 0.30)",
          borderRadius: 22, padding: 22,
        }}
      >
        <p className="text-xs text-muted-foreground mb-1">Tus ganancias totales</p>
        <div className="flex items-baseline gap-1.5">
          <span className="font-serif text-[40px] font-medium leading-none" style={{ color: "var(--green)" }}>
            ★{fmt(balance?.earningsStars || 0)}
          </span>
          <span className="text-[13px] text-muted-foreground">Stars</span>
        </div>
        <div className="flex gap-4 mt-3">
          <div>
            <p className="text-[10px] text-muted-foreground">En proceso</p>
            <p className="text-sm font-medium text-yellow-400">★{fmt(balance?.pendingStars || 0)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Disponibles</p>
            <p className="text-sm font-medium" style={{ color: "var(--green)" }}>★{fmt(balance?.availableStars || 0)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Estimado MXN</p>
            <p className="text-sm font-medium text-foreground">${balance?.estimatedMxn?.toFixed(0) || 0}</p>
          </div>
        </div>
      </div>

      {/* Método de pago */}
      <div className="solid-card rounded-[18px] p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <CreditCard size={16} style={{ color: "var(--primary)" }} />
          <h4 className="text-sm font-semibold text-foreground">Método de cobro</h4>
          {hasPaymentMethod && <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full" style={{ background: "var(--green-soft)", color: "var(--green)" }}>Activo</span>}
        </div>

        <div className="space-y-2">
          <div>
            <label className="text-[11px] text-muted-foreground">Correo Mercado Pago (pago automático)</label>
            <input
              type="email"
              className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none"
              placeholder="tu@email.com"
              value={mpEmail}
              onChange={e => setMpEmail(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <div className="flex-1 h-px bg-border" />
            <span>o</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground">CLABE interbancaria (transferencia manual)</label>
            <input
              type="text"
              className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none"
              placeholder="18 dígitos"
              maxLength={18}
              value={clabe}
              onChange={e => setClabe(e.target.value.replace(/\D/g, ''))}
            />
          </div>
        </div>

        <button
          onClick={handleSavePayment}
          disabled={savingPayment || (!mpEmail && !clabe)}
          className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-bold disabled:opacity-40"
        >
          {savedPayment ? '✓ Guardado' : savingPayment ? 'Guardando...' : 'GUARDAR MÉTODO DE COBRO'}
        </button>
      </div>

      {/* Solicitar retiro */}
      <div className="solid-card rounded-[18px] p-4 space-y-3">
        <div className="flex items-center gap-2">
          <ArrowDownToLine size={16} style={{ color: "var(--primary)" }} />
          <h4 className="text-sm font-semibold text-foreground">Solicitar retiro</h4>
          {balance?.isNewCreator && (
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "oklch(0.55 0.18 300 / 0.15)", color: "oklch(0.75 0.12 300)" }}>
              Mínimo reducido ✓
            </span>
          )}
        </div>

        {!hasPaymentMethod ? (
          <p className="text-xs text-muted-foreground py-2">Primero guarda tu Mercado Pago o CLABE arriba para poder retirar.</p>
        ) : !canWithdraw ? (
          <p className="text-xs text-muted-foreground py-2">
            Necesitas al menos ★{balance?.minWithdrawalStars} disponibles (~${((balance?.minWithdrawalStars || 500) * (balance?.starsToMxn || 0.15)).toFixed(0)} MXN). Tienes ★{balance?.availableStars || 0}.
            {balance?.isNewCreator && <span className="block mt-1 text-primary">✨ Como creadora nueva tienes mínimo reducido de ★{balance.minWithdrawalStars}.</span>}
          </p>
        ) : (
          <div className="space-y-2">
            <label className="text-[11px] text-muted-foreground">¿Cuántas Stars retirar?</label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">★</span>
              <input
                type="number"
                min={balance?.minWithdrawalStars || 500}
                max={balance?.availableStars || 0}
                className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-foreground text-lg font-bold outline-none"
                value={withdrawStars}
                onChange={e => setWithdrawStars(e.target.value)}
                placeholder={String(balance?.minWithdrawalStars || 500)}
              />
            </div>
            {withdrawAmount > 0 && (
              <p className="text-[11px] text-muted-foreground">
                Recibirás aproximadamente <strong className="text-green-400">${(withdrawAmount * (balance?.starsToMxn || 0.15)).toFixed(2)} MXN</strong>
              </p>
            )}
            <button
              onClick={handleWithdraw}
              disabled={requesting || !withdrawValid}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-bold disabled:opacity-40"
            >
              {requesting ? 'Solicitando...' : 'SOLICITAR RETIRO'}
            </button>
          </div>
        )}

        {requestMsg && (
          <p className={`text-xs mt-1 ${requestMsg.startsWith('Retiro') ? 'text-green-400' : 'text-destructive'}`}>
            {requestMsg}
          </p>
        )}
      </div>

      {/* Consejos de rentabilidad */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 mb-1">
          <Lightbulb size={14} style={{ color: "oklch(0.85 0.18 85)" }} />
          <h4 className="text-xs font-semibold" style={{ color: "oklch(0.85 0.18 85)" }}>Consejos para ganar más</h4>
        </div>

        {[
          { titulo: 'Sube contenido diariamente', texto: 'Las creadores que suben 1 foto al día tienen 3x más ventas. La constancia genera anticipación y fidelidad.' },
          { titulo: 'Usa paquetes temáticos', texto: 'Un paquete de 5-10 fotos por ★150-200 convierte mejor que fotos sueltas. El cliente siente que "gana" más.' },
          { titulo: 'Activa la suscripción mensual', texto: 'Ingresos recurrentes son la base de un negocio estable. Con 30 suscriptores a ★150 = ★4,500 fijos al mes.' },
          { titulo: 'Comparte tu link en redes', texto: 'Instagram Stories, TikTok o grupos de Telegram multiplican tu alcance sin costo. Cada fan nuevo es ingreso potencial.' },
          { titulo: 'Responde mensajes rápido', texto: 'Los usuarios que reciben respuesta en <1 hora tienen 2x más probabilidad de pagar. La conexión personal vende.' },
        ].map((tip, i) => (
          <div
            key={i}
            className="flex gap-3 p-3 rounded-[14px]"
            style={{
              background: "oklch(0.18 0.06 85 / 0.15)",
              border: "1px solid oklch(0.85 0.18 85 / 0.15)",
            }}
          >
            <span className="text-[11px] font-bold mt-0.5 flex-shrink-0" style={{ color: "oklch(0.85 0.18 85)" }}>{i + 1}</span>
            <div>
              <p className="text-xs font-semibold text-foreground">{tip.titulo}</p>
              <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{tip.texto}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export function ProfileTab({
  companion,
  onUpdate,
  onLogout,
}: {
  companion: Companion;
  onUpdate: (c: Companion) => void;
  onLogout: () => void;
}) {
  const [showPagos, setShowPagos] = useState(false);
  const [form, setForm] = useState({
    name: companion.name,
    age: companion.age?.toString() || '',
    location: companion.location || '',
    personality_type: companion.personality_type || '',
    tagline: companion.tagline || '',
    description: companion.description || '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [changingPhoto, setChangingPhoto] = useState(false);
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const hasChanges = form.name !== companion.name ||
    form.age !== (companion.age?.toString() || '') ||
    form.location !== (companion.location || '') ||
    form.personality_type !== (companion.personality_type || '') ||
    form.tagline !== (companion.tagline || '') ||
    form.description !== (companion.description || '') ||
    !!newPhoto;

  const handleSave = async () => {
    setSaving(true);
    try {
      let photo_url = companion.photo_url;

      if (newPhoto) {
        setChangingPhoto(true);
        const uploadRes = await fetch(`/api/upload?filename=${encodeURIComponent(newPhoto.name)}`, {
          method: 'POST',
          body: newPhoto,
        });
        const uploadData = await uploadRes.json();
        if (uploadData.url) photo_url = uploadData.url;
        setChangingPhoto(false);
      }

      const res = await fetch('/api/panel-auth/update-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, photo_url }),
      });
      const data = await res.json();
      if (res.ok) {
        onUpdate(data.companion);
        setNewPhoto(null);
        setPhotoPreview(null);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
      setChangingPhoto(false);
    }
  };

  const onPhotoChange = (file: File) => {
    setNewPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  if (showPagos) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
        <button
          onClick={() => setShowPagos(false)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={18} />
          <span className="text-sm">Volver al perfil</span>
        </button>
        <PayoutTab />
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
      {/* Photo */}
      <div className="flex justify-center">
        <label className="relative cursor-pointer">
          <img src={photoPreview || companion.photo_url} alt="" className="w-24 h-24 rounded-full object-cover border-2 border-primary" />
          <div className="absolute bottom-0 right-0 bg-primary rounded-full w-8 h-8 flex items-center justify-center border-2 border-background">
            {changingPhoto
              ? <Sparkles size={14} className="text-primary-foreground animate-spin" />
              : <Camera size={14} className="text-primary-foreground" />}
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) onPhotoChange(e.target.files[0]); }} />
        </label>
      </div>

      {/* Fields */}
      <div className="space-y-4">
        <Field label="Nombre artístico" icon={<User size={14} />}>
          <input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Edad" icon={<Calendar size={14} />}>
            <input type="number" min="18" className="input-field" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} />
          </Field>
          <Field label="Ciudad" icon={<MapPin size={14} />}>
            <input className="input-field" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
          </Field>
        </div>

        <Field label="Personalidad" icon={<Heart size={14} />}>
          <select className="input-field" value={form.personality_type} onChange={e => setForm({ ...form, personality_type: e.target.value })}>
            <option value="">Selecciona...</option>
            {PERSONALITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>

        <Field label="Frase que te describe" icon={<Sparkles size={14} />}>
          <input className="input-field" value={form.tagline} onChange={e => setForm({ ...form, tagline: e.target.value })} placeholder="Ej: La vida es corta..." />
        </Field>

        <Field label="Sobre ti">
          <textarea className="input-field resize-none" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </Field>
      </div>

      <button
        onClick={handleSave}
        disabled={!hasChanges || saving}
        className="w-full bg-primary text-primary-foreground p-4 rounded-lg font-bold disabled:opacity-40 transition-opacity"
      >
        {saved ? '¡Guardado!' : saving ? 'Guardando...' : 'GUARDAR CAMBIOS'}
      </button>

      <button
        type="button"
        onClick={() => setShowPagos(true)}
        className="w-full bg-card border border-border rounded-xl p-4 flex items-center gap-3 hover:border-primary/30 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--green-soft)" }}>
          <Wallet size={18} className="text-green-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">Mis ganancias y pagos</p>
          <p className="text-xs text-muted-foreground">Ver saldo · solicitar retiro · método de cobro</p>
        </div>
        <span className="text-muted-foreground text-sm">›</span>
      </button>

      <button
        type="button"
        onClick={onLogout}
        className="btn-ghost w-full flex items-center justify-center gap-2"
      >
        <LogOut size={16} /> Cerrar sesión
      </button>

      <style jsx>{`
        .input-field {
          width: 100%;
          background: hsl(var(--background));
          border: 1px solid hsl(var(--border));
          border-radius: 0.5rem;
          padding: 0.75rem;
          color: hsl(var(--foreground));
          outline: none;
          font-size: 0.875rem;
        }
      `}</style>
    </motion.div>
  );
}
