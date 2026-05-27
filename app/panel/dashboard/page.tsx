"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { BarChart3, User, Camera, MessageCircle, Bell, Sparkles } from "lucide-react";
import { CelestialBackground } from "@/components/celestial-background";
import { Companion } from "./components/types";
import { DashboardTab } from "./components/DashboardTab";
import { ProfileTab } from "./components/ProfileTab";
import { PhotosTab } from "./components/PhotosTab";
import { ChatsTab } from "./components/ChatsTab";

export default function PanelDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<'dashboard' | 'profile' | 'photos' | 'chats'>('dashboard');
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
          {tab === 'dashboard' && <DashboardTab key="dash" companion={companion} />}
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
