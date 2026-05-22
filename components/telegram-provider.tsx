"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

interface AppUser {
  id: string;
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  subscription_status: 'free' | 'active' | 'expired';
  subscription_expires_at: string | null;
  options_unlocked: boolean;
}

interface TelegramContextValue {
  telegramUser: TelegramUser | null;
  appUser: AppUser | null;
  isLoading: boolean;
  isInTelegram: boolean;
  refreshUser: () => Promise<void>;
}

const TelegramContext = createContext<TelegramContextValue>({
  telegramUser: null,
  appUser: null,
  isLoading: true,
  isInTelegram: false,
  refreshUser: async () => {},
});

export function useTelegram() {
  return useContext(TelegramContext);
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: TelegramUser;
          start_param?: string;
        };
        ready: () => void;
        expand: () => void;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        MainButton: {
          show: () => void;
          hide: () => void;
          setText: (text: string) => void;
          onClick: (cb: () => void) => void;
        };
        HapticFeedback: {
          impactOccurred: (style: string) => void;
          notificationOccurred: (type: string) => void;
        };
        contentSafeAreaInset?: { top: number; bottom: number; left: number; right: number };
        safeAreaInset?: { top: number; bottom: number; left: number; right: number };
        onEvent?: (event: string, handler: () => void) => void;
        offEvent?: (event: string, handler: () => void) => void;
      };
    };
  }
}

function applyTelegramSafeInsets(tg: any) {
  const update = () => {
  const contentTop = tg.contentSafeAreaInset?.top ?? 0;
  const safeTop = tg.safeAreaInset?.top ?? 0;
  const contentLeft = tg.contentSafeAreaInset?.left ?? 0;
  const insetTop = Math.max(contentTop, safeTop, 64);
  const insetLeft = Math.max(contentLeft, 14);
  document.documentElement.style.setProperty('--tg-content-safe-top', `${insetTop}px`);
  document.documentElement.style.setProperty('--tg-content-safe-left', `${insetLeft}px`);
    document.documentElement.setAttribute('data-tg', '1');
  };

  update();
  tg.onEvent?.('viewportChanged', update);
  tg.onEvent?.('safeAreaChanged', update);
}

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInTelegram, setIsInTelegram] = useState(false);

  const authenticate = async () => {
    try {
      const tg = window.Telegram?.WebApp;
      if (!tg || !tg.initData) {
        setIsLoading(false);
        return;
      }

      setIsInTelegram(true);
      tg.ready();
      tg.expand();
      applyTelegramSafeInsets(tg);
      
      // Newer Telegram versions support requestFullscreen for a truly immersive experience
      try {
        // @ts-ignore
        if (tg.requestFullscreen) {
          // @ts-ignore
          tg.requestFullscreen();
        }
      } catch (e) {
        console.warn('Fullscreen request failed', e);
      }

      tg.setHeaderColor('#0a0814');
      tg.setBackgroundColor('#0a0814');

      if (tg.initDataUnsafe.user) {
        setTelegramUser(tg.initDataUnsafe.user);
      }

      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initData: tg.initData,
          referralCode: tg.initDataUnsafe.start_param || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAppUser(data.user);
      }
    } catch {
      // Silent fail — app works without auth for non-Telegram access
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    const tg = window.Telegram?.WebApp;
    if (!tg?.initData) return;

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: tg.initData }),
      });
      if (res.ok) {
        const data = await res.json();
        setAppUser(data.user);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    authenticate();
  }, []);

  return (
    <TelegramContext.Provider value={{ telegramUser, appUser, isLoading, isInTelegram, refreshUser }}>
      {children}
    </TelegramContext.Provider>
  );
}
