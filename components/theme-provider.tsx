'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'
import { useTweaks } from '@/hooks/use-tweaks'

const ACCENT_PRESETS: Record<string, { primary: string; gold: string }> = {
  "#b489ff": { primary: 'oklch(0.72 0.18 300)', gold: 'oklch(0.80 0.15 75)' }, // purple
  "#ff89c5": { primary: 'oklch(0.72 0.20 350)', gold: 'oklch(0.78 0.16 50)' }, // pink
  "#5fc8d9": { primary: 'oklch(0.74 0.16 200)', gold: 'oklch(0.80 0.14 90)' }, // teal
  "#e4b855": { primary: 'oklch(0.78 0.16 70)',  gold: 'oklch(0.80 0.15 35)' }, // gold
};

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [tweaks] = useTweaks();

  React.useEffect(() => {
    const acc = ACCENT_PRESETS[tweaks.accent] || ACCENT_PRESETS['#b489ff'];
    const root = document.documentElement;
    
    root.style.setProperty('--primary', acc.primary);
    root.style.setProperty('--gold', acc.gold);
    root.style.setProperty('font-size', `${16 * (tweaks.fontScale || 1)}px`);
    
    // Additional derived colors
    root.style.setProperty('--primary-soft', acc.primary.replace(')', ' / 0.25)'));
    root.style.setProperty('--gold-soft', acc.gold.replace(')', ' / 0.25)'));
  }, [tweaks.accent, tweaks.fontScale]);

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
