"use client";

import { useState } from 'react';
import { Upload, Lock, CheckCircle, AlertCircle, BarChart3, Users, MessageCircle, TrendingUp, Star } from 'lucide-react';

interface FunnelData {
  bot_start: number;
  first_message: number;
  limit_reached: number;
  payment_completed: number;
  referral_join: number;
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
