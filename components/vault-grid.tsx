"use client";

import { motion } from "framer-motion";
import { Lock, Camera, Video, Play } from "lucide-react";
import { WatermarkedImage } from "@/components/watermarked-image";

// 250 Stars ≈ $87 MXN → 1 Star ≈ $0.35 MXN (precio de compra del usuario)
const STAR_TO_MXN = 0.35;

function priceLabel(price: number) {
  const stars = Math.round(price / 100);
  const mxn = Math.round(stars * STAR_TO_MXN);
  return { stars, label: `★${stars} (~$${mxn} MXN)` };
}

interface VaultItem {
  id: string;
  type: 'photo' | 'video' | 'video_call';
  title: string | null;
  price: number;
  thumbnail_url: string | null;
  file_url: string | null;
  preview_url?: string | null;
  purchased: boolean;
  description: string | null;
}

interface VaultGridProps {
  items: VaultItem[];
  onPurchase: (itemId: string) => void;
  loading?: string | null;
  watermarkText?: string;
}

export function VaultGrid({ items, onPurchase, loading, watermarkText }: VaultGridProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <Camera className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Aun no hay contenido en el baul</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => {
        const { stars, label } = priceLabel(item.price);
        return (
          <motion.div
            key={item.id}
            className="relative rounded-xl overflow-hidden border border-border/50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {item.type === 'video' ? (
              <div className="aspect-square relative bg-black">
                {item.purchased && item.file_url ? (
                  <video
                    src={item.file_url}
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-cover"
                    style={{ maxHeight: '100%' }}
                  />
                ) : (
                  <div className="w-full h-full relative overflow-hidden flex flex-col items-center justify-center">
                    {item.preview_url && (
                      <video
                        src={item.preview_url}
                        preload="none"
                        muted
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ filter: 'blur(18px)', transform: 'scale(1.15)' }}
                      />
                    )}
                    <div className={`absolute inset-0 ${item.preview_url ? 'bg-black/55' : 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800'}`} />
                    <div className="relative z-10 flex flex-col items-center justify-center gap-2 p-4 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm border border-white/25">
                        <Play className="w-5 h-5 text-white fill-white" />
                      </div>
                      <p className="text-xs font-semibold text-white drop-shadow">Video privado</p>
                      <div className="flex items-center gap-1.5 rounded-full bg-black/50 backdrop-blur-sm px-3 py-1 text-[11px] text-white border border-white/20">
                        <Lock className="w-3 h-3 flex-shrink-0" />
                        <span className="font-bold">{label}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => onPurchase(item.id)}
                      disabled={loading === item.id}
                      className="absolute bottom-2 left-2 right-2 bg-primary text-primary-foreground py-2 rounded-lg text-xs font-bold disabled:opacity-50 z-10"
                    >
                      {loading === item.id ? '...' : `Desbloquear — ★${stars}`}
                    </button>
                  </div>
                )}
              </div>

            ) : item.type === 'photo' ? (
              <div className="aspect-square relative">
                {item.purchased && item.file_url ? (
                  watermarkText ? (
                    <WatermarkedImage
                      src={item.file_url}
                      watermarkText={watermarkText}
                      className="w-full h-full object-cover"
                      alt={item.title || 'Foto'}
                    />
                  ) : (
                    <img
                      src={item.file_url}
                      alt={item.title || 'Foto'}
                      className="w-full h-full object-cover"
                    />
                  )
                ) : (
                  <div className="w-full h-full bg-card relative overflow-hidden">
                    {item.preview_url ? (
                      <img
                        src={item.preview_url}
                        alt=""
                        aria-hidden
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ filter: 'blur(16px)', transform: 'scale(1.15)' }}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800" />
                    )}
                    <div className={`absolute inset-0 ${item.preview_url ? 'bg-black/45' : ''}`} />
                    <div className="relative z-10 flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                        <Lock className="w-5 h-5 text-white" />
                      </div>
                      <p className="text-xs font-semibold text-white drop-shadow">Foto exclusiva</p>
                      <div className="flex items-center gap-1.5 rounded-full bg-black/50 backdrop-blur-sm px-3 py-1 text-[11px] text-white border border-white/20">
                        <span className="font-bold">{label}</span>
                      </div>
                    </div>
                  </div>
                )}
                {!item.purchased && (
                  <button
                    onClick={() => onPurchase(item.id)}
                    disabled={loading === item.id}
                    className="absolute bottom-2 left-2 right-2 bg-primary text-primary-foreground py-2 rounded-lg text-xs font-bold disabled:opacity-50"
                  >
                    {loading === item.id ? '...' : `Desbloquear — ★${stars}`}
                  </button>
                )}
              </div>

            ) : (
              <div className="aspect-square relative bg-card flex flex-col items-center justify-center p-4">
                <Video className="w-8 h-8 text-primary mb-3" />
                <p className="text-foreground text-sm font-medium text-center">{item.title || 'Videollamada'}</p>
                {item.description && (
                  <p className="text-muted-foreground text-xs mt-1 text-center">{item.description}</p>
                )}
                <span className="text-primary font-bold mt-2 text-sm">{label}</span>
                {!item.purchased && (
                  <button
                    onClick={() => onPurchase(item.id)}
                    disabled={loading === item.id}
                    className="mt-3 w-full bg-primary text-primary-foreground py-2 rounded-lg text-sm font-bold disabled:opacity-50"
                  >
                    {loading === item.id ? '...' : 'Agendar'}
                  </button>
                )}
                {item.purchased && (
                  <span className="mt-3 text-green-400 text-sm font-medium">Agendada</span>
                )}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
