"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, Check, Sparkles, ArrowRight, Camera } from "lucide-react";
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
      if (appUser?.id) params.set("userId", appUser.id);
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
        type: "vault_purchase",
        userId: appUser.id,
        vaultItemId: itemId,
      });
      if (paid) await loadItems();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al procesar el pago");
    } finally {
      setPurchaseLoading(null);
    }
  };

  const grouped = items.reduce(
    (acc, item) => {
      const key = item.companion_id;
      if (!acc[key]) acc[key] = { name: item.companion_name, photo: item.companion_photo, items: [] };
      acc[key].items.push(item);
      return acc;
    },
    {} as Record<string, { name: string; photo: string; items: ExploreItem[] }>,
  );

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <CelestialBackground />

      <div className="relative z-10 px-4 pt-[76px] pb-[100px] overflow-y-auto min-h-screen no-scrollbar">
        <div className="mb-[18px]">
          <h1 className="font-serif text-[26px] text-foreground">Explorar</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Novedades de tus favoritas</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Sparkles className="w-8 h-8 text-primary mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground font-serif italic">Cargando contenido...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <Camera className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <p className="font-serif text-xl text-foreground mb-2">No hay contenido nuevo</p>
            <p className="text-muted-foreground text-xs">Aqui veras novedades de tus favoritas</p>
          </div>
        ) : (
          Object.entries(grouped).map(([companionId, group]) => (
            <div key={companionId} className="mb-7">
              <button
                onClick={() => router.push(`/chat/${companionId}`)}
                className="flex items-center gap-2.5 mb-2.5 w-full text-left bg-transparent border-none cursor-pointer p-0"
                style={{ color: "var(--foreground)" }}
              >
                <img
                  src={group.photo}
                  alt={group.name}
                  className="w-[38px] h-[38px] rounded-full object-cover"
                  style={{ border: "1px solid oklch(0.45 0.10 300 / 0.55)" }}
                />
                <div className="flex-1">
                  <p className="font-serif text-base">{group.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {group.items.length} contenido{group.items.length !== 1 ? "s" : ""} nuevo
                    {group.items.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <ArrowRight size={16} className="text-muted-foreground" />
              </button>

              <div className="grid grid-cols-3 gap-1.5">
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className="relative aspect-square rounded-[14px] overflow-hidden"
                    style={{ border: "1px solid oklch(0.30 0.06 295 / 0.35)" }}
                  >
                    {item.purchased ? (
                      <>
                        {item.thumbnail_url && (
                          <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" />
                        )}
                        <div
                          className="absolute top-1.5 left-1.5 flex items-center gap-1 px-[7px] py-0.5 rounded-full text-[9px] font-bold text-white"
                          style={{ background: "oklch(0.65 0.15 155 / 0.85)" }}
                        >
                          <Check size={10} /> TUYO
                        </div>
                      </>
                    ) : (
                      <button
                        onClick={() => handlePurchase(item.id)}
                        disabled={purchaseLoading === item.id}
                        className="absolute inset-0 w-full h-full border-none cursor-pointer p-0 bg-transparent"
                      >
                        {item.thumbnail_url ? (
                          <img
                            src={item.thumbnail_url}
                            alt=""
                            className="w-full h-full object-cover"
                            style={{ filter: "blur(12px) saturate(0.7)", transform: "scale(1.15)" }}
                          />
                        ) : (
                          <div className="w-full h-full bg-card" />
                        )}
                        <div
                          className="absolute inset-0 flex flex-col items-center justify-center gap-1"
                          style={{ background: "oklch(0 0 0 / 0.45)" }}
                        >
                          <Lock size={18} className="text-white" />
                          <span className="text-white font-bold text-xs">
                            ${(item.price / 100).toFixed(0)}
                          </span>
                          {purchaseLoading === item.id && (
                            <span className="tap-dots">
                              <span />
                              <span />
                              <span />
                            </span>
                          )}
                        </div>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
