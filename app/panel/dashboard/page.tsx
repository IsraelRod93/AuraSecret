"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3, User, Camera, LogOut, Sparkles, Bell,
  Star, TrendingUp, Users, ShoppingBag,
  MapPin, Heart, Calendar, Edit3,
  Plus, Trash2, Package, Check, X, Image,
  MessageCircle, Send, ArrowLeft, Link2, Copy, Share2,
  Wallet, CreditCard, ArrowDownToLine, Lightbulb,
} from "lucide-react";
import { CelestialBackground } from "@/components/celestial-background";

// ── Types ──

interface Companion {
  id: string; name: string; photo_url: string; status: string; email: string;
  age: number | null; location: string | null; personality_type: string | null;
  tagline: string | null; description: string | null; stripe_account_id: string | null;
}

interface VaultItem {
  id: string; type: string; title: string | null; price: number;
  file_url: string | null; thumbnail_url: string | null; group_name: string | null;
}

interface Stats {
  totalSales: number; totalRevenue: number; uniqueClients: number;
  totalItems: number; weekRevenue: number;
  monthGrowth?: number;
  weekDaily?: number[];
}

interface Sale {
  amount: number; created_at: string; title: string | null;
  first_name: string | null; username: string | null;
}

interface BalanceData {
  earningsStars: number;
  pendingStars: number;
  availableStars: number;
  estimatedMxn: number;
  minWithdrawalStars: number;
  starsToMxn: number;
  mpEmail: string | null;
  clabe: string | null;
}

const PERSONALITY_OPTIONS = [
  { value: 'romantica', label: 'Romántica' },
  { value: 'aventurera', label: 'Aventurera' },
  { value: 'intelectual', label: 'Intelectual' },
  { value: 'divertida', label: 'Divertida' },
  { value: 'misteriosa', label: 'Misteriosa' },
  { value: 'coqueta', label: 'Coqueta' },
];

const fmt = (n: number) => new Intl.NumberFormat('es-MX').format(n);

// ── Main Component ──

export default function PanelDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<'dashboard' | 'profile' | 'photos' | 'chats' | 'pagos'>('dashboard');
  const [companion, setCompanion] = useState<Companion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/panel-auth/me')
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => setCompanion(d.companion))
      .catch(() => router.push('/panel/login'))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch('/api/panel-auth/logout', { method: 'POST' });
    router.push('/panel/login');
  };

  if (loading || !companion) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Sparkles className="text-primary animate-pulse" size={32} />
      </div>
    );
  }

  const TABS = [
    { key: 'dashboard' as const, label: 'Inicio', icon: BarChart3 },
    { key: 'photos' as const, label: 'Fotos', icon: Camera },
    { key: 'chats' as const, label: 'Chats', icon: MessageCircle },
    { key: 'pagos' as const, label: 'Pagos', icon: Wallet },
    { key: 'profile' as const, label: 'Perfil', icon: User },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 relative overflow-hidden">
      <CelestialBackground />

      {/* Header */}
      <div className="relative z-10 px-4 page-top-inset pb-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <img
            src={companion.photo_url}
            alt=""
            className="w-11 h-11 rounded-full object-cover"
            style={{ border: "2px solid var(--primary)" }}
          />
          <div className="flex-1">
            <h1 className="font-serif text-[17px] text-foreground">{companion.name}</h1>
            <div className="flex items-center gap-1 text-[10px]" style={{ color: "var(--green)" }}>
              <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: "var(--green)" }} />
              {companion.status === 'active' ? 'Perfil activo' : 'Pendiente'}
            </div>
          </div>
          <button
            type="button"
            className="p-2 cursor-pointer"
            title="Notificaciones"
            style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: 12, color: "var(--fg-soft)" }}
          >
            <Bell size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-lg mx-auto px-4">
        <AnimatePresence mode="wait">
          {tab === 'dashboard' && <DashboardTab key="dash" companionId={companion.id} />}
          {tab === 'profile' && (
            <ProfileTab
              key="prof"
              companion={companion}
              onUpdate={setCompanion}
              onLogout={handleLogout}
            />
          )}
          {tab === 'photos' && <PhotosTab key="photos" companionId={companion.id} />}
          {tab === 'chats' && <ChatsTab key="chats" companionId={companion.id} />}
          {tab === 'pagos' && <PayoutTab key="pagos" />}
        </AnimatePresence>
      </div>

      {/* Bottom navbar */}
      <nav className="fixed bottom-3 left-3 right-3 z-30 nav-glass" style={{ borderRadius: 20, padding: "8px 6px" }}>
        <div className="max-w-lg mx-auto flex items-center justify-around py-2.5">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="relative flex flex-col items-center gap-0.5 px-4 py-1 transition-colors cursor-pointer bg-transparent border-none"
              style={{ color: tab === t.key ? "var(--primary)" : "var(--fg-muted)" }}
            >
              <t.icon size={20} />
              <span className="text-[10px] font-medium">{t.label}</span>
              {tab === t.key && <span className="nav-dot" />}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

