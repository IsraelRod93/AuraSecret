"use client";

import { useState } from 'react';
import { Upload, Lock, CheckCircle, AlertCircle, BarChart3, Users, MessageCircle, TrendingUp, Star, Wallet, Download, RefreshCw, ImageIcon, Trash2, Play } from 'lucide-react';

interface FunnelData {
  bot_start: number;
  first_message: number;
  limit_reached: number;
  payment_completed: number;
  referral_join: number;
}

interface PayoutRow {
  id: string;
  companion_name: string;
  amount_stars: number;
  amount_mxn: string;
  mp_email: string | null;
  clabe: string | null;
  status: string;
  created_at: string;
}

interface PayoutTotals {
  count: number;
  total_stars: number;
  total_mxn: string;
}

export default function AdminPage() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [funnel, setFunnel] = useState<FunnelData | null>(null);
  const [analyticsError, setAnalyticsError] = useState('');

  const [payoutsLoading, setPayoutsLoading] = useState(false);
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [payoutTotals, setPayoutTotals] = useState<PayoutTotals | null>(null);
  const [payoutsError, setPayoutsError] = useState('');
  const [processingPayouts, setProcessingPayouts] = useState(false);
  const [processResult, setProcessResult] = useState('');

  // Content audit
  interface ContentItem {
    id: string; type: string; title: string | null; price: number;
    file_url: string | null; created_at: string;
    companion_name: string; companion_id: string;
  }
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !password) return;
    setLoading(true);
    setError('');
    setUrl('');
    try {
      const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        headers: { 'x-admin-password': password },
        body: file,
      });
      const data = await response.json();
      if (response.ok) setUrl(data.url);
      else setError(data.error || 'Fallo en la subida');
    } catch {
      setError('Error de conexion');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    if (!password) { setAnalyticsError('Ingresa la contrasena primero'); return; }
    setAnalyticsLoading(true);
    setAnalyticsError('');
    setFunnel(null);
    try {
      const res = await fetch('/api/admin/analytics', {
        headers: { 'x-admin-password': password },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setFunnel(data);
    } catch (err) {
      setAnalyticsError(err instanceof Error ? err.message : 'Error al cargar analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const pct = (num: number, den: number) =>
    den === 0 ? '0%' : `${Math.round((num / den) * 100)}%`;

  const loadPayouts = async () => {
    if (!password) { setPayoutsError('Ingresa la contraseña primero'); return; }
    setPayoutsLoading(true);
    setPayoutsError('');
    try {
      const res = await fetch('/api/admin/payouts', { headers: { 'x-admin-password': password } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setPayouts(data.pending || []);
      setPayoutTotals(data.totals || null);
    } catch (err) {
      setPayoutsError(err instanceof Error ? err.message : 'Error al cargar retiros');
    } finally { setPayoutsLoading(false); }
  };

  const processPayouts = async () => {
    if (!confirm(`Procesar ${payouts.length} retiro(s) via Mercado Pago?`)) return;
    setProcessingPayouts(true);
    setProcessResult('');
    try {
      const res = await fetch('/api/admin/payouts', {
        method: 'POST',
        headers: { 'x-admin-password': password },
      });
      const data = await res.json();
      setProcessResult(`✓ ${data.success} exitosos · ${data.failed} fallidos · ${data.manual} manuales`);
      await loadPayouts();
    } catch {
      setProcessResult('Error al procesar');
    } finally { setProcessingPayouts(false); }
  };

  const loadContent = async () => {
    if (!password) { setContentError('Ingresa la contraseña primero'); return; }
    setContentLoading(true);
    setContentError('');
    try {
      const res = await fetch('/api/admin/content', { headers: { 'x-admin-password': password } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setContentItems(data.items || []);
    } catch (err) {
      setContentError(err instanceof Error ? err.message : 'Error al cargar contenido');
    } finally { setContentLoading(false); }
  };

  const deleteItem = async (itemId: string) => {
    if (!confirm('¿Eliminar este archivo? Esta acción no se puede deshacer.')) return;
    setDeletingId(itemId);
    try {
      await fetch('/api/admin/content', {
        method: 'DELETE',
        headers: { 'x-admin-password': password, 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      });
      setContentItems(prev => prev.filter(i => i.id !== itemId));
    } finally { setDeletingId(null); }
  };

  const downloadSpei = async () => {
    const res = await fetch('/api/admin/payouts', {
      method: 'DELETE',
      headers: { 'x-admin-password': password },
    });
    if (!res.ok) { alert('Sin retiros con CLABE pendientes'); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `retiros-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-background min-h-screen font-serif p-5">
      <div className="max-w-lg mx-auto space-y-6">

        {/* Upload */}
        <div className="bg-card p-8 rounded-2xl border-2 border-border text-center shadow-[0_0_30px_rgba(49,27,146,0.3)]">
          <h2 className="text-primary mb-2">Panel de Admin - Aura</h2>
          <p className="text-muted-foreground text-sm mb-6">Sube fotos y revisa el embudo</p>

          <div className="flex flex-col gap-4 mb-6">
            <div className="text-left flex flex-col gap-2">
              <label className="text-muted-foreground text-xs flex items-center gap-1">
                <Lock size={14} /> Contrasena de Acceso
              </label>
              <input
                type="password"
                className="bg-background border border-border rounded-lg p-3 text-foreground outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contrasena del oraculo..."
              />
            </div>
          </div>

          <form onSubmit={handleUpload} className="flex flex-col gap-4">
            <div className="text-left flex flex-col gap-2">
              <label className="text-muted-foreground text-xs flex items-center gap-1">
                <Upload size={14} /> Seleccionar Foto
              </label>
              <input
                type="file"
                accept="image/*"
                className="text-muted-foreground text-sm"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
            <button
              type="submit"
              className="bg-primary text-primary-foreground border-none p-4 rounded-lg font-bold cursor-pointer transition-colors hover:bg-primary/90 disabled:opacity-50"
              disabled={loading || !file || !password}
            >
              {loading ? 'Subiendo...' : 'SUBIR FOTO AL ORACULO'}
            </button>
          </form>

          {url && (
            <div className="mt-6 p-4 bg-green-500/10 rounded-xl border border-green-500">
              <CheckCircle className="text-green-500 mx-auto" />
              <p className="text-foreground mt-2 text-sm">Foto subida con exito!</p>
              <input
                readOnly value={url}
                className="w-full bg-background border border-border text-primary p-2 rounded mt-2 text-xs"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
            </div>
          )}
          {error && (
            <div className="mt-4 text-destructive flex items-center justify-center gap-2 text-sm">
              <AlertCircle size={16} /> {error}
            </div>
          )}
        </div>

        {/* Analytics */}
        <div className="bg-card p-6 rounded-2xl border-2 border-border shadow-[0_0_30px_rgba(49,27,146,0.3)]">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <BarChart3 className="text-primary" size={20} />
              <h3 className="text-foreground font-bold">Embudo de Conversion</h3>
            </div>
            <button
              onClick={loadAnalytics}
              disabled={analyticsLoading}
              className="text-xs bg-primary/20 text-primary px-3 py-1.5 rounded-lg border border-primary/30 hover:bg-primary/30 transition-colors disabled:opacity-50"
            >
              {analyticsLoading ? 'Cargando...' : 'Actualizar'}
            </button>
          </div>

          {analyticsError && (
            <p className="text-destructive text-sm text-center py-4">{analyticsError}</p>
          )}

          {!funnel && !analyticsError && (
            <p className="text-muted-foreground text-sm text-center py-6">
              Ingresa la contrasena y toca Actualizar para ver el embudo
            </p>
          )}

          {funnel && (
            <div className="space-y-3">
              <FunnelRow
                icon={<Users size={16} />}
                label="Abrieron el bot"
                value={funnel.bot_start}
                max={funnel.bot_start}
                color="oklch(0.65 0.18 220)"
              />
              <FunnelRow
                icon={<MessageCircle size={16} />}
                label="Enviaron 1er mensaje"
                value={funnel.first_message}
                max={funnel.bot_start}
                color="oklch(0.65 0.18 280)"
                pctLabel={pct(funnel.first_message, funnel.bot_start)}
              />
              <FunnelRow
                icon={<TrendingUp size={16} />}
                label="Llegaron al limite gratis"
                value={funnel.limit_reached}
                max={funnel.bot_start}
                color="oklch(0.65 0.18 45)"
                pctLabel={pct(funnel.limit_reached, funnel.first_message)}
              />
              <FunnelRow
                icon={<Star size={16} />}
                label="Pagaron (Stars)"
                value={funnel.payment_completed}
                max={funnel.bot_start}
                color="oklch(0.70 0.18 140)"
                pctLabel={pct(funnel.payment_completed, funnel.limit_reached)}
              />
              <FunnelRow
                icon={<Users size={16} />}
                label="Referidos que se unieron"
                value={funnel.referral_join}
                max={funnel.bot_start}
                color="oklch(0.65 0.16 320)"
              />

              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Conversion total (bot → pago)</span>
                  <span className="font-bold text-green-400">
                    {pct(funnel.payment_completed, funnel.bot_start)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Payouts */}
        <div className="bg-card p-6 rounded-2xl border-2 border-border shadow-[0_0_30px_rgba(49,27,146,0.3)]">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Wallet className="text-primary" size={20} />
              <h3 className="text-foreground font-bold">Retiros de Creadoras</h3>
            </div>
            <button
              onClick={loadPayouts}
              disabled={payoutsLoading}
              className="text-xs bg-primary/20 text-primary px-3 py-1.5 rounded-lg border border-primary/30 hover:bg-primary/30 transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              <RefreshCw size={12} className={payoutsLoading ? 'animate-spin' : ''} />
              {payoutsLoading ? 'Cargando...' : 'Actualizar'}
            </button>
          </div>

          {payoutsError && <p className="text-destructive text-sm text-center py-4">{payoutsError}</p>}

          {!payouts.length && !payoutsError && (
            <p className="text-muted-foreground text-sm text-center py-6">
              Ingresa la contraseña y toca Actualizar para ver los retiros pendientes
            </p>
          )}

          {payoutTotals && payoutTotals.count > 0 && (
            <>
              <div className="flex gap-3 mb-4">
                <div className="flex-1 bg-background rounded-xl p-3 text-center border border-border">
                  <p className="text-xl font-bold text-foreground">{payoutTotals.count}</p>
                  <p className="text-[10px] text-muted-foreground">pendientes</p>
                </div>
                <div className="flex-1 bg-background rounded-xl p-3 text-center border border-border">
                  <p className="text-xl font-bold text-yellow-400">★{payoutTotals.total_stars.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">Stars totales</p>
                </div>
                <div className="flex-1 bg-background rounded-xl p-3 text-center border border-border">
                  <p className="text-xl font-bold text-green-400">${Number(payoutTotals.total_mxn).toFixed(0)}</p>
                  <p className="text-[10px] text-muted-foreground">MXN totales</p>
                </div>
              </div>

              <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                {payouts.map(p => (
                  <div key={p.id} className="bg-background border border-border rounded-xl p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{p.companion_name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {p.mp_email ? `MP: ${p.mp_email}` : p.clabe ? `CLABE: ${p.clabe.slice(0, 6)}…` : 'Sin método'}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-green-400">${Number(p.amount_mxn).toFixed(2)}</p>
                      <p className="text-[10px] text-muted-foreground">★{p.amount_stars}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${p.mp_email ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>
                      {p.mp_email ? 'MP' : 'SPEI'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={processPayouts}
                  disabled={processingPayouts}
                  className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processingPayouts ? <RefreshCw size={14} className="animate-spin" /> : <Wallet size={14} />}
                  {processingPayouts ? 'Procesando...' : 'Procesar via MP'}
                </button>
                <button
                  onClick={downloadSpei}
                  className="flex-1 bg-card border border-border text-foreground py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:border-primary/50 transition-colors"
                >
                  <Download size={14} />
                  CSV SPEI
                </button>
              </div>

              {processResult && (
                <p className="text-xs text-center mt-3 text-muted-foreground">{processResult}</p>
              )}
            </>
          )}

          {payoutTotals && payoutTotals.count === 0 && (
            <div className="text-center py-6">
              <CheckCircle className="text-green-500 mx-auto mb-2" size={24} />
              <p className="text-muted-foreground text-sm">Sin retiros pendientes</p>
            </div>
          )}
        </div>

        {/* Content audit */}
        <div className="bg-card p-6 rounded-2xl border-2 border-border shadow-[0_0_30px_rgba(49,27,146,0.3)]">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <ImageIcon className="text-primary" size={20} />
              <h3 className="text-foreground font-bold">Auditoría de Contenido</h3>
              {contentItems.length > 0 && (
                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                  {contentItems.length}
                </span>
              )}
            </div>
            <button
              onClick={loadContent}
              disabled={contentLoading}
              className="text-xs bg-primary/20 text-primary px-3 py-1.5 rounded-lg border border-primary/30 hover:bg-primary/30 transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              <RefreshCw size={12} className={contentLoading ? 'animate-spin' : ''} />
              {contentLoading ? 'Cargando...' : 'Cargar'}
            </button>
          </div>

          {contentError && <p className="text-destructive text-sm text-center py-4">{contentError}</p>}

          {!contentItems.length && !contentError && (
            <p className="text-muted-foreground text-sm text-center py-6">
              Ingresa la contraseña y toca Cargar para auditar el contenido
            </p>
          )}

          {contentItems.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {contentItems.map(item => (
                <div key={item.id} className="bg-background border border-border rounded-xl overflow-hidden">
                  <div className="relative aspect-square bg-slate-900">
                    {item.type === 'video' ? (
                      <video
                        src={item.file_url || ''}
                        controls
                        playsInline
                        preload="metadata"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={item.file_url || ''}
                        alt={item.title || ''}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    )}
                    <button
                      onClick={() => deleteItem(item.id)}
                      disabled={deletingId === item.id}
                      className="absolute top-1.5 right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center disabled:opacity-50 transition-colors"
                      title="Eliminar"
                    >
                      {deletingId === item.id ? '…' : <Trash2 size={13} />}
                    </button>
                    <span className="absolute bottom-1.5 left-1.5 text-[10px] bg-black/70 text-white px-1.5 py-0.5 rounded">
                      ★{Math.round(item.price / 100)}
                    </span>
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium text-foreground truncate">{item.companion_name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {item.type === 'video' ? 'Video' : 'Foto'} · {new Date(item.created_at).toLocaleDateString('es-MX')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function FunnelRow({
  icon, label, value, max, color, pctLabel,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  max: number;
  color: string;
  pctLabel?: string;
}) {
  const width = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 text-sm text-foreground/80" style={{ color }}>
          {icon}
          <span>{label}</span>
        </div>
        <div className="flex items-center gap-2">
          {pctLabel && (
            <span className="text-[11px] text-muted-foreground">convierte {pctLabel}</span>
          )}
          <span className="text-sm font-bold text-foreground">{value.toLocaleString()}</span>
        </div>
      </div>
      <div className="h-2 rounded-full bg-border overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${width}%`, background: color }}
        />
      </div>
    </div>
  );
}
