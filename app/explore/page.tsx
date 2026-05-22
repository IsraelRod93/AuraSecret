"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Camera, Sparkles, ArrowLeft } from "lucide-react";
import { CelestialBackground } from "@/components/celestial-background";
import { useTelegram } from "@/components/telegram-provider";
import { payWithTelegram } from "@/lib/open-payment";

interface ExploreItem {
  id: string;
  type: string;
  title: string | null;
  price: number;
  thumbnail_url: string | null;
  companion_id: string;
  companion_name: string;
  companion_photo: string;
  purchased: boolean;
}

export default function ExplorePage() {
  const router = useRouter();
  const { appUser } = useTelegram();
  const [items, setItems] = useState<ExploreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);

  useEffect(() => {
    loadItems();
  }, [appUser]);

  const loadItems = async () => {
    try {
      const params = new URLSearchParams();
      if (appUser?.id) params.set('userId', appUser.id);
      const res = await fetch(`/api/explore?${params}`);
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
      const paid = await payWithTelegram({
        type: 'vault_purchase',
        userId: appUser.id,
        vaultItemId: itemId,
      });
      if (paid) await loadItems();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al procesar el pago');
    } finally {
      setPurchaseLoading(null);
    }
  };

  const grouped = items.reduce((acc, item) => {
    const key = item.companion_id;
    if (!acc[key]) acc[key] = { name: item.companion_name, photo: item.companion_photo, items: [] };
    acc[key].items.push(item);
    return acc;
  }, {} as Record<string, { name: string; photo: string; items: ExploreItem[] }>);

  return (
    <div className="min-h-screen bg-background relative pb-24">
      <CelestialBackground />

      <div className="relative z-10 max-w-lg mx-auto">
        <motion.header
          className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border/30"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button onClick={() => router.push('/gallery')} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="font-serif text-xl text-foreground">Explorar</h1>
            <p className="text-xs text-muted-foreground">Contenido exclusivo de todas las creadoras</p>
          </div>
        </motion.header>

        <div className="p-4 space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <Sparkles className="w-8 h-8 text-primary mx-auto mb-4 animate-pulse" />
              <p className="text-muted-foreground">Cargando contenido...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <Camera className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Pronto habra contenido exclusivo</p>
            </div>
          ) : (
            Object.entries(grouped).map(([companionId, group]) => (
              <motion.div
                key={companionId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <button
                  onClick={() => router.push(`/chat/${companionId}`)}
                  className="flex items-center gap-3 mb-3"
                >
                  <img
                    src={group.photo}
                    alt={group.name}
                    className="w-10 h-10 rounded-full object-cover border border-primary/30"
                  />
                  <div className="text-left">
                    <p className="font-serif text-foreground font-medium">{group.name}</p>
                    <p className="text-xs text-muted-foreground">{group.items.length} contenido{group.items.length > 1 ? 's' : ''} exclusivo{group.items.length > 1 ? 's' : ''}</p>
                  </div>
                </button>

                <div className="grid grid-cols-3 gap-2">
                  {group.items.map((item) => (
                    <motion.div
                      key={item.id}
                      className="relative aspect-square rounded-xl overflow-hidden border border-border/50"
                      whileTap={{ scale: 0.95 }}
                    >
                      {item.purchased ? (
                        <div className="w-full h-full bg-green-500/10 flex items-center justify-center">
                          <span className="text-green-400 text-xs font-bold">Tuyo</span>
                        </div>
                      ) : (
                        <>
                          {item.thumbnail_url ? (
                            <img
                              src={item.thumbnail_url}
                              alt=""
                              className="w-full h-full object-cover blur-xl scale-110"
                            />
                          ) : (
                            <div className="w-full h-full bg-card" />
                          )}
                          <button
                            onClick={() => handlePurchase(item.id)}
                            disabled={purchaseLoading === item.id}
                            className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1"
                          >
                            <Lock className="w-5 h-5 text-white" />
                            <span className="text-white text-xs font-bold">${(item.price / 100).toFixed(0)}</span>
                            {purchaseLoading === item.id && (
                              <span className="text-white/60 text-[10px]">...</span>
                            )}
                          </button>
                        </>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
