"use client";

import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Users, MessageCircle } from "lucide-react";

const NAV_ITEMS = [
  { label: "Aura", href: "/", icon: Sparkles },
  { label: "Galeria", href: "/gallery", icon: Users },
  { label: "Chats", href: "/chats", icon: MessageCircle },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const isHidden = pathname.startsWith('/chat/') || pathname.startsWith('/vault/') || pathname.startsWith('/panel');
  if (isHidden) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 pb-safe">
      <div className="max-w-lg mx-auto px-2 pb-2">
        <div className="glass-card rounded-2xl flex items-center justify-around py-2 border border-border/30">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className="relative flex flex-col items-center gap-1 px-4 py-1.5"
              >
                <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-xs transition-colors ${isActive ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary"
                    layoutId="nav-indicator"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
