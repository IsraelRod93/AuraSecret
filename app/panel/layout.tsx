import type { Metadata } from 'next'
import { Geist, Cormorant_Garamond, Inter } from 'next/font/google'

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-serif',
  display: 'swap'
});

const inter = Inter({
  subsets: ["latin"],
  variable: '--font-sans',
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'AURA Panel — Companeras',
  description: 'Administra tu perfil, fotos y ventas en Aura',
}

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${cormorant.variable} ${inter.variable} font-sans antialiased min-h-screen bg-background`}>
      {children}
    </div>
  );
}