// ── Dashboard Tab ──

function DashboardTab({ companionId }: { companionId: string }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { setStats(d.stats); setSales(d.recentSales || []); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  // amount en purchases = Telegram Stars pagados por el usuario
  // Companion recibe 80% de los Stars totales
  const earnings = stats ? Math.round(stats.totalRevenue * 0.8) : 0;
  const weekEarnings = stats ? Math.round(stats.weekRevenue * 0.8) : 0;
  const monthGrowth = stats?.monthGrowth ?? 0;

  const weekData = stats?.weekDaily?.length === 7
    ? stats.weekDaily.map((c) => Math.round(c * 0.8))
    : [0, 0, 0, 0, 0, 0, 0];
  const weekMax = Math.max(...weekData, 1);
  const dayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3.5">
      {/* Hero earnings card */}
      <div
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, oklch(0.30 0.16 155 / 0.20), oklch(0.18 0.08 295 / 0.40))",
          border: "1px solid oklch(0.65 0.16 155 / 0.30)",
          borderRadius: 22,
          padding: 22,
        }}
      >
        <div
          className="absolute pointer-events-none"
          style={{
            top: -20, right: -20, width: 160, height: 160, borderRadius: "50%",
            background: "radial-gradient(circle, oklch(0.70 0.16 155 / 0.18), transparent 70%)",
          }}
        />
        <p className="text-xs text-muted-foreground mb-1">Has ganado este mes</p>
        <div className="flex items-baseline gap-1.5">
          <span className="font-serif text-[44px] font-medium leading-none" style={{ color: "var(--green)" }}>
            ★{fmt(earnings)}
          </span>
          <span className="text-[13px] text-muted-foreground">Stars</span>
        </div>
        <div className="flex items-center gap-1.5 mt-2.5">
          <span className="chip-green">
            <TrendingUp size={11} />
            {monthGrowth >= 0 ? `+${monthGrowth}%` : `${monthGrowth}%`}
          </span>
          <span className="text-[11px] text-muted-foreground">vs mes pasado</span>
        </div>

        {/* Mini bar chart */}
        <div className="flex items-end gap-[5px] mt-[18px]" style={{ height: 50 }}>
          {weekData.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-[4px] transition-colors"
                style={{
                  height: `${(v / weekMax) * 100}%`,
                  background: i === weekData.length - 1
                    ? "linear-gradient(180deg, var(--green), oklch(0.55 0.15 155))"
                    : "oklch(0.40 0.10 285 / 0.5)",
                }}
              />
              <span
                className="text-[9px]"
                style={{ color: i === weekData.length - 1 ? "var(--green)" : "var(--fg-muted)" }}
              >
                {dayLabels[i]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: ShoppingBag, color: "var(--gold)", n: stats?.totalSales || 0, label: "ventas" },
          { icon: Users, color: "oklch(0.78 0.16 220)", n: stats?.uniqueClients || 0, label: "clientes" },
          { icon: TrendingUp, color: "var(--pink)", n: `★${fmt(weekEarnings)}`, label: "esta semana" },
        ].map((s, i) => (
          <div key={i} className="solid-card rounded-[14px] p-3 text-center">
            <s.icon size={16} style={{ color: s.color, margin: "0 auto" }} />
            <p className="font-serif text-xl font-medium mt-1">{s.n}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Shareable link */}
      <ShareLinkCard companionId={companionId} />

      {/* Recent sales */}
      <div>
        <div className="flex items-baseline justify-between mb-2.5">
          <h3 className="font-serif text-[17px] text-foreground">Ventas recientes</h3>
          {sales.length > 0 && <span className="text-[11px] text-primary cursor-pointer">Ver todas</span>}
        </div>
        {sales.length === 0 ? (
          <div className="text-center py-8 solid-card rounded-[14px]">
            <ShoppingBag className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Aun no tienes ventas</p>
            <p className="text-xs text-muted-foreground mt-1">Sube fotos y comparte tu enlace</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {sales.map((sale, i) => (
              <div key={i} className="solid-card rounded-[14px] p-2.5 flex items-center gap-2.5">
                <div
                  className="grid place-items-center flex-shrink-0"
                  style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: "var(--green-soft)", color: "var(--green)",
                  }}
                >
                  <Star size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium">{sale.title || 'Contenido'}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {sale.first_name || sale.username || 'Anonimo'} · {new Date(sale.created_at).toLocaleDateString('es-MX')}
                  </p>
                </div>
                <span className="font-serif text-base font-medium" style={{ color: "var(--green)" }}>
                  +★{fmt(Math.round(sale.amount * 0.8))}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tip card */}
      <div
        className="flex items-center gap-3"
        style={{
          background: "linear-gradient(135deg, oklch(0.55 0.18 300 / 0.10), oklch(0.45 0.20 320 / 0.08))",
          border: "1px solid var(--primary-soft)",
          borderRadius: 16, padding: 14,
        }}
      >
        <div
          className="grid place-items-center flex-shrink-0"
          style={{
            width: 36, height: 36, borderRadius: 10,
            background: "var(--primary-soft)", color: "oklch(0.85 0.10 300)",
          }}
        >
          <Sparkles size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold" style={{ color: "oklch(0.85 0.10 300)" }}>Tip de Aura</p>
          <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
            Sube 3 fotos hoy y duplica tus visitas este fin de semana
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ── Profile Tab ──

function ProfileTab({
  companion,
  onUpdate,
  onLogout,
}: {
  companion: Companion;
  onUpdate: (c: Companion) => void;
  onLogout: () => void;
}) {
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
          body: newPhoto 
        });
        const uploadData = await uploadRes.json();
        if (uploadData.url) {
          photo_url = uploadData.url;
        }
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

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
      {/* Photo */}
      <div className="flex justify-center">
        <label className="relative cursor-pointer">
          <img src={photoPreview || companion.photo_url} alt="" className="w-24 h-24 rounded-full object-cover border-2 border-primary" />
          <div className="absolute bottom-0 right-0 bg-primary rounded-full w-8 h-8 flex items-center justify-center border-2 border-background">
            {changingPhoto ? <Sparkles size={14} className="text-primary-foreground animate-spin" /> : <Camera size={14} className="text-primary-foreground" />}
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

      {/* Payment info */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-2">
        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Star size={16} className="text-green-400" /> Información de pagos
        </h4>
        <p className="text-xs text-muted-foreground">
          Tú recibes el <strong className="text-green-400">80%</strong> de cada venta en <strong className="text-green-400">Telegram Stars ★</strong>. Las Stars se acumulan en tu cuenta y las retiras cuando quieras.
        </p>
      </div>

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

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-primary text-xs flex items-center gap-1">{icon}{label}</label>
      {children}
    </div>
  );
}

// ── Photos Tab ──

function PhotosTab({ companionId }: { companionId: string }) {
  const [mode, setMode] = useState<'individual' | 'packages'>('individual');
  const [items, setItems] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [priceModal, setPriceModal] = useState<{ files: File[] } | null>(null);
  const [newPrice, setNewPrice] = useState('49');
  const [selectedPhoto, setSelectedPhoto] = useState<VaultItem | null>(null);
  const [editPrice, setEditPrice] = useState('');

  // Package creation & editing
  const [creatingPackage, setCreatingPackage] = useState(false);
  const [editingPackage, setEditingPackage] = useState<string | null>(null);
  const [editPkgName, setEditPkgName] = useState('');
  const [editPkgPrice, setEditPkgPrice] = useState('');
  const [pkgName, setPkgName] = useState('');
  const [pkgPrice, setPkgPrice] = useState('');
  const [pkgSelected, setPkgSelected] = useState<string[]>([]);
  const [pkgNewFiles, setPkgNewFiles] = useState<File[]>([]);

  useEffect(() => { loadItems(); }, [companionId]);

  const loadItems = async () => {
    try {
      const res = await fetch(`/api/vault?companionId=${companionId}`);
      const data = await res.json();
      setItems(data.items || []);
    } finally { setLoading(false); }
  };

  // Individual photos
  const individualItems = items.filter(i => !i.group_name);
  const packages = items.reduce((acc, item) => {
    if (!item.group_name) return acc;
    if (!acc[item.group_name]) acc[item.group_name] = [];
    acc[item.group_name].push(item);
    return acc;
  }, {} as Record<string, VaultItem[]>);

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setPriceModal({ files: Array.from(files) });
    setNewPrice('49');
  };

  const handleUploadWithPrice = async () => {
    if (!priceModal) return;
    setUploading(true);

    try {
      for (const file of priceModal.files) {
        const uploadRes = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, { method: 'POST', body: file });
        const uploadData = await uploadRes.json();
        if (!uploadData.url) throw new Error('Error al subir');

        const itemType = file.type.startsWith('video/') ? 'video' : 'photo';
        await fetch('/api/vault', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companionId, type: itemType,
            title: file.name.replace(/\.[^.]+$/, ''),
            price: Number(newPrice) * 100,
            fileUrl: uploadData.url,
          }),
        });
      }
      setPriceModal(null);
      await loadItems();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al subir');
    } finally { setUploading(false); }
  };

  const handleUpdatePrice = async (itemId: string) => {
    await fetch('/api/vault', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, price: Number(editPrice) * 100 }),
    });
    setSelectedPhoto(null);
    await loadItems();
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('¿Eliminar este archivo?')) return;
    await fetch('/api/vault', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId }),
    });
    setSelectedPhoto(null);
    await loadItems();
  };

  const handleCreatePackage = async () => {
    if (!pkgName || !pkgPrice) { alert('Pon nombre y precio al paquete'); return; }
    if (pkgSelected.length === 0 && pkgNewFiles.length === 0) { alert('Agrega fotos al paquete'); return; }

    setUploading(true);
    try {
      for (const id of pkgSelected) {
        await fetch('/api/vault', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId: id, groupName: pkgName, price: Number(pkgPrice) * 100 }),
        });
      }

      for (const file of pkgNewFiles) {
        const uploadRes = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, { method: 'POST', body: file });
        const uploadData = await uploadRes.json();
        if (!uploadData.url) continue;

        const itemType = file.type.startsWith('video/') ? 'video' : 'photo';
        await fetch('/api/vault', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companionId, type: itemType,
            title: file.name.replace(/\.[^.]+$/, ''),
            price: Number(pkgPrice) * 100,
            fileUrl: uploadData.url,
            groupName: pkgName,
          }),
        });
      }

      setCreatingPackage(false);
      setPkgName(''); setPkgPrice(''); setPkgSelected([]); setPkgNewFiles([]);
      await loadItems();
    } catch { alert('Error al crear paquete'); }
    finally { setUploading(false); }
  };

  const handleDeletePackage = async (groupName: string) => {
    if (!confirm(`Eliminar el paquete "${groupName}" y todas sus fotos?`)) return;
    const pkgItems = packages[groupName];
    setUploading(true);
    try {
      for (const item of pkgItems) {
        await fetch('/api/vault', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId: item.id }),
        });
      }
      setEditingPackage(null);
      await loadItems();
    } catch { 
      alert('Error al eliminar paquete'); 
    } finally { 
      setUploading(false); 
    }
  };

  const handleUpdatePackage = async () => {
    if (!editingPackage || !editPkgName || !editPkgPrice) return;
    setUploading(true);
    try {
      const pkgItems = packages[editingPackage];
      // Update existing items in the package
      for (const item of pkgItems) {
        await fetch('/api/vault', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            itemId: item.id, 
            groupName: editPkgName, 
            price: Number(editPkgPrice) * 100 
          }),
        });
      }

      // Upload new photos/videos to the package
      for (const file of pkgNewFiles) {
        const uploadRes = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, { method: 'POST', body: file });
        const uploadData = await uploadRes.json();
        if (!uploadData.url) continue;

        const itemType = file.type.startsWith('video/') ? 'video' : 'photo';
        await fetch('/api/vault', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companionId, type: itemType,
            title: file.name.replace(/\.[^.]+$/, ''),
            price: Number(editPkgPrice) * 100,
            fileUrl: uploadData.url,
            groupName: editPkgName,
          }),
        });
      }

      setEditingPackage(null);
      setPkgNewFiles([]);
      await loadItems();
    } catch { 
      alert('Error al actualizar paquete'); 
    } finally { 
      setUploading(false); 
    }
  };

  const handleRemoveFromPackage = async (itemId: string) => {
    await fetch('/api/vault', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, groupName: null }),
    });
    await loadItems();
  };

  const handleAddPhotosToPackage = async (groupName: string, files: File[], price: number) => {
    setUploading(true);
    try {
      for (const file of files) {
        const uploadRes = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, { method: 'POST', body: file });
        const uploadData = await uploadRes.json();
        if (!uploadData.url) continue;

        await fetch('/api/vault', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companionId, type: 'photo',
            title: file.name.replace(/\.[^.]+$/, ''),
            price,
            fileUrl: uploadData.url,
            groupName,
          }),
        });
      }
      await loadItems();
    } finally { setUploading(false); }
  };
  const openEditPackage = (groupName: string) => {
    setEditingPackage(groupName);
    setEditPkgName(groupName);
    const pkgItems = packages[groupName];
    if (pkgItems && pkgItems.length > 0) {
      setEditPkgPrice(String(pkgItems[0].price / 100));
    }
    setPkgNewFiles([]);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* Mode toggle */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <button
          onClick={() => setMode('individual')}
          className={`rounded-xl p-4 border-2 text-left transition-all ${
            mode === 'individual' ? 'bg-primary/10 border-primary' : 'bg-card border-border'
          }`}
        >
          <Camera size={22} className={mode === 'individual' ? 'text-primary' : 'text-muted-foreground'} />
          <p className={`font-medium text-sm mt-2 ${mode === 'individual' ? 'text-primary' : 'text-foreground'}`}>Fotos sueltas</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Cada una tiene su precio</p>
        </button>
        <button
          onClick={() => setMode('packages')}
          className={`rounded-xl p-4 border-2 text-left transition-all ${
            mode === 'packages' ? 'bg-primary/10 border-primary' : 'bg-card border-border'
          }`}
        >
          <Package size={22} className={mode === 'packages' ? 'text-primary' : 'text-muted-foreground'} />
          <p className={`font-medium text-sm mt-2 ${mode === 'packages' ? 'text-primary' : 'text-foreground'}`}>Paquetes</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Varias fotos, un precio</p>
        </button>
      </div>

      {mode === 'individual' ? (
        <>
          {/* Upload zone */}
          <label className="block bg-card border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary transition-colors mb-4">
            {uploading ? (
              <Sparkles className="mx-auto mb-2 text-primary animate-spin" size={28} />
            ) : (
              <Plus className="mx-auto mb-2 text-muted-foreground" size={28} />
            )}
            <p className="text-sm text-muted-foreground">{uploading ? 'Subiendo...' : 'Toca para subir fotos o videos'}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Cada archivo se vende por separado</p>
            <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={e => handleFilesSelected(e.target.files)} disabled={uploading} />
          </label>

          {/* Individual grid */}
          {individualItems.length === 0 ? (
            <div className="text-center py-12">
              <Image className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Aún no tienes fotos</p>
              <p className="text-xs text-muted-foreground">Sube tu primera foto para empezar</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {individualItems.map(item => (
                <button key={item.id} onClick={() => { setSelectedPhoto(item); setEditPrice(String(item.price / 100)); }} className="relative aspect-square rounded-lg overflow-hidden bg-slate-900">
                  {item.type === 'video' ? (
                    <>
                      <video src={item.file_url || ''} preload="none" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white fill-white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                      </div>
                    </>
                  ) : (
                    <img src={item.file_url || item.thumbnail_url || ''} alt={item.title || ''} className="w-full h-full object-cover" />
                  )}
                  <div className="absolute bottom-1 left-1 bg-green-500/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    ★{item.price / 100}
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Create package button */}
          <button
            onClick={() => setCreatingPackage(true)}
            className="w-full bg-card border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary transition-colors mb-4"
          >
            <Plus className="mx-auto mb-2 text-muted-foreground" size={28} />
            <p className="text-sm text-muted-foreground">Crear nuevo paquete</p>
          </button>

          {/* Package list */}
          {Object.keys(packages).length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No tienes paquetes</p>
              <p className="text-xs text-muted-foreground">Crea un paquete para vender varias fotos juntas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(packages).map(([name, pkgItems]) => (
                <button
                  key={name}
                  onClick={() => openEditPackage(name)}
                  className="w-full bg-card border border-border rounded-xl p-4 text-left hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-foreground text-sm">{name}</p>
                      <p className="text-xs text-muted-foreground">{pkgItems.length} fotos · ★{pkgItems[0].price / 100} Stars</p>
                    </div>
                    <Edit3 size={16} className="text-muted-foreground" />
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {pkgItems.map(item => (
                      <div key={item.id} className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-slate-900 relative">
                        {item.type === 'video' ? (
                          <div className="w-full h-full flex items-center justify-center bg-slate-800">
                            <svg className="w-6 h-6 text-white/60 fill-white/60" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                          </div>
                        ) : (
                          <img src={item.file_url || item.thumbnail_url || ''} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Modals ── */}

      {/* Price modal for new uploads */}
      <AnimatePresence>
        {priceModal && (
          <Modal onClose={() => setPriceModal(null)}>
            <h3 className="font-serif text-lg text-foreground mb-1">Precio por archivo</h3>
            <p className="text-xs text-muted-foreground mb-4">
              {priceModal.files.length} archivo{priceModal.files.length > 1 ? 's' : ''} seleccionado{priceModal.files.length > 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-muted-foreground text-lg">★</span>
              <input
                type="number" autoFocus
                className="flex-1 bg-background border border-border rounded-lg p-3 text-foreground text-2xl font-bold text-center outline-none"
                value={newPrice} onChange={e => setNewPrice(e.target.value)}
              />
              <span className="text-muted-foreground text-sm">Stars</span>
            </div>
            <button 
              onClick={handleUploadWithPrice} 
              disabled={uploading}
              className="w-full bg-primary text-primary-foreground p-3 rounded-lg font-bold disabled:opacity-50"
            >
              {uploading ? 'Subiendo...' : 'GUARDAR Y SUBIR'}
            </button>
          </Modal>
        )}
      </AnimatePresence>

      {/* Photo detail modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <Modal onClose={() => setSelectedPhoto(null)}>
            {selectedPhoto.type === 'video' ? (
              <video src={selectedPhoto.file_url || ''} controls playsInline preload="metadata" className="w-full aspect-square object-cover rounded-xl mb-4" />
            ) : (
              <img src={selectedPhoto.file_url || selectedPhoto.thumbnail_url || ''} alt="" className="w-full aspect-square object-cover rounded-xl mb-4" />
            )}
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Precio (Stars)</label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-muted-foreground">★</span>
                  <input
                    type="number"
                    className="flex-1 bg-background border border-border rounded-lg p-2.5 text-foreground text-lg font-bold outline-none"
                    value={editPrice} onChange={e => setEditPrice(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleUpdatePrice(selectedPhoto.id)}
                  className="flex-1 bg-primary text-primary-foreground p-3 rounded-lg font-bold text-sm"
                >
                  Guardar precio
                </button>
                <button
                  onClick={() => handleDelete(selectedPhoto.id)}
                  className="px-4 p-3 rounded-lg bg-red-500/20 text-red-400 font-bold text-sm"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Package creation modal */}
      <AnimatePresence>
        {creatingPackage && (
          <Modal onClose={() => { setCreatingPackage(false); setPkgSelected([]); setPkgNewFiles([]); }}>
            <h3 className="font-serif text-lg text-foreground mb-4">Crear paquete</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground">Nombre del paquete</label>
                <input
                  className="w-full bg-background border border-border rounded-lg p-3 text-foreground outline-none text-sm mt-1"
                  value={pkgName} onChange={e => setPkgName(e.target.value)}
                  placeholder="Ej: Sesion en la playa"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Precio del paquete completo</label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-muted-foreground">★</span>
                  <input
                    type="number"
                    className="flex-1 bg-background border border-border rounded-lg p-3 text-foreground font-bold outline-none"
                    value={pkgPrice} onChange={e => setPkgPrice(e.target.value)}
                    placeholder="199"
                  />
                  <span className="text-muted-foreground text-sm">Stars</span>
                </div>
              </div>

              {individualItems.length > 0 && (
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Seleccionar fotos que ya subiste</label>
                  <div className="grid grid-cols-4 gap-1.5 max-h-40 overflow-y-auto">
                    {individualItems.map(item => (
                      <button
                        key={item.id}
                        onClick={() => setPkgSelected(prev => prev.includes(item.id) ? prev.filter(x => x !== item.id) : [...prev, item.id])}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 ${pkgSelected.includes(item.id) ? 'border-primary' : 'border-transparent'}`}
                      >
                        <img src={item.file_url || item.thumbnail_url || ''} alt="" className="w-full h-full object-cover" />
                        {pkgSelected.includes(item.id) && (
                          <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                            <Check size={20} className="text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-muted-foreground mb-2 block">O sube fotos nuevas</label>
                <label className="block bg-background border border-dashed border-border rounded-lg p-3 text-center cursor-pointer text-sm text-muted-foreground">
                  <Plus size={16} className="inline mr-1" />
                  {pkgNewFiles.length > 0 ? `${pkgNewFiles.length} archivo${pkgNewFiles.length > 1 ? 's' : ''} listo${pkgNewFiles.length > 1 ? 's' : ''}` : 'Subir fotos o videos'}
                  <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={e => { if (e.target.files) setPkgNewFiles(Array.from(e.target.files)); }} />
                </label>
              </div>

              <div className="bg-background rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">
                  {pkgSelected.length + pkgNewFiles.length} archivo{pkgSelected.length + pkgNewFiles.length !== 1 ? 's' : ''} en el paquete
                </p>
                {pkgName && pkgPrice && pkgSelected.length === 0 && pkgNewFiles.length === 0 && (
                  <p className="text-[10px] text-primary mt-1 font-medium animate-pulse">
                    Agrega al menos una foto para poder guardar
                  </p>
                )}
              </div>

              <button
                onClick={handleCreatePackage}
                disabled={uploading || !pkgName || !pkgPrice || (pkgSelected.length === 0 && pkgNewFiles.length === 0)}
                className="w-full bg-primary text-primary-foreground p-3 rounded-lg font-bold disabled:opacity-50"
              >
                {uploading ? 'Guardando...' : 'GUARDAR Y CREAR PAQUETE'}
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Package edit modal */}
      <AnimatePresence>
        {editingPackage && packages[editingPackage] && (
          <Modal onClose={() => { setEditingPackage(null); setPkgNewFiles([]); }}>
            <h3 className="font-serif text-lg text-foreground mb-4">Editar paquete</h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground">Nombre del paquete</label>
                <input
                  className="w-full bg-background border border-border rounded-lg p-3 text-foreground outline-none text-sm mt-1"
                  value={editPkgName} onChange={e => setEditPkgName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Precio del paquete completo</label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-muted-foreground">★</span>
                  <input
                    type="number"
                    className="flex-1 bg-background border border-border rounded-lg p-3 text-foreground font-bold outline-none"
                    value={editPkgPrice} onChange={e => setEditPkgPrice(e.target.value)}
                  />
                  <span className="text-muted-foreground text-sm">Stars</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Fotos en este paquete</label>
                <div className="grid grid-cols-3 gap-2">
                  {packages[editingPackage].map(item => (
                    <div key={item.id} className="relative aspect-square rounded-lg overflow-hidden bg-slate-900">
                      {item.type === 'video' ? (
                        <div className="w-full h-full flex items-center justify-center bg-slate-800">
                          <svg className="w-8 h-8 text-white/60 fill-white/60" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                      ) : (
                        <img src={item.file_url || item.thumbnail_url || ''} alt="" className="w-full h-full object-cover" />
                      )}
                      <button
                        onClick={async () => {
                          if (packages[editingPackage].length <= 1) {
                            alert('Un paquete necesita al menos 1 foto. Elimina el paquete completo si quieres.');
                            return;
                          }
                          await handleRemoveFromPackage(item.id);
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Agregar mas fotos</label>
                <label className="block bg-background border border-dashed border-border rounded-lg p-3 text-center cursor-pointer text-sm text-muted-foreground">
                  <Plus size={16} className="inline mr-1" />
                  {pkgNewFiles.length > 0 ? `${pkgNewFiles.length} archivo${pkgNewFiles.length > 1 ? 's' : ''} seleccionado` : 'Seleccionar fotos o videos'}
                  <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={e => { if (e.target.files) setPkgNewFiles(prev => [...prev, ...Array.from(e.target.files!)]); }} />
                </label>
                {pkgNewFiles.length > 0 && (
                  <div className="grid grid-cols-4 gap-1.5 mt-2">
                    {pkgNewFiles.map((file, i) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-slate-900">
                        {file.type.startsWith('video/') ? (
                          <div className="w-full h-full flex items-center justify-center bg-slate-800">
                            <svg className="w-6 h-6 text-white/60 fill-white/60" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                          </div>
                        ) : (
                          <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                        )}
                        <button
                          onClick={() => setPkgNewFiles(prev => prev.filter((_, j) => j !== i))}
                          className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleUpdatePackage}
                  disabled={uploading || !editPkgName || !editPkgPrice}
                  className="flex-1 bg-primary text-primary-foreground p-3 rounded-lg font-bold text-sm disabled:opacity-50"
                >
                  {uploading ? 'Guardando...' : 'GUARDAR CAMBIOS'}
                </button>
                <button
                  onClick={() => handleDeletePackage(editingPackage)}
                  className="px-4 p-3 rounded-lg bg-red-500/20 text-red-400 font-bold text-sm"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {pkgNewFiles.length > 0 && (
                <p className="text-[10px] text-muted-foreground text-center">
                  * Las nuevas fotos se subirán al guardar los cambios
                </p>
              )}
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Chats Tab ──

interface ChatPreview {
  conversation_id: string;
  user_id: string;
  message_count: number;
  updated_at: string;
  first_name: string | null;
  username: string | null;
  last_message: string | null;
  last_message_role: string | null;
}

interface ChatMessage {
  role: string;
  content: string;
  created_at: string;
}

function ChatsTab({ companionId }: { companionId: string }) {
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState<ChatPreview | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => { loadChats(); }, [companionId]);

  const loadChats = async () => {
    try {
      const res = await fetch(`/api/panel-chats?companionId=${companionId}`);
      const data = await res.json();
      setChats(data.chats || []);
    } finally { setLoading(false); }
  };

  const openChat = async (chat: ChatPreview) => {
    setActiveChat(chat);
    setMsgsLoading(true);
    try {
      const res = await fetch(`/api/panel-chats/messages?conversationId=${chat.conversation_id}`);
      const data = await res.json();
      setMessages(data.messages || []);
    } finally { setMsgsLoading(false); }
  };

  const sendReply = async () => {
    if (!reply.trim() || !activeChat) return;
    setSending(true);
    try {
      await fetch('/api/panel-chats/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: activeChat.conversation_id, content: reply.trim() }),
      });
      setMessages(prev => [...prev, { role: 'companion', content: reply.trim(), created_at: new Date().toISOString() }]);
      setReply('');
    } finally { setSending(false); }
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'ahora';
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  if (loading) return <LoadingSpinner />;

  if (activeChat) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col" style={{ minHeight: 'calc(100vh - 180px)' }}>
        {/* Chat header */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setActiveChat(null)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1" />
          <button
            onClick={async () => {
              if (!activeChat) return;
              if (!confirm('Eliminar esta conversación?')) return;
              try {
                await fetch('/api/panel-chats', {
                  method: 'DELETE',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ conversationId: activeChat.conversation_id }),
                });
                setActiveChat(null);
                await loadChats();
              } catch (e) {
                alert('Error al eliminar conversación');
              }
            }}
            className="text-red-400 p-2"
            title="Eliminar conversación"
          >
            <Trash2 size={18} />
          </button>
          <div>
            <p className="text-foreground font-medium text-sm">{activeChat.first_name || activeChat.username || 'Usuario'}</p>
            <p className="text-[10px] text-muted-foreground">{activeChat.message_count} mensajes</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-3 overflow-y-auto mb-4 max-h-[55vh]">
          {msgsLoading ? <LoadingSpinner /> : messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'companion' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                msg.role === 'companion'
                  ? 'bg-primary/20 border border-primary/30 text-foreground'
                  : 'bg-card border border-border text-foreground'
              }`}>
                <p>{msg.content}</p>
                <p className="text-[9px] text-muted-foreground mt-1">{timeAgo(msg.created_at)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Reply input */}
        <div className="flex gap-2 mt-auto">
          <input
            className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm outline-none"
            value={reply}
            onChange={e => setReply(e.target.value)}
            placeholder="Escribe tu respuesta..."
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
          />
          <button
            onClick={sendReply}
            disabled={!reply.trim() || sending}
            className="bg-primary text-primary-foreground rounded-xl px-4 disabled:opacity-40"
          >
            <Send size={18} />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <h3 className="font-serif text-base text-foreground mb-3">Mensajes de usuarios</h3>
      {chats.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <MessageCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Aun no tienes mensajes</p>
          <p className="text-xs text-muted-foreground mt-1">Cuando alguien te escriba aparecera aqui</p>
        </div>
      ) : (
        <div className="space-y-2">
          {chats.map(chat => (
            <button
              key={chat.conversation_id}
              onClick={() => openChat(chat)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-all text-left"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{chat.first_name || chat.username || 'Usuario'}</span>
                  <span className="text-[10px] text-muted-foreground">{timeAgo(chat.updated_at)}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {chat.last_message_role === 'companion' ? 'Tu: ' : ''}{chat.last_message || '...'}
                </p>
              </div>
              {chat.last_message_role === 'user' && (
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ── Shared Components ──

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-6"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-card rounded-t-2xl sm:rounded-2xl p-6 pb-24 sm:pb-6 w-full max-w-sm border border-border max-h-[85vh] overflow-y-auto relative"
        initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground">
          <X size={20} />
        </button>
        {children}
      </motion.div>
    </motion.div>
  );
}

function ShareLinkCard({ companionId }: { companionId: string }) {
  const [copied, setCopied] = useState(false);
  const link = `https://t.me/AuraSecretx_bot?start=crea_${companionId}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const input = document.createElement('input');
      input.value = link;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareLink = async () => {
    if (navigator.share) {
      await navigator.share({
        title: 'AuraSecret',
        text: 'Descubre mi contenido exclusivo en AuraSecret',
        url: link,
      }).catch(() => {});
    } else {
      copyLink();
    }
  };

  return (
    <div className="bg-gradient-to-br from-primary/20 to-pink-500/10 border border-primary/30 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Link2 className="w-4 h-4 text-primary" />
        <h3 className="font-serif text-sm text-foreground font-medium">Tu link para fans</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Comparte este link en Instagram, TikTok o Twitter para traer fans directamente a tu chat
      </p>
      <div className="bg-background/60 rounded-lg p-2.5 flex items-center gap-2 mb-3">
        <code className="text-[10px] text-foreground/80 flex-1 break-all">{link}</code>
      </div>
      <div className="flex gap-2">
        <button
          onClick={copyLink}
          className="flex-1 flex items-center justify-center gap-1.5 bg-card border border-border rounded-lg py-2 text-sm text-foreground hover:bg-card/80 transition-colors"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copiado!' : 'Copiar'}
        </button>
        <button
          onClick={shareLink}
          className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-primary-foreground rounded-lg py-2 text-sm font-medium"
        >
          <Share2 className="w-4 h-4" />
          Compartir
        </button>
      </div>
    </div>
  );
}

// ── Payout Tab ──

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
  const canWithdraw = balance && balance.availableStars >= (balance.minWithdrawalStars);
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
        </div>

        {!hasPaymentMethod ? (
          <p className="text-xs text-muted-foreground py-2">Primero guarda tu Mercado Pago o CLABE arriba para poder retirar.</p>
        ) : !canWithdraw ? (
          <p className="text-xs text-muted-foreground py-2">
            Necesitas al menos ★{balance?.minWithdrawalStars} disponibles (~${((balance?.minWithdrawalStars || 500) * (balance?.starsToMxn || 0.15)).toFixed(0)} MXN). Tienes ★{balance?.availableStars || 0}.
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
          {
            titulo: 'Sube contenido diariamente',
            texto: 'Las creadores que suben 1 foto al día tienen 3x más ventas. La constancia genera anticipación y fidelidad.',
          },
          {
            titulo: 'Usa paquetes temáticos',
            texto: 'Un paquete de 5-10 fotos por ★150-200 convierte mejor que fotos sueltas. El cliente siente que "gana" más.',
          },
          {
            titulo: 'Activa la suscripción mensual',
            texto: 'Ingresos recurrentes son la base de un negocio estable. Con 30 suscriptores a ★150 = ★4,500 fijos al mes.',
          },
          {
            titulo: 'Comparte tu link en redes',
            texto: 'Instagram Stories, TikTok o grupos de Telegram multiplican tu alcance sin costo. Cada fan nuevo es ingreso potencial.',
          },
          {
            titulo: 'Responde mensajes rápido',
            texto: 'Los usuarios que reciben respuesta en <1 hora tienen 2x más probabilidad de pagar. La conexión personal vende.',
          },
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

function LoadingSpinner() {
  return (
    <div className="flex justify-center py-12">
      <Sparkles className="text-primary animate-pulse" size={24} />
    </div>
  );
}
