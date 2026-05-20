"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles } from "lucide-react";
import { CelestialBackground } from "@/components/celestial-background";
import { OracleOrb } from "@/components/oracle-orb";

interface Message {
  id: string;
  role: "user" | "oracle";
  content: string;
}

const INITIAL_MESSAGE = "Dime tu nombre y signo para revelar tu destino...";

const ORACLE_RESPONSES = [
  "Las estrellas susurran secretos sobre tu camino... Veo una luz brillante en tu futuro cercano.",
  "Tu energía es única y poderosa. El universo tiene grandes planes para ti.",
  "Siento que cargas un peso en tu corazón. Déjame ayudarte a encontrar la paz que buscas.",
  "Los astros se alinean a tu favor. Este es un momento de transformación profunda.",
  "Tu intuición es tu mayor guía. Confía en ella, pues el cosmos te habla a través de tus sentimientos.",
];

export function AuraChat() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", role: "oracle", content: INITIAL_MESSAGE },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
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

    // Simulate oracle response
    setTimeout(() => {
      const response = ORACLE_RESPONSES[Math.floor(Math.random() * ORACLE_RESPONSES.length)];
      const oracleMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "oracle",
        content: response,
      };
      setMessages((prev) => [...prev, oracleMessage]);
      setIsTyping(false);
    }, 2000);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      <CelestialBackground />

      {/* Header */}
      <motion.header
        className="relative z-10 pt-8 pb-4 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          className="inline-block"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <h1 className="font-serif text-5xl md:text-6xl font-light tracking-[0.3em] text-gradient-mystical">
            AURA
          </h1>
          <p className="font-serif text-lg md:text-xl text-muted-foreground tracking-[0.15em] mt-2 italic">
            Tu Oráculo Personal
          </p>
        </motion.div>
      </motion.header>

      {/* Main content area */}
      <main className="relative z-10 flex-1 flex flex-col items-center px-4 pb-32">
        {/* Oracle Orb - shows when no conversation */}
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

        {/* Messages */}
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

          {/* Typing indicator */}
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
                      AURA está consultando los astros
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
        className="fixed bottom-0 left-0 right-0 z-20 p-4 pb-6"
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
                placeholder="Comparte tus pensamientos con el oráculo..."
                className="w-full bg-transparent border-none outline-none resize-none text-foreground placeholder:text-muted-foreground px-4 py-3 font-serif text-lg min-h-[52px] max-h-32"
                rows={1}
                disabled={isTyping}
              />
            </div>
            <motion.button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/80 hover:bg-primary text-primary-foreground flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Send className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Mystical hint */}
          <motion.p
            className="text-center text-xs text-muted-foreground mt-3 font-serif italic"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            Las estrellas guardan tus secretos con discreción absoluta ✦
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
