"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, LogOut } from "lucide-react";
import { CelestialBackground } from "@/components/celestial-background";
import { OracleOrb } from "@/components/oracle-orb";
import { useTelegram } from "@/components/telegram-provider";

interface Message {
  id: string;
  role: "user" | "oracle";
  content: string;
}

const INITIAL_MESSAGE = "Hola... siento tu energia desde aqui. Dime, como te llamas?";

export function AuraChat() {
  const router = useRouter();
  const { appUser } = useTelegram();
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", role: "oracle", content: INITIAL_MESSAGE },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showGalleryTransition, setShowGalleryTransition] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content,
          })),
        }),
      });

      const data = await response.json();

      const oracleMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "oracle",
        content: data.reply || "Dejame pensar...",
      };

      setMessages((prev) => [...prev, oracleMessage]);

      if (data.action === 'show_gallery') {
        setTimeout(() => {
          setShowGalleryTransition(true);
          setTimeout(() => router.push('/gallery'), 2000);
        }, 1500);
      }
    } catch {
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        role: "oracle",
        content: "Hmm, parece que las estrellas se desalinearon. Intentalo de nuevo.",
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

  const handleLogout = () => {
    if (confirm("¿Deseas cerrar sesión y volver al inicio?")) {
      localStorage.removeItem("aura_welcome_done");
      window.location.href = "/welcome";
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      <CelestialBackground />

      {/* Gallery transition overlay */}
      <AnimatePresence>
        {showGalleryTransition && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="text-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Sparkles className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
              <p className="font-serif text-2xl text-foreground italic">
                Preparando algo especial para ti...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Salir: esquina superior derecha (la X de Telegram está a la izquierda) */}
      <button
        type="button"
        onClick={handleLogout}
        aria-label="Salir"
        className="btn-exit fixed z-30 grid place-items-center"
        style={{
          top: "calc(var(--header-offset-top) + 32px)",
          right: "calc(16px + var(--tg-content-safe-right, 0px))",
          width: 44,
          height: 44,
        }}
        title="Salir"
      >
        <LogOut size={18} />
      </button>

      {/* Header */}
      <motion.header
        className="relative z-10 page-top-inset pb-4 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          className="inline-block"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <h1 className="font-serif text-4xl font-light tracking-[0.32em] gradient-text">
            AURA
          </h1>
          <p className="font-serif text-sm text-muted-foreground tracking-[0.12em] mt-1 italic">
            {appUser?.first_name ? `Bienvenido, ${appUser.first_name}` : 'tu conexion secreta'}
          </p>
        </motion.div>
      </motion.header>

      {/* Main content area */}
      <main className="relative z-10 flex-1 flex flex-col items-center px-4 pb-44">
        <AnimatePresence mode="wait">
          {messages.length <= 1 && (
            <motion.div
              className="my-8"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5 }}
            >
              <OracleOrb />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="w-full max-w-2xl space-y-6 mt-4">
          <AnimatePresence mode="popLayout">
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, delay: index === messages.length - 1 ? 0.1 : 0 }}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-6 py-4 rounded-2xl ${
                    message.role === "user"
                      ? "bg-primary/20 border border-primary/30 text-foreground"
                      : "glass-card"
                  }`}
                >
                  {message.role === "oracle" && (
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-xs font-medium text-primary tracking-wider uppercase">
                        AURA
                      </span>
                    </div>
                  )}
                  <p className={`font-serif text-lg leading-relaxed ${
                    message.role === "oracle" ? "italic text-foreground/90" : "text-foreground"
                  }`}>
                    {message.content}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex justify-start"
              >
                <div className="glass-card px-6 py-4 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                    <span className="text-sm text-muted-foreground">
                      Aura esta escribiendo
                    </span>
                    <motion.div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-primary"
                          animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.4, 1, 0.4],
                          }}
                          transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            delay: i * 0.2,
                          }}
                        />
                      ))}
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div ref={messagesEndRef} />
      </main>

      {/* Input area */}
      <motion.div
        className="fixed bottom-20 left-0 right-0 z-20 p-4 pb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="max-w-2xl mx-auto">
          <div className="glass-card rounded-2xl p-2 flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Escribe algo..."
                className="w-full bg-transparent border-none outline-none resize-none text-foreground placeholder:text-muted-foreground px-4 py-3 font-serif text-lg min-h-[52px] max-h-32"
                rows={1}
                disabled={isTyping || showGalleryTransition}
              />
            </div>
            <motion.button
              onClick={handleSend}
              disabled={!input.trim() || isTyping || showGalleryTransition}
              className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/80 hover:bg-primary text-primary-foreground flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Send className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
