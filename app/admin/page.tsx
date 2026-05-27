"use client";

import { useState, useCallback, useEffect } from 'react';
import {
  Upload, Lock, CheckCircle, AlertCircle, BarChart3, Users, Star, Wallet,
  Download, RefreshCw, ImageIcon, Trash2, ShieldCheck, ShieldOff, Eye, EyeOff,
  Check, TrendingUp, ArrowUpRight, UserCheck, DollarSign, Activity,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AnalyticsData {
  bot_start: number; first_message: number; limit_reached: number;
  payment_completed: number; referral_join: number;
  total_users: number; users_this_week: number; users_today: number;
  paid_users: number; free_users: number;
  total_companions: number; active_companions: number;
  total_stars: number; stars_this_week: number;
  total_sales: number; sales_this_week: number;
  top_companions: { name: string; photo_url: string; revenue_stars: number; sales_count: number; chat_users: number }[];
  daily_revenue: { day: string; stars: number; sales: number }[];
}

interface CompanionRow {
  id: string; name: string; type: string; status: string; verified: boolean;
  tagline: string | null; description: string | null; age: number | null;
  location: string | null; photo_url: string; created_at: string; vault_items: number;
}

interface ContentItem {
  id: string; type: string; title: string | null; price: number;
  file_url: string | null; created_at: string; approved: boolean;
  companion_name: string; companion_id: string;
}

interface PayoutRow {
  id: string; companion_name: string; amount_stars: number;
  amount_mxn: string; mp_email: string | null; clabe: string | null;
  status: string; created_at: string;
}

interface PayoutTotals { count: number; total_stars: number; total_mxn: string; }

type Tab = 'overview' | 'companions' | 'content' | 'payouts' | 'upload';

// ── Root ──────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState('');

  const [companions, setCompanions] = useState<CompanionRow[]>([]);
  const [companionsLoading, setCompanionsLoading] = useState(false);

  const [content, setContent] = useState<ContentItem[]>([]);
  const [contentLoading, setContentLoading] = useState(false);
  const [showApproved, setShowApproved] = useState(false);

  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [payoutTotals, setPayoutTotals] = useState<PayoutTotals | null>(null);
  const [payoutsLoading, setPayoutsLoading] = useState(false);
  const [processingPayouts, setProcessingPayouts] = useState(false);
  const [processResult, setProcessResult] = useState('');

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadError, setUploadError] = useState('');

  const loadAnalytics = useCallback(async (silent = false) => {
    if (!silent) setAnalyticsLoading(true);
    setAnalyticsError('');
    try {
      const res = await fetch('/api/admin/analytics', { headers: { 'x-admin-password': password } });
      if (res.status === 401) throw new Error('Contraseña incorrecta');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setAnalytics(data);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error';
      setAnalyticsError(msg);
      return false;
    } finally { if (!silent) setAnalyticsLoading(false); }
  }, [password]);

  const loadCompanions = useCallback(async () => {
    setCompanionsLoading(true);
    try {
      const res = await fetch('/api/admin/companions', { headers: { 'x-admin-password': password } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCompanions(data.companions || []);
    } finally { setCompanionsLoading(false); }
  }, [password]);

  const loadContent = useCallback(async () => {
    setContentLoading(true);
    try {
      const res = await fetch('/api/admin/content', { headers: { 'x-admin-password': password } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setContent(data.items || []);
    } finally { setContentLoading(false); }
  }, [password]);

  const loadPayouts = useCallback(async () => {
    setPayoutsLoading(true);
    try {
      const res = await fetch('/api/admin/payouts', { headers: { 'x-admin-password': password } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPayouts(data.pending || []);
      setPayoutTotals(data.totals || null);
    } finally { setPayoutsLoading(false); }
  }, [password]);

  useEffect(() => {
    if (!authed) return;
    if (activeTab === 'overview') loadAnalytics();
    else if (activeTab === 'companions') loadCompanions();
    else if (activeTab === 'content') loadContent();
    else if (activeTab === 'payouts') loadPayouts();
  }, [activeTab, authed, loadAnalytics, loadCompanions, loadContent, loadPayouts]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const ok = await loadAnalytics();
    if (ok) setAuthed(true);
    else if (!analyticsError) setAuthError('Contraseña incorrecta');
  };

  // ── Login ──────────────────────────────────────────────────────────────────

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#07070f] flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-violet-600/15 border border-violet-500/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✦</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Aura Admin</h1>
            <p className="text-gray-500 text-sm mt-1">Panel de control interno</p>
          </div>
          <form onSubmit={handleAuth} className="flex flex-col gap-3">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={15} />
              <input
                type="password"
                placeholder="Contraseña de acceso"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white placeholder:text-gray-600 outline-none focus:border-violet-500/50 text-sm transition-colors"
              />
            </div>
            {(authError || analyticsError) && (
              <p className="text-red-400 text-xs text-center flex items-center justify-center gap-1">
                <AlertCircle size={12} /> {authError || analyticsError}
              </p>
            )}
            <button
              type="submit"
              disabled={analyticsLoading || !password}
              className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white py-3 rounded-xl font-semibold text-sm transition-colors"
            >
              {analyticsLoading ? 'Verificando...' : 'Entrar al panel'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────

  const pendingContent = content.filter(i => !i.approved).length;
  const isLoading = analyticsLoading || companionsLoading || contentLoading || payoutsLoading;

  const tabs: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview',    label: 'Resumen',   icon: <BarChart3 size={14} /> },
    { id: 'companions',  label: 'Creadoras', icon: <Users size={14} /> },
    { id: 'content',     label: 'Contenido', icon: <ImageIcon size={14} />, badge: pendingContent },
    { id: 'payouts',     label: 'Retiros',   icon: <Wallet size={14} />, badge: payoutTotals?.count },
    { id: 'upload',      label: 'Subir',     icon: <Upload size={14} /> },
  ];

  const refresh = () => {
    if (activeTab === 'overview') loadAnalytics();
    else if (activeTab === 'companions') loadCompanions();
    else if (activeTab === 'content') loadContent();
    else if (activeTab === 'payouts') loadPayouts();
  };

  return (
    <div className="min-h-screen bg-[#07070f] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0a0a14]/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center h-13 gap-1 sm:gap-2">
            <span className="text-violet-400 font-bold text-base mr-3 hidden sm:block">✦ Aura</span>
            <nav className="flex items-center gap-0.5 flex-1 overflow-x-auto scrollbar-none">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium whitespace-nowrap transition-colors relative ${
                    activeTab === tab.id
                      ? 'bg-violet-600/20 text-violet-300'
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.badge != null && tab.badge > 0 && (
                    <span className="bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
            <button
              onClick={refresh}
              className="ml-auto p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] transition-colors flex-shrink-0"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'overview' && (
          <OverviewTab analytics={analytics} loading={analyticsLoading} error={analyticsError} />
        )}
        {activeTab === 'companions' && (
          <CompanionsTab
            companions={companions}
            loading={companionsLoading}
            password={password}
            onChange={setCompanions}
            onRefresh={loadCompanions}
          />
        )}
        {activeTab === 'content' && (
          <ContentTab
            items={content}
            loading={contentLoading}
            showApproved={showApproved}
            onToggleShowApproved={() => setShowApproved(v => !v)}
            password={password}
            onChange={setContent}
          />
        )}
        {activeTab === 'payouts' && (
          <PayoutsTab
            payouts={payouts}
            totals={payoutTotals}
            loading={payoutsLoading}
            processing={processingPayouts}
            processResult={processResult}
            onProcess={async () => {
              if (!confirm(`Procesar ${payouts.length} retiro(s) vía Mercado Pago?`)) return;
              setProcessingPayouts(true); setProcessResult('');
              try {
                const res = await fetch('/api/admin/payouts', {
                  method: 'POST', headers: { 'x-admin-password': password },
                });
                const d = await res.json();
                setProcessResult(`✓ ${d.success} exitosos · ${d.failed} fallidos · ${d.manual} manuales`);
                await loadPayouts();
              } finally { setProcessingPayouts(false); }
            }}
            onDownloadSpei={async () => {
              const res = await fetch('/api/admin/payouts', {
                method: 'DELETE', headers: { 'x-admin-password': password },
              });
              if (!res.ok) { alert('Sin retiros con CLABE pendientes'); return; }
              const blob = await res.blob();
              const link = document.createElement('a');
              link.href = URL.createObjectURL(blob);
              link.download = `retiros-${new Date().toISOString().slice(0, 10)}.csv`;
              link.click();
            }}
          />
        )}
        {activeTab === 'upload' && (
          <UploadTab
            file={uploadFile}
            url={uploadUrl}
            loading={uploadLoading}
            error={uploadError}
            onFileChange={setUploadFile}
            onSubmit={async (e) => {
              e.preventDefault();
              if (!uploadFile) return;
              setUploadLoading(true); setUploadError(''); setUploadUrl('');
              try {
                const res = await fetch(`/api/upload?filename=${encodeURIComponent(uploadFile.name)}`, {
                  method: 'POST', headers: { 'x-admin-password': password }, body: uploadFile,
                });
                const d = await res.json();
                if (res.ok) setUploadUrl(d.url);
                else setUploadError(d.error || 'Fallo en la subida');
              } finally { setUploadLoading(false); }
            }}
          />
        )}
      </main>
    </div>
  );
}

// ── Overview tab ──────────────────────────────────────────────────────────────

function OverviewTab({ analytics, loading, error }: { analytics: AnalyticsData | null; loading: boolean; error: string }) {
  if (loading) return <LoadingState />;
  if (error || !analytics) return (
    <div className="text-center py-20">
      <AlertCircle className="text-red-400 mx-auto mb-3" size={28} />
      <p className="text-gray-400">{error || 'No se pudieron cargar los datos'}</p>
    </div>
  );

  const kpis = [
    {
      label: 'Usuarios totales', value: analytics.total_users.toLocaleString(),
      sub: `+${analytics.users_today} hoy · +${analytics.users_this_week} esta semana`,
      icon: <Users size={18} />, accent: 'blue',
    },
    {
      label: 'Ingresos (Stars)', value: `★${analytics.total_stars.toLocaleString()}`,
      sub: `+★${analytics.stars_this_week.toLocaleString()} esta semana`,
      icon: <Star size={18} />, accent: 'yellow',
    },
    {
      label: 'Ventas totales', value: analytics.total_sales.toLocaleString(),
      sub: `+${analytics.sales_this_week} esta semana`,
      icon: <DollarSign size={18} />, accent: 'green',
    },
    {
      label: 'Creadoras activas', value: `${analytics.active_companions} / ${analytics.total_companions}`,
      sub: `${analytics.total_companions - analytics.active_companions} pendientes de activar`,
      icon: <UserCheck size={18} />, accent: 'violet',
    },
    {
      label: 'Suscriptores pagados', value: analytics.paid_users.toLocaleString(),
      sub: `${analytics.free_users.toLocaleString()} en plan gratuito`,
      icon: <Activity size={18} />, accent: 'pink',
    },
    {
      label: 'Referidos por creadoras', value: analytics.referral_join.toLocaleString(),
      sub: 'llegaron por link de creadora',
      icon: <ArrowUpRight size={18} />, accent: 'teal',
    },
  ];

  const accentCls: Record<string, string> = {
    blue:   'border-blue-500/20   bg-blue-500/8   text-blue-400',
    yellow: 'border-yellow-500/20 bg-yellow-500/8 text-yellow-400',
    green:  'border-green-500/20  bg-green-500/8  text-green-400',
    violet: 'border-violet-500/20 bg-violet-500/8 text-violet-400',
    pink:   'border-pink-500/20   bg-pink-500/8   text-pink-400',
    teal:   'border-teal-500/20   bg-teal-500/8   text-teal-400',
  };

  // Build 7-day chart
  const today = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
  const dailyMap: Record<string, { stars: number; sales: number }> = {};
  for (const r of analytics.daily_revenue) dailyMap[String(r.day).slice(0, 10)] = r;
  const chartData = last7Days.map(day => ({ day, ...(dailyMap[day] || { stars: 0, sales: 0 }) }));
  const maxStars = Math.max(...chartData.map(d => d.stars), 1);

  const convRate = analytics.bot_start
    ? `${Math.round(analytics.payment_completed / analytics.bot_start * 100)}%`
    : '0%';

  const funnelRows = [
    { label: 'Abrieron el bot',         value: analytics.bot_start,         color: '#60a5fa' },
    { label: 'Enviaron un mensaje',      value: analytics.first_message,     color: '#a78bfa' },
    { label: 'Llegaron al límite free',  value: analytics.limit_reached,     color: '#fb923c' },
    { label: 'Realizaron un pago',       value: analytics.payment_completed, color: '#4ade80' },
  ];

  return (
    <div className="space-y-5">
      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {kpis.map((k, i) => (
          <div key={i} className={`border rounded-xl p-4 ${accentCls[k.accent]}`}>
            <div className="mb-3 opacity-70">{k.icon}</div>
            <p className="text-[22px] font-bold text-white leading-none mb-1">{k.value}</p>
            <p className="text-[11px] font-semibold opacity-80">{k.label}</p>
            <p className="text-[10px] opacity-50 mt-1 leading-tight">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Chart + Funnel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 7-day bar chart */}
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-5">
          <div className="flex items-baseline justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Ingresos — últimos 7 días</h3>
            <span className="text-violet-400 text-sm font-bold">★{analytics.stars_this_week.toLocaleString()}</span>
          </div>
          <div className="flex items-end gap-1.5" style={{ height: 72 }}>
            {chartData.map((d, i) => {
              const h = (d.stars / maxStars) * 100;
              const isToday = i === 6;
              const dateNum = new Date(d.day + 'T12:00:00').getDate();
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                  <div
                    className="w-full rounded-t transition-all"
                    style={{
                      height: `${Math.max(h, d.stars > 0 ? 4 : 0)}%`,
                      background: isToday
                        ? 'linear-gradient(180deg, #a855f7, #7c3aed)'
                        : 'rgba(139,92,246,0.22)',
                    }}
                  />
                  <span className={`text-[9px] ${isToday ? 'text-violet-400' : 'text-gray-600'}`}>{dateNum}</span>
                  {d.stars > 0 && (
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      ★{d.stars}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Conversion funnel */}
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-5">
          <div className="flex items-baseline justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Embudo de conversión</h3>
            <span className="text-green-400 text-sm font-bold">{convRate}</span>
          </div>
          <div className="space-y-3">
            {funnelRows.map((row, i) => {
              const pct = analytics.bot_start > 0
                ? Math.round(row.value / analytics.bot_start * 100)
                : 0;
              return (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">{row.label}</span>
                    <span className="text-white font-semibold">{row.value.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: row.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top companions */}
      {analytics.top_companions.length > 0 && (
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <TrendingUp size={14} className="text-violet-400" /> Top creadoras
            </h3>
            <p className="text-[11px] text-gray-500">chats · ingresos</p>
          </div>
          <div className="divide-y divide-white/[0.05]">
            {analytics.top_companions.map((c, i) => (
              <div key={i} className="px-5 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors">
                <span className="text-xs text-gray-600 w-5 text-right tabular-nums">{i + 1}</span>
                <img src={c.photo_url} alt="" className="w-9 h-9 rounded-full object-cover border border-white/10 flex-shrink-0" />
                <p className="flex-1 text-sm font-medium text-white truncate">{c.name}</p>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-bold text-blue-400">{c.chat_users.toLocaleString()}</p>
                    <p className="text-[9px] text-gray-600">chats</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-yellow-400">★{c.revenue_stars.toLocaleString()}</p>
                    <p className="text-[9px] text-gray-600">{c.sales_count} ventas</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {analytics.top_companions.length === 0 && (
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl py-12 text-center">
          <TrendingUp className="text-gray-700 mx-auto mb-3" size={28} />
          <p className="text-gray-500 text-sm">Aún no hay actividad registrada</p>
          <p className="text-gray-600 text-xs mt-1">Los datos aparecerán cuando los usuarios empiecen a interactuar</p>
        </div>
      )}
    </div>
  );
}

// ── Companions tab ────────────────────────────────────────────────────────────

function CompanionsTab({ companions, loading, password, onChange, onRefresh }: {
  companions: CompanionRow[];
  loading: boolean;
  password: string;
  onChange: React.Dispatch<React.SetStateAction<CompanionRow[]>>;
  onRefresh: () => void;
}) {
  const patch = async (companionId: string, body: object) => {
    await fetch('/api/admin/companions', {
      method: 'PATCH',
      headers: { 'x-admin-password': password, 'Content-Type': 'application/json' },
      body: JSON.stringify({ companionId, ...body }),
    });
  };

  const toggleVerified = async (id: string, cur: boolean) => {
    await patch(id, { verified: !cur });
    onChange(prev => prev.map(c => c.id === id ? { ...c, verified: !cur } : c));
  };

  const toggleStatus = async (id: string, cur: string) => {
    const next = cur === 'active' ? 'pending' : 'active';
    await patch(id, { status: next });
    onChange(prev => prev.map(c => c.id === id ? { ...c, status: next } : c));
  };

  if (loading) return <LoadingState />;

  const active   = companions.filter(c => c.status === 'active').length;
  const verified = companions.filter(c => c.verified).length;
  const ready    = companions.filter(c => c.vault_items >= 10 && c.status === 'active').length;

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', val: companions.length, color: 'text-white',         bg: 'bg-white/[0.04]  border-white/[0.08]' },
          { label: 'Activas',    val: active,    color: 'text-green-400',  bg: 'bg-green-500/8   border-green-500/20' },
          { label: 'Verificadas', val: verified, color: 'text-violet-400', bg: 'bg-violet-500/8  border-violet-500/20' },
          { label: 'Con ≥10 fotos', val: ready,  color: 'text-yellow-400', bg: 'bg-yellow-500/8  border-yellow-500/20' },
        ].map((s, i) => (
          <div key={i} className={`border rounded-xl p-3 text-center ${s.bg}`}>
            <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl overflow-hidden">
        {companions.length === 0 ? (
          <div className="py-16 text-center text-gray-600 text-sm">No hay creadoras registradas</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['Creadora', 'Contenido', 'Registrada', 'Estado', ''].map((h, i) => (
                    <th key={i} className={`px-4 py-3 text-[10px] font-semibold text-gray-600 uppercase tracking-wider text-left ${i === 4 ? 'text-right' : ''}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {companions.map(c => {
                  const profileOk = !!(c.tagline && c.description && c.age && c.location);
                  return (
                    <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={c.photo_url} alt="" className="w-9 h-9 rounded-full object-cover border border-white/10 flex-shrink-0" />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-medium text-white">{c.name}</p>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${c.type === 'human' ? 'bg-pink-500/20 text-pink-400' : 'bg-violet-500/20 text-violet-400'}`}>
                                {c.type === 'human' ? 'Real' : 'IA'}
                              </span>
                            </div>
                            <p className={`text-[10px] mt-0.5 ${profileOk ? 'text-green-500' : 'text-orange-400'}`}>
                              {profileOk ? '✓ Perfil completo' : '✗ Falta info'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-medium tabular-nums ${c.vault_items >= 10 ? 'text-green-400' : c.vault_items > 0 ? 'text-orange-400' : 'text-gray-600'}`}>
                          {c.vault_items} fotos
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500">{new Date(c.created_at).toLocaleDateString('es-MX')}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full w-fit font-semibold ${c.status === 'active' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                            {c.status === 'active' ? 'Activa' : 'Pendiente'}
                          </span>
                          {c.verified && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full w-fit font-semibold bg-violet-500/15 text-violet-400">
                              Verificada
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => toggleVerified(c.id, c.verified)}
                            title={c.verified ? 'Quitar verificación' : 'Verificar perfil'}
                            className={`p-2 rounded-lg transition-colors ${c.verified ? 'bg-violet-500/20 text-violet-400 hover:bg-violet-500/30' : 'bg-white/[0.05] text-gray-500 hover:bg-violet-500/15 hover:text-violet-400'}`}
                          >
                            {c.verified ? <ShieldCheck size={14} /> : <ShieldOff size={14} />}
                          </button>
                          <button
                            onClick={() => toggleStatus(c.id, c.status)}
                            title={c.status === 'active' ? 'Desactivar' : 'Activar'}
                            className={`p-2 rounded-lg transition-colors ${c.status === 'active' ? 'bg-green-500/15 text-green-400 hover:bg-red-500/15 hover:text-red-400' : 'bg-red-500/15 text-red-400 hover:bg-green-500/15 hover:text-green-400'}`}
                          >
                            {c.status === 'active' ? <Eye size={14} /> : <EyeOff size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Content tab ───────────────────────────────────────────────────────────────

function ContentTab({ items, loading, showApproved, onToggleShowApproved, password, onChange }: {
  items: ContentItem[];
  loading: boolean;
  showApproved: boolean;
  onToggleShowApproved: () => void;
  password: string;
  onChange: React.Dispatch<React.SetStateAction<ContentItem[]>>;
}) {
  const [deletingId,  setDeletingId]  = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const approveItem = async (itemId: string) => {
    setApprovingId(itemId);
    try {
      await fetch('/api/admin/content', {
        method: 'PATCH',
        headers: { 'x-admin-password': password, 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      });
      onChange(prev => prev.map(i => i.id === itemId ? { ...i, approved: true } : i));
    } finally { setApprovingId(null); }
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
      onChange(prev => prev.filter(i => i.id !== itemId));
    } finally { setDeletingId(null); }
  };

  const bulkApproveAll = async () => {
    if (!confirm(`¿Aprobar todo el contenido existente? (${pending.length} archivos)`)) return;
    setBulkLoading(true);
    try {
      await fetch('/api/admin/content', { method: 'POST', headers: { 'x-admin-password': password } });
      onChange(prev => prev.map(i => ({ ...i, approved: true })));
    } finally { setBulkLoading(false); }
  };

  if (loading) return <LoadingState />;

  const pending  = items.filter(i => !i.approved);
  const approved = items.filter(i => i.approved);
  const visible  = showApproved ? items : pending;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-2 text-center">
            <p className="text-lg font-bold text-orange-400">{pending.length}</p>
            <p className="text-[10px] text-orange-600">por revisar</p>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2 text-center">
            <p className="text-lg font-bold text-green-400">{approved.length}</p>
            <p className="text-[10px] text-green-600">aprobados</p>
          </div>
        </div>
        <div className="flex gap-2 ml-auto">
          {pending.length > 0 && (
            <button
              onClick={bulkApproveAll}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 text-xs bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <CheckCircle size={12} />
              {bulkLoading ? 'Aprobando...' : 'Aprobar todo'}
            </button>
          )}
          <button
            onClick={onToggleShowApproved}
            className={`text-xs px-3 py-2 rounded-lg border transition-colors ${showApproved ? 'bg-white/10 border-white/20 text-white' : 'bg-white/[0.04] border-white/[0.08] text-gray-400 hover:text-white'}`}
          >
            {showApproved ? 'Ocultar aprobados' : 'Ver todos'}
          </button>
        </div>
      </div>

      {/* Empty state */}
      {visible.length === 0 && (
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl py-16 text-center">
          <CheckCircle className="text-green-500 mx-auto mb-3" size={32} />
          <p className="text-white font-medium">Todo revisado</p>
          <p className="text-gray-500 text-sm mt-1">No hay contenido pendiente de revisión</p>
        </div>
      )}

      {/* Grid */}
      {visible.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {visible.map(item => (
            <div key={item.id} className={`bg-white/[0.03] border rounded-xl overflow-hidden group ${item.approved ? 'border-green-500/15' : 'border-white/[0.07]'}`}>
              <div className="relative aspect-square bg-black">
                {item.type === 'video' ? (
                  <video src={item.file_url || ''} controls playsInline preload="metadata" className="w-full h-full object-cover" />
                ) : (
                  <img src={item.file_url || ''} alt="" className="w-full h-full object-cover" loading="lazy" />
                )}

                {/* Approved overlay */}
                {item.approved && (
                  <div className="absolute inset-0 bg-green-500/10 flex items-end justify-end p-2">
                    <CheckCircle className="text-green-400 drop-shadow" size={20} />
                  </div>
                )}

                {/* Action buttons on hover */}
                {!item.approved && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => approveItem(item.id)}
                      disabled={approvingId === item.id}
                      className="bg-green-500 hover:bg-green-400 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg transition-colors disabled:opacity-50"
                      title="Aprobar — no volver a mostrar"
                    >
                      {approvingId === item.id ? <RefreshCw size={14} className="animate-spin" /> : <Check size={16} />}
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      disabled={deletingId === item.id}
                      className="bg-red-500 hover:bg-red-400 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg transition-colors disabled:opacity-50"
                      title="Eliminar permanentemente"
                    >
                      {deletingId === item.id ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                )}

                {/* Badges */}
                <span className="absolute bottom-1.5 left-1.5 text-[9px] bg-black/75 text-yellow-400 px-1.5 py-0.5 rounded font-semibold">
                  ★{Math.round(item.price / 100)}
                </span>
                {item.type === 'video' && (
                  <span className="absolute top-1.5 left-1.5 text-[9px] bg-violet-600/80 text-white px-1.5 py-0.5 rounded font-bold">
                    VIDEO
                  </span>
                )}
              </div>
              <div className="p-2">
                <p className="text-xs font-medium text-white truncate">{item.companion_name}</p>
                <p className="text-[10px] text-gray-600">{new Date(item.created_at).toLocaleDateString('es-MX')}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Payouts tab ───────────────────────────────────────────────────────────────

function PayoutsTab({ payouts, totals, loading, processing, processResult, onProcess, onDownloadSpei }: {
  payouts: PayoutRow[];
  totals: PayoutTotals | null;
  loading: boolean;
  processing: boolean;
  processResult: string;
  onProcess: () => void;
  onDownloadSpei: () => void;
}) {
  if (loading) return <LoadingState />;

  if (!totals || totals.count === 0) {
    return (
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl py-20 text-center">
        <CheckCircle className="text-green-500 mx-auto mb-3" size={32} />
        <p className="text-white font-medium">Sin retiros pendientes</p>
        <p className="text-gray-500 text-sm mt-1">Todas las solicitudes han sido procesadas</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{totals.count}</p>
          <p className="text-xs text-gray-500 mt-1">Solicitudes</p>
        </div>
        <div className="bg-yellow-500/8 border border-yellow-500/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">★{totals.total_stars.toLocaleString()}</p>
          <p className="text-xs text-yellow-600 mt-1">Stars totales</p>
        </div>
        <div className="bg-green-500/8 border border-green-500/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-400">${Number(totals.total_mxn).toFixed(0)}</p>
          <p className="text-xs text-green-600 mt-1">MXN totales</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px]">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['Creadora', 'Método de pago', 'Monto', 'Fecha'].map((h, i) => (
                  <th key={i} className={`px-4 py-3 text-[10px] font-semibold text-gray-600 uppercase tracking-wider text-left ${i === 2 ? 'text-right' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {payouts.map(p => (
                <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-white">{p.companion_name}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-lg font-medium ${p.mp_email ? 'bg-blue-500/15 text-blue-400' : 'bg-orange-500/15 text-orange-400'}`}>
                      {p.mp_email ? `MP: ${p.mp_email}` : `SPEI: ${p.clabe?.slice(0, 8)}…`}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <p className="text-sm font-bold text-green-400">${Number(p.amount_mxn).toFixed(2)}</p>
                    <p className="text-[10px] text-gray-600">★{p.amount_stars}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(p.created_at).toLocaleDateString('es-MX')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onProcess}
          disabled={processing}
          className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"
        >
          {processing ? <RefreshCw size={14} className="animate-spin" /> : <Wallet size={14} />}
          {processing ? 'Procesando...' : 'Procesar vía Mercado Pago'}
        </button>
        <button
          onClick={onDownloadSpei}
          className="flex-1 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.07] text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"
        >
          <Download size={14} /> Exportar CSV SPEI
        </button>
      </div>

      {processResult && (
        <p className="text-sm text-center text-gray-400">{processResult}</p>
      )}
    </div>
  );
}

// ── Upload tab ────────────────────────────────────────────────────────────────

function UploadTab({ file, url, loading, error, onFileChange, onSubmit }: {
  file: File | null;
  url: string;
  loading: boolean;
  error: string;
  onFileChange: (f: File | null) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-6">
        <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
          <Upload size={15} className="text-violet-400" /> Subir foto al CDN
        </h3>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <label className="border-2 border-dashed border-white/10 rounded-xl p-10 text-center cursor-pointer hover:border-violet-500/40 transition-colors block">
            <input
              type="file" accept="image/*" className="hidden"
              onChange={(e) => onFileChange(e.target.files?.[0] || null)}
            />
            {file ? (
              <p className="text-sm text-violet-400 font-medium">{file.name}</p>
            ) : (
              <>
                <Upload className="mx-auto mb-2 text-gray-600" size={24} />
                <p className="text-sm text-gray-500">Click para seleccionar imagen</p>
                <p className="text-xs text-gray-700 mt-1">PNG, JPG, WEBP</p>
              </>
            )}
          </label>
          <button
            type="submit"
            disabled={loading || !file}
            className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white py-3 rounded-xl font-semibold text-sm transition-colors"
          >
            {loading ? 'Subiendo...' : 'Subir al CDN'}
          </button>
        </form>

        {url && (
          <div className="mt-4 p-4 bg-green-500/8 border border-green-500/20 rounded-xl">
            <p className="text-green-400 text-xs font-semibold mb-2 flex items-center gap-1">
              <CheckCircle size={12} /> Subida exitosa
            </p>
            <input
              readOnly value={url}
              className="w-full bg-black/30 border border-white/10 text-violet-400 p-2.5 rounded-lg text-xs font-mono"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
          </div>
        )}
        {error && (
          <div className="mt-4 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle size={14} /> {error}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Shared ────────────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-56">
      <RefreshCw className="animate-spin text-violet-500" size={22} />
    </div>
  );
}
