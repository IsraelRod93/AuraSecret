"use client";

import { useState, useEffect, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, Plus, DollarSign, Users, TrendingUp, Trash2,
  Edit3, Check, X, Package, BarChart3, Image, LogOut,
} from "lucide-react";

interface VaultItem {
  id: string;
  type: string;
  title: string | null;
  price: number;
  file_url: string | null;
  thumbnail_url: string | null;
  group_name: string | null;
}

interface Stats {
  totalSales: number;
  totalRevenue: number;
  uniqueClients: number;
  totalItems: number;
  weekRevenue: number;
}

interface Sale {
  amount: number;
  created_at: string;
  title: string | null;
  first_name: string | null;
  username: string | null;
}

export default function PanelDashboard({ params }: { params: Promise<{ id: string }> }) {
  const { id: companionId } = use(params);
  const [tab, setTab] = useState<'gallery' | 'stats'>('gallery');
  const [items, setItems] = useState<VaultItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [companion, setCompanion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [groupMode, setGroupMode] = useState(false);
  const [selectedForGroup, setSelectedForGroup] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [groupPrice, setGroupPrice] = useState('');

  useEffect(() => {
    localStorage.setItem('companionId', companionId);
    loadAll();
  }, [companionId]);

  const loadAll = async () => {
    try {
      const [vaultRes, dashRes] = await Promise.all([
        fetch(`/api/vault?companionId=${companionId}`),
        fetch(`/api/dashboard?companionId=${companionId}`),
      ]);
      const vaultData = await vaultRes.json();
      const dashData = await dashRes.json();

      setItems(vaultData.items || []);
      setStats(dashData.stats || null);
      setSales(dashData.recentSales || []);
      setCompanion(dashData.companion || null);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        const uploadRes = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
          method: 'POST',
          body: file,
        });
        const uploadData = await uploadRes.json();
        if (!uploadData.url) throw new Error(uploadData.error || 'Upload failed');

        await fetch('/api/vault', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companionId,
            type: 'photo',
            title: file.name.replace(/\.[^.]+$/, ''),
            price: 4900,
            fileUrl: uploadData.url,
          }),
        });
      }
      await loadAll();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al subir');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateItem = async (itemId: string) => {
    try {
      await fetch('/api/vault', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          price: editPrice ? Number(editPrice) * 100 : undefined,
          title: editTitle || undefined,
        }),
      });
      setEditingId(null);
      await loadAll();
    } catch {
      alert('Error al actualizar');
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Eliminar esta foto?')) return;
    try {
      await fetch('/api/vault', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      });
      await loadAll();
    } catch {
      alert('Error al eliminar');
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName || !groupPrice || selectedForGroup.length < 2) {
      alert('Selecciona al menos 2 fotos, pon nombre y precio');
      return;
    }
    try {
      for (const itemId of selectedForGroup) {
        await fetch('/api/vault', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            itemId,
            groupName,
            price: Number(groupPrice) * 100,
          }),
        });
      }
      setGroupMode(false);
      setSelectedForGroup([]);
      setGroupName('');
      setGroupPrice('');
      await loadAll();
    } catch {
      alert('Error al crear sesion');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('companionId');
    window.location.href = '/panel';
  };

  const toggleGroupSelect = (id: string) => {
    setSelectedForGroup(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const grouped = items.reduce((acc, item) => {
    const key = item.group_name || '__individual';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, VaultItem[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Camera className="w-8 h-8 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {companion?.photo_url && (
            <img src={companion.photo_url} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-primary" />
          )}
          <div className="flex-1">
            <h1 className="font-serif text-xl text-foreground">{companion?.name || 'Dashboard'}</h1>
            <p className="text-xs text-muted-foreground">
              {companion?.status === 'active' ? 'Perfil activo' : 'Pendiente de activacion'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground transition-colors p-2"
            title="Cerrar sesion"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-lg mx-auto flex border-b border-border">
        <button
          onClick={() => setTab('gallery')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
            tab === 'gallery' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
          }`}
        >
          <Image size={16} /> Mi Galeria
        </button>
        <button
          onClick={() => setTab('stats')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
            tab === 'stats' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
          }`}
        >
          <BarChart3 size={16} /> Mis Ventas
        </button>
      </div>

      <div className="max-w-lg mx-auto p-4">
        <AnimatePresence mode="wait">
          {tab === 'gallery' ? (
            <motion.div key="gallery" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Upload + Group buttons */}
              <div className="flex gap-2 mb-4">
                <label className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer">
                  <Plus size={18} /> {uploading ? 'Subiendo...' : 'Subir fotos'}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={e => handleUpload(e.target.files)}
                    disabled={uploading}
                  />
                </label>
                <button
                  onClick={() => { setGroupMode(!groupMode); setSelectedForGroup([]); }}
                  className={`px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-2 border ${
                    groupMode ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'
                  }`}
                >
                  <Package size={16} /> Sesion
                </button>
              </div>

              {/* Group mode bar */}
              {groupMode && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="bg-card border border-border rounded-xl p-3 mb-4 space-y-2"
                >
                  <p className="text-xs text-muted-foreground">Selecciona fotos para agrupar como sesion (1 precio para todas)</p>
                  <input
                    className="w-full bg-background border border-border rounded-lg p-2 text-sm text-foreground outline-none"
                    placeholder="Nombre de la sesion (ej: Sesion playa)"
                    value={groupName}
                    onChange={e => setGroupName(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      className="flex-1 bg-background border border-border rounded-lg p-2 text-sm text-foreground outline-none"
                      placeholder="Precio MXN"
                      value={groupPrice}
                      onChange={e => setGroupPrice(e.target.value)}
                    />
                    <button
                      onClick={handleCreateGroup}
                      className="bg-primary text-primary-foreground px-4 rounded-lg text-sm font-bold"
                    >
                      Crear ({selectedForGroup.length})
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Photo grid */}
              {items.length === 0 ? (
                <div className="text-center py-16">
                  <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">Aun no tienes fotos</p>
                  <p className="text-xs text-muted-foreground">Sube tu primera foto para empezar a ganar</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(grouped).map(([group, groupItems]) => (
                    <div key={group}>
                      {group !== '__individual' && (
                        <div className="flex items-center gap-2 mb-2">
                          <Package size={14} className="text-primary" />
                          <span className="text-sm font-medium text-primary">{group}</span>
                          <span className="text-xs text-muted-foreground">
                            — ${(groupItems[0].price / 100).toFixed(0)} MXN ({groupItems.length} fotos)
                          </span>
                        </div>
                      )}
                      <div className="grid grid-cols-3 gap-2">
                        {groupItems.map(item => (
                          <div key={item.id} className="relative group">
                            {groupMode && (
                              <button
                                onClick={() => toggleGroupSelect(item.id)}
                                className={`absolute top-1 left-1 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs ${
                                  selectedForGroup.includes(item.id)
                                    ? 'bg-primary border-primary text-primary-foreground'
                                    : 'bg-black/50 border-white/50 text-white'
                                }`}
                              >
                                {selectedForGroup.includes(item.id) && <Check size={12} />}
                              </button>
                            )}

                            <div className="aspect-square rounded-lg overflow-hidden">
                              <img
                                src={item.file_url || item.thumbnail_url || ''}
                                alt={item.title || ''}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            {/* Price badge */}
                            {group === '__individual' && (
                              <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                                ${(item.price / 100).toFixed(0)}
                              </div>
                            )}

                            {/* Edit/Delete overlay */}
                            {!groupMode && (
                              <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => {
                                    setEditingId(item.id);
                                    setEditPrice(String(item.price / 100));
                                    setEditTitle(item.title || '');
                                  }}
                                  className="w-6 h-6 bg-black/70 rounded-full flex items-center justify-center"
                                >
                                  <Edit3 size={12} className="text-white" />
                                </button>
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className="w-6 h-6 bg-red-500/80 rounded-full flex items-center justify-center"
                                >
                                  <Trash2 size={12} className="text-white" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Edit modal */}
              <AnimatePresence>
                {editingId && (
                  <motion.div
                    className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      className="bg-card rounded-2xl p-6 w-full max-w-sm border border-border"
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                    >
                      <h3 className="font-serif text-lg text-foreground mb-4">Editar foto</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-muted-foreground">Titulo</label>
                          <input
                            className="w-full bg-background border border-border rounded-lg p-2.5 text-sm text-foreground outline-none mt-1"
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Precio (MXN)</label>
                          <input
                            type="number"
                            className="w-full bg-background border border-border rounded-lg p-2.5 text-sm text-foreground outline-none mt-1"
                            value={editPrice}
                            onChange={e => setEditPrice(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex-1 py-2.5 rounded-lg border border-border text-muted-foreground text-sm"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleUpdateItem(editingId)}
                          className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm"
                        >
                          Guardar
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div key="stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Stats cards */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-card border border-border rounded-xl p-4">
                  <DollarSign className="w-5 h-5 text-green-400 mb-1" />
                  <p className="text-2xl font-bold text-foreground">
                    ${stats ? ((stats.totalRevenue * 0.8) / 100).toFixed(0) : '0'}
                  </p>
                  <p className="text-xs text-muted-foreground">Ganancia total</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                  <TrendingUp className="w-5 h-5 text-primary mb-1" />
                  <p className="text-2xl font-bold text-foreground">
                    ${stats ? ((stats.weekRevenue * 0.8) / 100).toFixed(0) : '0'}
                  </p>
                  <p className="text-xs text-muted-foreground">Esta semana</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                  <Users className="w-5 h-5 text-blue-400 mb-1" />
                  <p className="text-2xl font-bold text-foreground">{stats?.uniqueClients || 0}</p>
                  <p className="text-xs text-muted-foreground">Clientes</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                  <Camera className="w-5 h-5 text-pink-400 mb-1" />
                  <p className="text-2xl font-bold text-foreground">{stats?.totalSales || 0}</p>
                  <p className="text-xs text-muted-foreground">Ventas totales</p>
                </div>
              </div>

              {/* Recent sales */}
              <h3 className="font-serif text-lg text-foreground mb-3">Ventas recientes</h3>
              {sales.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">Aun no tienes ventas</p>
                  <p className="text-xs text-muted-foreground mt-1">Comparte tu perfil para empezar a ganar</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sales.map((sale, i) => (
                    <div key={i} className="bg-card border border-border rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-foreground font-medium">
                          {sale.title || 'Contenido'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {sale.first_name || sale.username || 'Anonimo'} • {new Date(sale.created_at).toLocaleDateString('es-MX')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-400">
                          +${((sale.amount * 0.8) / 100).toFixed(0)}
                        </p>
                        <p className="text-xs text-muted-foreground">MXN</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
