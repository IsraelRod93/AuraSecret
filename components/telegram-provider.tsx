"use client";

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';

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
        showPopup?: (text: string, options?: any) => void;
      };
    };
  }
}

function applyTelegramSafeInsets(tg: any) {
  const update = () => {
  const contentTop = tg.contentSafeAreaInset?.top ?? 0;
  const safeTop = tg.safeAreaInset?.top ?? 0;
  const contentLeft = tg.contentSafeAreaInset?.left ?? 0;
  const contentRight = tg.contentSafeAreaInset?.right ?? 0;
  const insetTop = Math.max(contentTop, safeTop, 80);
  const insetLeft = Math.max(contentLeft, 18);
  const insetRight = Math.max(contentRight, 16);
  document.documentElement.style.setProperty('--tg-content-safe-top', `${insetTop}px`);
  document.documentElement.style.setProperty('--tg-content-safe-left', `${insetLeft}px`);
  document.documentElement.style.setProperty('--tg-content-safe-right', `${insetRight}px`);
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
  const [secureScreen, setSecureScreen] = useState(false);
  const [securityMessage, setSecurityMessage] = useState('');
  const warningTimerRef = useRef<number | null>(null);

  const showSecurityWarning = (message: string) => {
    setSecurityMessage(message);
    setSecureScreen(true);
    const tg = window.Telegram?.WebApp;
    if (tg?.showPopup) {
      tg.showPopup(message);
    }
    if (warningTimerRef.current) {
      window.clearTimeout(warningTimerRef.current);
    }
    warningTimerRef.current = window.setTimeout(() => {
      setSecurityMessage('');
      setSecureScreen(false);
      warningTimerRef.current = null;
    }, 2800);
  };

  const activateSecureScreen = () => {
    setSecureScreen(true);
    setSecurityMessage((prev) => prev || 'Modo seguro activado: no está permitido grabar o capturar pantalla.');
  };

  const deactivateSecureScreen = () => {
    setSecureScreen(false);
  };

  const authenticate = async () => {
    try {
      const tg = window.Telegram?.WebApp;

      if (tg?.initData) {
        setIsInTelegram(true);
        tg.ready();
        tg.expand();
        applyTelegramSafeInsets(tg);

        try {
          // @ts-ignore
          if (tg.requestFullscreen) tg.requestFullscreen();
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
      } else {
        // Fuera de Telegram: intentar sesión de usuario solo si hay cookie de sesión
        if (document.cookie.includes('user_session=')) {
          const res = await fetch('/api/user-auth/me');
          if (res.ok) {
            const data = await res.json();
            setAppUser(data.user);
          }
        }
      }
    } catch {
      // Silent fail
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

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'PrintScreen') {
        event.preventDefault();
        showSecurityWarning('Captura de pantalla no permitida en AuraSecret.');
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') {
        activateSecureScreen();
      } else {
        deactivateSecureScreen();
      }
    };

    const onBlur = () => {
      activateSecureScreen();
    };

    const onFocus = () => {
      deactivateSecureScreen();
    };

    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      if (warningTimerRef.current) {
        window.clearTimeout(warningTimerRef.current);
      }
    };
  }, []);

  return (
    <TelegramContext.Provider value={{ telegramUser, appUser, isLoading, isInTelegram, refreshUser }}>
      <div className="relative min-h-screen">
        {children}
        {secureScreen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 text-center px-6 py-8">
            <div className="max-w-lg rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_0_0_20px_rgba(0,0,0,0.12)] backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                Seguridad activa
              </p>
              <p className="mt-3 text-lg font-semibold text-white">
                {securityMessage || 'Modo seguro activado. No está permitido grabar pantalla.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </TelegramContext.Provider>
  );
}
