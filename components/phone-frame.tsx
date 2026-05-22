"use client";

import React from "react";
import { useTelegram } from "./telegram-provider";

export function PhoneFrame({ children }: { children: React.ReactNode }) {
  const { isInTelegram } = useTelegram();

  // If in Telegram, don't show the outer frame, just the content
  if (isInTelegram) {
    return (
      <div className="flex flex-col min-h-screen w-full relative">
        {children}
      </div>
    );
  }

  return (
    <div className="phone-outer">
      <div className="phone-frame">
        <div className="phone-screen">
          <div className="dynamic-island" />
          {children}
        </div>
      </div>
      <div className="home-indicator" />
    </div>
  );
}

export function StatusBar({ dark = false }: { dark?: boolean }) {
  const { isInTelegram } = useTelegram();
  const [time, setTime] = React.useState("9:41");

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(`${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  // Hide simulated status bar in Telegram since it has its own
  if (isInTelegram) return null;

  const c = dark ? "#fff" : "#fff"; // Default to white for Aura theme
  return (
    <div className="absolute top-0 left-0 right-0 z-50 flex justify-between items-center px-7 pt-3.5 pb-1 pointer-events-none">
      <div className="flex-1 flex items-center justify-start">
        <span className="font-sans font-semibold text-[17px] text-foreground">{time}</span>
      </div>
      <div className="flex-1 flex items-center justify-end gap-1.5">
        {/* Signal */}
        <svg width="19" height="12" viewBox="0 0 19 12">
          <rect x="0" y="7.5" width="3.2" height="4.5" rx="0.7" fill="currentColor" />
          <rect x="4.8" y="5" width="3.2" height="7" rx="0.7" fill="currentColor" />
          <rect x="9.6" y="2.5" width="3.2" height="9.5" rx="0.7" fill="currentColor" />
          <rect x="14.4" y="0" width="3.2" height="12" rx="0.7" fill="currentColor" />
        </svg>
        {/* WiFi */}
        <svg width="17" height="12" viewBox="0 0 17 12">
          <path d="M8.5 3.2C10.8 3.2 12.9 4.1 14.4 5.6L15.5 4.5C13.7 2.7 11.2 1.5 8.5 1.5C5.8 1.5 3.3 2.7 1.5 4.5L2.6 5.6C4.1 4.1 6.2 3.2 8.5 3.2Z" fill="currentColor" />
          <path d="M8.5 6.8C9.9 6.8 11.1 7.3 12 8.2L13.1 7.1C11.8 5.9 10.2 5.1 8.5 5.1C6.8 5.1 5.2 5.9 3.9 7.1L5 8.2C5.9 7.3 7.1 6.8 8.5 6.8Z" fill="currentColor" />
          <circle cx="8.5" cy="10.5" r="1.5" fill="currentColor" />
        </svg>
        {/* Battery */}
        <svg width="27" height="13" viewBox="0 0 27 13">
          <rect x="0.5" y="0.5" width="23" height="12" rx="3.5" stroke="currentColor" strokeOpacity="0.35" fill="none" />
          <rect x="2" y="2" width="20" height="9" rx="2" fill="currentColor" />
          <path d="M25 4.5V8.5C25.8 8.2 26.5 7.2 26.5 6.5C26.5 5.8 25.8 4.8 25 4.5Z" fill="currentColor" fillOpacity="0.4" />
        </svg>
      </div>
    </div>
  );
}
