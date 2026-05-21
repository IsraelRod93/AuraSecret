"use client";

import { useState, useRef, useEffect, KeyboardEvent, use } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, ArrowLeft, Lock, ShoppingBag } from "lucide-react";
import { CelestialBackground } from "@/components/celestial-background";
import { SubscriptionModal } from "@/components/subscription-modal";
import { useTelegram } from "@/components/telegram-provider";

interface Message {
  id: string;
  role: "user" | "companion";
  content: string;
}

const FREE_LIMIT = 7;

export default function CompanionChatPage({ params }: { params: Promise<{ companionId: string }> }) {
  const { companionId } = use(params);
  const router = useRouter();
  const { appUser } = useTelegram();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [companion, setCompanion] = useState<{ name: string; type: string; photo_url: string } | null>(null);
  const [messagesUsed, setMessagesUsed] = useState(0);
  const [showSubscription, setShowSubscription] = useState(false);
  const [subLoading, setSubLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (appUser?.subscription_status === 'active') {
      setIsSubscribed(true);
    }
  }, [appUser]);

  useEffect(() => {
    if (appUser?.id) loadChat();
  }, [companionId, appUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadChat = async () => {
    try {
      const params = new URLSearchParams({ companionId, userId: appUser?.id || '' });
      const res = await fetch(`/api/companion-chat?${params}`);
      const data = await res.json();
      if (data.companion) setCompanion(data.companion);
      if (data.messagesUsed) setMessagesUsed(data.messagesUsed);
      if (data.isSubscribed) setIsSubscribed(true);
      if (data.messages?.length) {
        setMessages(data.messages.map((m: { role: string; content: string }, i: number) => ({
          id: `hist-${i}`,
          role: m.role as 'user' | 'companion',
          content: m.content,
        })));
      }
    } catch {
      // ignore
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    if (!appUser?.id) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch('/api/companion-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companionId,
          message: userMsg.content,
          userId: appUser.id,
        }),
      });

      const data = await res.json();

      if (data.action === 'subscription_required') {
        setShowSubscription(true);
        setMessagesUsed(data.messagesUsed);
        setMessages(prev => prev.slice(0, -1));
        return;
      }

      if (data.messagesUsed) setMessagesUsed(data.messagesUsed);

      if (data.reply) {
        await new Promise(r => setTimeout(r, 800 + Math.random() * 1500));
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: "companion",
          content: data.reply,
        }]);
      }

      if (data.action === 'human_pending') {
        setMessages(prev => [...prev, {
          id: (Date.now() + 2).toString(),
          role: "companion",
          content: "Mensaje enviado. Te respondera pronto...",
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "companion",
        content: "Error de conexion. Intentalo de nuevo.",
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSubscribe = async () => {
    setSubLoading(true);
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: appUser?.id }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      // ignore
    } finally {
      setSubLoading(false);
    }
  };

  const remaining = isSubscribed ? null : Math.max(0, FREE_LIMIT - messagesUsed);
  const isHuman = companion?.type === 'human';

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      <CelestialBackground />

      {/* Header */}
      <motion.header
        className="relative z-10 flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border/30"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button onClick={() => router.push('/gallery')} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-6 h-6" />
        </button>

        {companion && (
          <div className="flex items-center gap-3 flex-1">
            <img
              src={companion.photo_url}
              alt={companion.name}
              className="w-10 h-10 rounded-full object-cover border border-primary/30"
            />
            <div>
              <h2 className="font-serif text-lg text-foreground">{companion.name}</h2>
              <p className="text-xs text-muted-foreground">
                {isHuman ? 'En linea' : 'Siempre disponible'}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          {!isSubscribed && !isHuman && remaining !== null && (
            <span className="text-xs text-muted-foreground bg-card px-2 py-1 rounded-full">
              {remaining > 0 ? `${remaining} msgs gratis` : <Lock className="w-3 h-3" />}
            </span>
          )}
          {isHuman && (
            <button
              onClick={() => router.push(`/vault/${companionId}`)}
              className="text-primary hover:text-primary/80"
            >
              <ShoppingBag className="w-5 h-5" />
            </button>
          )}
        </div>
      </motion.header>

      {/* Messages */}
      <main className="relative z-10 flex-1 flex flex-col px-4 pb-28 pt-4 overflow-y-auto">
        <div className="w-full max-w-2xl mx-auto space-y-4">
          {messages.length === 0 && companion && (
            <motion.div
              className="text-center py-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <img
                src={companion.photo_url}
                alt={companion.name}
                className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-2 border-primary/30"
              />
              <p className="font-serif text-lg text-foreground italic">
                Comienza tu conversacion con {companion.name}
              </p>
              <p className="text-muted-foreground text-sm mt-2">
                {isHuman ? 'Mensajes gratis' : `${FREE_LIMIT} mensajes gratis`}
              </p>
            </motion.div>
          )}

          <AnimatePresence mode="popLayout">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                  msg.role === "user"
                    ? "bg-primary/20 border border-primary/30"
                    : "glass-card"
                }`}>
                  <p className="text-foreground text-[15px] leading-relaxed">{msg.content}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="glass-card px-4 py-3 rounded-2xl">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-primary animate-pulse" />
                  <span className="text-sm text-muted-foreground">Escribiendo</span>
                  <motion.div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="w-1 h-1 rounded-full bg-primary"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </main>

      {/* Input */}
      <div className="fixed bottom-0 left-0 right-0 z-20 p-3 pb-5">
        <div className="max-w-2xl mx-auto glass-card rounded-2xl p-2 flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Escribe un mensaje..."
            className="flex-1 bg-transparent border-none outline-none resize-none text-foreground placeholder:text-muted-foreground px-3 py-2 text-[15px] min-h-[44px] max-h-24"
            rows={1}
            disabled={isTyping}
          />
          <motion.button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/80 hover:bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40"
            whileTap={{ scale: 0.95 }}
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      <SubscriptionModal
        open={showSubscription}
        onClose={() => setShowSubscription(false)}
        onSubscribe={handleSubscribe}
        loading={subLoading}
        companionName={companion?.name}
      />
    </div>
  );
}
