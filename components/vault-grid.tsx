"use client";

import { motion } from "framer-motion";
import { Lock, Camera, Video } from "lucide-react";

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

interface VaultGridProps {
  items: VaultItem[];
  onPurchase: (itemId: string) => void;
  loading?: string | null;
}

export function VaultGrid({ items, onPurchase, loading }: VaultGridProps) {
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
      {items.map((item) => (
        <motion.div
          key={item.id}
          className="relative rounded-xl overflow-hidden border border-border/50"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {item.type === 'photo' ? (
            <div className="aspect-square relative">
              {item.purchased && item.file_url ? (
                <img
                  src={item.file_url}
                  alt={item.title || 'Foto'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <>
                  {item.thumbnail_url ? (
                    <img
                      src={item.thumbnail_url}
                      alt="Preview"
                      className="w-full h-full object-cover blur-lg"
                    />
                  ) : (
                    <div className="w-full h-full bg-card flex items-center justify-center">
                      <Camera className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
                    <Lock className="w-6 h-6 text-white mb-2" />
                    <span className="text-white font-bold">${(item.price / 100).toFixed(0)} MXN</span>
                  </div>
                </>
              )}

              {!item.purchased && (
                <button
                  onClick={() => onPurchase(item.id)}
                  disabled={loading === item.id}
                  className="absolute bottom-2 left-2 right-2 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-bold disabled:opacity-50"
                >
                  {loading === item.id ? '...' : 'Desbloquear'}
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
              <span className="text-primary font-bold mt-2">${(item.price / 100).toFixed(0)} MXN</span>
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
      ))}
    </div>
  );
}
