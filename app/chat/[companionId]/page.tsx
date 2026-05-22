"use client";

import { useState, useRef, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Send, Sparkles, ArrowLeft, Lock, ImageIcon, Gift } from "lucide-react";
import { CelestialBackground } from "@/components/celestial-background";
import { SubscriptionModal } from "@/components/subscription-modal";
import { useTelegram } from "@/components/telegram-provider";
import { payWithTelegram } from "@/lib/open-payment";

interface Message {
  id: string;
  role: "user" | "companion";
  content: string;
}

const FREE_LIMIT = 12;

export default function CompanionChatPage({
  params,
}: {
  params: Promise<{ companionId: string }>;
}) {
  const { companionId } = use(params);
  const router = useRouter();
  const { appUser, isInTelegram } = useTelegram();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [companion, setCompanion] = useState<{
    name: string;
    type: string;
    photo_url: string;
  } | null>(null);
  const [messagesUsed, setMessagesUsed] = useState(0);
  const [showSubscription, setShowSubscription] = useState(false);
  const [subLoading, setSubLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (appUser?.subscription_status === "active") {
      setIsSubscribed(true);
    }
  }, [appUser]);

  useEffect(() => {
    if (appUser?.id) loadChat();
  }, [companionId, appUser]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const loadChat = async () => {
    try {
      const p = new URLSearchParams({ companionId, userId: appUser?.id || "" });
      const res = await fetch(`/api/companion-chat?${p}`);
      const data = await res.json();
      if (data.companion) setCompanion(data.companion);
      if (data.messagesUsed) setMessagesUsed(data.messagesUsed);
      if (data.isSubscribed) setIsSubscribed(true);
      if (data.messages?.length) {
        setMessages(
          data.messages.map(
            (m: { role: string; content: string }, i: number) => ({
              id: `hist-${i}`,
              role: m.role as "user" | "companion",
              content: m.content,
            }),
          ),
        );
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

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/companion-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companionId,
          message: userMsg.content,
          userId: appUser.id,
        }),
      });

      const data = await res.json();

      if (data.action === "subscription_required") {
        setShowSubscription(true);
        setMessagesUsed(data.messagesUsed);
        setMessages((prev) => prev.slice(0, -1));
        return;
      }

      if (data.messagesUsed) setMessagesUsed(data.messagesUsed);

      if (data.reply) {
        await new Promise((r) => setTimeout(r, 800 + Math.random() * 1500));
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "companion",
            content: data.reply,
          },
        ]);
      }

      if (data.action === "human_pending") {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 2).toString(),
            role: "companion",
            content: "Mensaje enviado. Te respondera pronto...",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "companion",
          content: "Error de conexion. Intentalo de nuevo.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubscribe = async (plan: "weekly" | "monthly") => {
    setSubLoading(true);
    try {
      const paid = await payWithTelegram({
        type: "subscription",
        userId: appUser?.id || undefined,
        plan,
      });
      if (paid) {
        setIsSubscribed(true);
        setShowSubscription(false);
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al procesar el pago");
    } finally {
      setSubLoading(false);
    }
  };

  const isAI = companion?.type !== "human";
  const remaining = isSubscribed ? null : Math.max(0, FREE_LIMIT - messagesUsed);

  const headerTopPad = isInTelegram
    ? "calc(var(--header-offset-top) + 38px)"
    : "calc(var(--header-offset-top) + 50px)";
  const messagesTopPad = isInTelegram
    ? "calc(var(--header-offset-top) + 118px)"
    : "calc(var(--header-offset-top) + 138px)";
  const headerSidePad = isInTelegram
    ? "calc(16px + var(--tg-content-safe-left, 18px))"
    : "14px";

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      <CelestialBackground />

      {/* Glass header with rounded bottom */}
      <div
        className="glass-card absolute top-0 left-0 right-0 z-20 flex items-center gap-2.5"
        style={{
          paddingTop: headerTopPad,
          paddingBottom: "14px",
          paddingLeft: headerSidePad,
          paddingRight: "14px",
          borderRadius: "0 0 22px 22px",
          borderTop: "none",
          borderLeft: "none",
          borderRight: "none",
        }}
      >
        <div className="flex items-center gap-2.5 w-full">
          <button
            type="button"
            onClick={() => router.push("/chats")}
            aria-label="Volver al menu"
            className="bg-transparent border-none cursor-pointer flex items-center justify-center shrink-0"
            style={{
              color: "var(--fg-soft)",
              minWidth: 44,
              minHeight: 44,
              marginLeft: -4,
            }}
          >
            <ArrowLeft size={24} />
          </button>

          {companion && (
            <>
              <img
                src={companion.photo_url}
                alt={companion.name}
                className="w-[40px] h-[40px] rounded-full object-cover"
              />
              <div className="flex-1">
                <h2 className="font-serif text-[18px] font-medium text-foreground">
                  {companion.name}
                </h2>
                <div
                  className="flex items-center gap-1 text-[10px]"
                  style={{
                    color: isAI ? "var(--primary)" : "var(--green)",
                  }}
                >
                  <span
                    className="inline-block rounded-full"
                    style={{
                      width: 6,
                      height: 6,
                      background: isAI
                        ? "var(--primary)"
                        : "var(--green)",
                    }}
                  />
                  {isAI ? "IA · siempre disponible" : "En linea"}
                </div>
              </div>

              <button
                onClick={() => router.push(`/vault/${companionId}`)}
                className="flex items-center gap-[5px] cursor-pointer"
                style={{
                  background: "var(--gold-soft)",
                  border: "1px solid oklch(0.70 0.13 75 / 0.4)",
                  color: "var(--gold)",
                  padding: "7px 14px",
                  borderRadius: 14,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <ImageIcon size={14} /> Vault
              </button>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto flex flex-col gap-2 no-scrollbar relative z-10"
        style={{
          paddingTop: messagesTopPad,
          paddingBottom: "100px",
          paddingLeft: "16px",
          paddingRight: "16px"
        }}
      >
        {messages.length === 0 && companion && (
          <div className="text-center py-8 animate-fade">
            <img
              src={companion.photo_url}
              alt={companion.name}
              className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
              style={{ border: "2px solid var(--primary-soft)" }}
            />
            <p className="font-serif text-lg text-foreground italic">
              Comienza tu conversacion con {companion.name}
            </p>
            {!isSubscribed && remaining !== null && (
              <p className="text-muted-foreground text-sm mt-2">
                {remaining} mensajes gratis
              </p>
            )}
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className="flex animate-msg-in"
            style={{
              justifyContent:
                msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "78%",
                padding: "8px 13px",
                borderRadius: 18,
                borderBottomLeftRadius: msg.role === "companion" ? 4 : 18,
                borderBottomRightRadius: msg.role === "user" ? 4 : 18,
                fontSize: 14,
                lineHeight: 1.4,
                background:
                  msg.role === "user"
                    ? "linear-gradient(135deg, oklch(0.55 0.18 300 / 0.55), oklch(0.50 0.18 320 / 0.55))"
                    : "oklch(0.18 0.04 290 / 0.85)",
                border:
                  msg.role === "user"
                    ? "1px solid oklch(0.60 0.18 300 / 0.4)"
                    : "1px solid var(--border)",
                color: "var(--foreground)",
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {messages.length === 5 && companion && (
          <div className="flex justify-center animate-msg-in">
            <button
              onClick={() => router.push(`/vault/${companionId}`)}
              className="overflow-hidden cursor-pointer text-left"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.16 0.04 290), oklch(0.13 0.05 305))",
                border: "1px solid oklch(0.50 0.15 300 / 0.4)",
                borderRadius: 18,
                padding: 4,
                maxWidth: "82%",
                color: "var(--foreground)",
              }}
            >
              <div className="relative rounded-[14px] overflow-hidden">
                <div
                  className="w-[220px] h-[165px]"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.30 0.12 300 / 0.5), oklch(0.20 0.08 280 / 0.5))",
                  }}
                />
                <div
                  className="absolute inset-0 grid place-items-center"
                  style={{ background: "oklch(0 0 0 / 0.3)" }}
                >
                  <div className="text-center">
                    <Lock size={28} className="text-white mx-auto" />
                    <p className="text-white font-bold text-base mt-1">
                      Ver contenido
                    </p>
                    <p
                      className="text-[10px] font-semibold"
                      style={{ color: "var(--gold)" }}
                    >
                      Toca para desbloquear
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-[13px] p-2">
                {companion.name} tiene contenido exclusivo para ti
              </p>
            </button>
          </div>
        )}

        {isTyping && (
          <div className="flex justify-start animate-msg-in">
            <div className="glass-card px-4 py-3 rounded-[18px] flex items-center gap-2">
              <Sparkles size={12} className="text-primary" />
              <span className="text-xs text-muted-foreground">
                {isAI ? "Aura sintiendo" : "Escribiendo"}
              </span>
              <span className="tap-dots">
                <span />
                <span />
                <span />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="absolute left-3 right-3 bottom-4 z-[25]">
        <div className="glass-card rounded-[18px] p-[5px] flex items-center gap-1.5">
          <button
            onClick={() => router.push(`/vault/${companionId}`)}
            className="bg-transparent border-none cursor-pointer p-2"
            style={{ color: "var(--fg-muted)" }}
          >
            <Gift size={20} />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
            placeholder="Mensaje..."
            className="flex-1 bg-transparent border-none outline-none text-foreground text-sm py-2 px-1"
            disabled={isTyping}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="grid place-items-center cursor-pointer border-none"
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: input.trim()
                ? "linear-gradient(135deg, var(--primary), oklch(0.62 0.18 320))"
                : "var(--muted)",
              color: "white",
              opacity: input.trim() ? 1 : 0.4,
            }}
          >
            <Send size={16} />
          </button>
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
