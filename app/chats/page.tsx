"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MessageCircle, Sparkles, Heart } from "lucide-react";
import { CelestialBackground } from "@/components/celestial-background";
import { useTelegram } from "@/components/telegram-provider";

interface ChatPreview {
  companionId: string;
  name: string;
  type: 'ai' | 'human';
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

  const truncate = (text: string, max: number) =>
    text.length > max ? text.slice(0, max) + '...' : text;

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'ahora';
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  return (
    <div className="min-h-screen bg-background relative pb-24">
      <CelestialBackground />

      <div className="relative z-10 max-w-lg mx-auto">
        <motion.header
          className="text-center py-6 px-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-serif text-3xl text-gradient-mystical">Mis conversaciones</h1>
          <p className="text-muted-foreground text-sm mt-1">Retoma donde lo dejaste</p>
        </motion.header>

        <div className="px-4">
          {loading ? (
            <div className="text-center py-12">
              <Sparkles className="w-8 h-8 text-primary mx-auto mb-4 animate-pulse" />
              <p className="text-muted-foreground">Cargando...</p>
            </div>
          ) : chats.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
              <p className="text-foreground font-serif text-lg mb-2">Aun no tienes conversaciones</p>
              <p className="text-muted-foreground text-sm mb-6">Habla con Aura para descubrir tu conexion ideal</p>
              <button
                onClick={() => router.push('/')}
                className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold"
              >
                Hablar con Aura
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {chats.map((chat, i) => (
                <motion.button
                  key={chat.companionId}
                  className="w-full flex items-center gap-3 p-3 rounded-xl glass-card hover:border-primary/30 transition-all text-left"
                  onClick={() => router.push(`/chat/${chat.companionId}`)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="relative flex-shrink-0">
                    {chat.photo_url ? (
                      <img
                        src={chat.photo_url}
                        alt={chat.name}
                        className="w-12 h-12 rounded-full object-cover border border-primary/20"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-card flex items-center justify-center border border-primary/20">
                        <Sparkles className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    {chat.type === 'human' && (
                      <Heart className="w-3 h-3 text-pink-400 absolute -bottom-0.5 -right-0.5 fill-pink-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">{chat.name}</span>
                      <span className="text-xs text-muted-foreground">{timeAgo(chat.updatedAt)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {chat.lastMessageRole === 'user' ? 'Tu: ' : ''}
                      {truncate(chat.lastMessage, 40)}
                    </p>
                  </div>

                  <span className="text-xs text-muted-foreground bg-card px-2 py-0.5 rounded-full">
                    {chat.messageCount}
                  </span>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
