"use client";

import { usePathname, useRouter } from "next/navigation";
import { Sparkles, Heart, ShoppingBag, MessageCircle } from "lucide-react";

const NAV_ITEMS = [
  { label: "Aura", href: "/", icon: Sparkles },
  { label: "Descubre", href: "/gallery", icon: Heart },
  { label: "Explorar", href: "/explore", icon: ShoppingBag },
  { label: "Chats", href: "/chats", icon: MessageCircle },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const isHidden =
    pathname.startsWith('/chat/') ||
    pathname.startsWith('/vault/') ||
    pathname.startsWith('/panel') ||
    pathname === '/welcome';
  if (isHidden) return null;

  return (
    <nav className="absolute bottom-3.5 left-3 right-3 z-30 pointer-events-none">
      <div
        className="nav-glass max-w-lg mx-auto pointer-events-auto"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${NAV_ITEMS.length}, 1fr)`,
          padding: '8px 6px',
          borderRadius: 20,
        }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href);

          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className="relative flex flex-col items-center gap-0.5 py-2 transition-colors bg-transparent border-none cursor-pointer"
              style={{
                color: isActive ? 'var(--primary)' : 'var(--fg-muted)',
              }}
            >
              <item.icon size={20} />
              <span className="text-[10px] font-medium tracking-wide">
                {item.label}
              </span>
              {isActive && <span className="nav-dot" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
