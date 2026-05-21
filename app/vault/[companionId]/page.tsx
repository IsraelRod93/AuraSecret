"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import { CelestialBackground } from "@/components/celestial-background";
import { VaultGrid } from "@/components/vault-grid";
import { useTelegram } from "@/components/telegram-provider";
import { openPaymentLink } from "@/lib/open-payment";

interface VaultItem {
  id: string;
  type: 'photo' | 'video_call';
  title: string | null;
  price: number;
  thumbnail_url: string | null;
  file_url: string | null;
  purchased: boolean;
  description: string | null;
}

export default function VaultPage({ params }: { params: Promise<{ companionId: string }> }) {
  const { companionId } = use(params);
  const router = useRouter();
  const { appUser } = useTelegram();
  const [items, setItems] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);
  const [companionName, setCompanionName] = useState('');

  useEffect(() => {
    loadVault();
  }, [companionId, appUser]);

  const loadVault = async () => {
    try {
      const params = new URLSearchParams({ companionId });
      if (appUser?.id) params.set('userId', appUser.id);

      const res = await fetch(`/api/vault?${params}`);
      const data = await res.json();
      setItems(data.items || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (itemId: string) => {
    if (!appUser?.id) return;
    setPurchaseLoading(itemId);

    try {
      const res = await fetch('/api/vault-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: appUser.id, vaultItemId: itemId }),
      });
      const data = await res.json();
      if (data.url) openPaymentLink(data.url);
    } catch {
      // ignore
    } finally {
      setPurchaseLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      <CelestialBackground />

      <div className="relative z-10 max-w-lg mx-auto">
        {/* Header */}
        <motion.header
          className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border/30"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button onClick={() => router.push(`/chat/${companionId}`)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="font-serif text-xl text-foreground">Baul exclusivo</h1>
            <p className="text-xs text-muted-foreground">Contenido premium</p>
          </div>
        </motion.header>

        {/* Content */}
        <div className="p-4">
          {loading ? (
            <div className="text-center py-12">
              <Sparkles className="w-8 h-8 text-primary mx-auto mb-4 animate-pulse" />
              <p className="text-muted-foreground">Cargando baul...</p>
            </div>
          ) : (
            <VaultGrid
              items={items}
              onPurchase={handlePurchase}
              loading={purchaseLoading}
            />
          )}
        </div>
      </div>
    </div>
  );
}
