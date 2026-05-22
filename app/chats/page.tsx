"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Sparkles } from "lucide-react";
import { CelestialBackground } from "@/components/celestial-background";
import { useTelegram } from "@/components/telegram-provider";

interface ChatPreview {
  companionId: string;
  name: string;
  type: "ai" | "human";
  photo_url: string;
  messageCount: number;
  lastMessage: string;
  lastMessageRole: string;
  updatedAt: string;
}

export default function MyChatsPage() {
  const router = useRouter();
  const { appUser } = useTelegram();
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (appUser?.id) loadChats();
  }, [appUser]);

  const loadChats = async () => {
    try {
      const res = await fetch(`/api/my-chats?userId=${appUser?.id}`);
      const data = await res.json();
      setChats(data.chats || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "ahora";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <CelestialBackground />

      <div className="relative z-10 px-4 pt-[76px] pb-[100px] overflow-y-auto min-h-screen no-scrollbar">
        <div className="mb-4">
          <h1 className="font-serif text-[26px] text-foreground">Tus conversaciones</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {chats.length > 0
              ? (() => {
                  const total = chats.reduce((n, c) => n + c.messageCount, 0);
                  return `${total} mensaje${total !== 1 ? "s" : ""} sin leer`;
                })()
              : "Retoma donde lo dejaste"}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Sparkles className="w-8 h-8 text-primary mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground font-serif italic">Cargando...</p>
          </div>
        ) : chats.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <p className="font-serif text-xl text-foreground mb-2">Aun no tienes conversaciones</p>
            <p className="text-muted-foreground text-sm mb-6">
              Habla con Aura para descubrir tu conexion ideal
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={() => router.push("/")} className="btn-primary w-full text-center">
                Hablar con Aura
              </button>
              <button onClick={() => router.push("/explore")} className="btn-ghost w-full text-center">
                Explorar contenido exclusivo
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {chats.map((chat) => (
              <button
                key={chat.companionId}
                onClick={() => router.push(`/chat/${chat.companionId}`)}
                className="flex items-center gap-3 py-3 px-2.5 rounded-[14px] text-left bg-transparent border-none cursor-pointer transition-colors duration-150"
                style={{ color: "var(--foreground)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "oklch(0.20 0.04 290 / 0.4)")
                }
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div className="relative flex-shrink-0">
                  {chat.photo_url ? (
                    <img
                      src={chat.photo_url}
                      alt={chat.name}
                      className="w-[52px] h-[52px] rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-[52px] h-[52px] rounded-full bg-card flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  {chat.type === "ai" && (
                    <div
                      className="absolute -bottom-0.5 -right-0.5"
                      style={{ background: "var(--background)", borderRadius: "50%", padding: 2 }}
                    >
                      <div
                        className="grid place-items-center rounded-full"
                        style={{ background: "var(--primary)", width: 16, height: 16 }}
                      >
                        <Sparkles size={9} className="text-white" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-serif text-base font-medium">{chat.name}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto flex-shrink-0">
                      {timeAgo(chat.updatedAt)}
                    </span>
                  </div>
                  <p className="text-[13px] text-muted-foreground truncate mt-1">
                    {chat.lastMessageRole === "user" ? "Tu: " : ""}
                    {chat.lastMessage}
                  </p>
                </div>

                {chat.messageCount > 0 && (
                  <span
                    className="text-[10px] font-bold text-white rounded-full min-w-[20px] text-center flex-shrink-0"
                    style={{ background: "var(--primary)", padding: "3px 7px" }}
                  >
                    {chat.messageCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
