"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Package, Plus, Edit3, Image, Check, X, Trash2, Sparkles } from "lucide-react";
import { VaultItem } from "./types";
import { LoadingSpinner, Modal } from "./shared";

export function PhotosTab({ companionId }: { companionId: string }) {
  const [mode, setMode] = useState<'individual' | 'packages'>('individual');
  const [items, setItems] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [priceModal, setPriceModal] = useState<{ files: File[] } | null>(null);
  const [newPrice, setNewPrice] = useState('49');
  const [selectedPhoto, setSelectedPhoto] = useState<VaultItem | null>(null);
  const [editPrice, setEditPrice] = useState('');

  const [creatingPackage, setCreatingPackage] = useState(false);
  const [editingPackage, setEditingPackage] = useState<string | null>(null);
  const [editPkgName, setEditPkgName] = useState('');
  const [editPkgPrice, setEditPkgPrice] = useState('');
  const [pkgName, setPkgName] = useState('');
  const [pkgPrice, setPkgPrice] = useState('');
  const [pkgSelected, setPkgSelected] = useState<string[]>([]);
  const [pkgNewFiles, setPkgNewFiles] = useState<File[]>([]);

  useEffect(() => { loadItems(); }, [companionId]);

  const loadItems = async () => {
    try {
      const res = await fetch(`/api/vault?companionId=${companionId}`);
      const data = await res.json();
      setItems(data.items || []);
    } finally { setLoading(false); }
  };

  const individualItems = items.filter(i => !i.group_name);
  const packages = items.reduce((acc, item) => {
    if (!item.group_name) return acc;
    if (!acc[item.group_name]) acc[item.group_name] = [];
    acc[item.group_name].push(item);
    return acc;
  }, {} as Record<string, VaultItem[]>);

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setPriceModal({ files: Array.from(files) });
    setNewPrice('49');
  };

  const handleUploadWithPrice = async () => {
    if (!priceModal) return;
    setUploading(true);
    try {
      for (const file of priceModal.files) {
        const uploadRes = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, { method: 'POST', body: file });
        const uploadData = await uploadRes.json();
        if (!uploadData.url) throw new Error('Error al subir');

        const itemType = file.type.startsWith('video/') ? 'video' : 'photo';
        await fetch('/api/vault', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companionId, type: itemType, title: file.name.replace(/\.[^.]+$/, ''), price: Number(newPrice) * 100, fileUrl: uploadData.url }),
        });
      }
      setPriceModal(null);
      await loadItems();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al subir');
    } finally { setUploading(false); }
  };

  const handleUpdatePrice = async (itemId: string) => {
    await fetch('/api/vault', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, price: Number(editPrice) * 100 }),
    });
    setSelectedPhoto(null);
    await loadItems();
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('¿Eliminar este archivo?')) return;
    await fetch('/api/vault', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId }),
    });
    setSelectedPhoto(null);
    await loadItems();
  };

  const handleCreatePackage = async () => {
    if (!pkgName || !pkgPrice) { alert('Pon nombre y precio al paquete'); return; }
    if (pkgSelected.length === 0 && pkgNewFiles.length === 0) { alert('Agrega al menos un archivo al paquete'); return; }

    setUploading(true);
    const totalFiles = pkgNewFiles.length;
    try {
      for (const id of pkgSelected) {
        const res = await fetch('/api/vault', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId: id, groupName: pkgName, price: Number(pkgPrice) * 100 }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error || `Error al mover archivo (${res.status})`);
        }
      }

      for (let i = 0; i < pkgNewFiles.length; i++) {
        const file = pkgNewFiles[i];
        setUploadStatus(`Subiendo ${i + 1}/${totalFiles}: ${file.name.slice(0, 20)}${file.name.length > 20 ? '…' : ''}`);

        const uploadRes = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, { method: 'POST', body: file });
        const uploadData = await uploadRes.json().catch(() => ({}));
        if (!uploadRes.ok || !uploadData.url) throw new Error(uploadData.error || `Error al subir "${file.name}"`);

        const itemType = file.type.startsWith('video/') ? 'video' : 'photo';
        const vaultRes = await fetch('/api/vault', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companionId, type: itemType, title: file.name.replace(/\.[^.]+$/, ''), price: Number(pkgPrice) * 100, fileUrl: uploadData.url, groupName: pkgName }),
        });
        if (!vaultRes.ok) {
          const d = await vaultRes.json().catch(() => ({}));
          throw new Error(d.error || `Error al guardar archivo`);
        }
      }

      setCreatingPackage(false);
      setPkgName(''); setPkgPrice(''); setPkgSelected([]); setPkgNewFiles([]);
      await loadItems();
    } catch (e) { alert(e instanceof Error ? e.message : 'Error al crear paquete'); }
    finally { setUploading(false); setUploadStatus(''); }
  };

  const handleDeletePackage = async (groupName: string) => {
    if (!confirm(`Eliminar el paquete "${groupName}" y todas sus fotos?`)) return;
    setUploading(true);
    try {
      for (const item of packages[groupName]) {
        await fetch('/api/vault', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itemId: item.id }) });
      }
      setEditingPackage(null);
      await loadItems();
    } catch { alert('Error al eliminar paquete'); }
    finally { setUploading(false); }
  };

  const handleUpdatePackage = async () => {
    if (!editingPackage || !editPkgName || !editPkgPrice) return;
    setUploading(true);
    try {
      for (const item of packages[editingPackage]) {
        await fetch('/api/vault', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId: item.id, groupName: editPkgName, price: Number(editPkgPrice) * 100 }),
        });
      }
      for (const file of pkgNewFiles) {
        const uploadRes = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, { method: 'POST', body: file });
        const uploadData = await uploadRes.json();
        if (!uploadData.url) continue;
        const itemType = file.type.startsWith('video/') ? 'video' : 'photo';
        await fetch('/api/vault', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companionId, type: itemType, title: file.name.replace(/\.[^.]+$/, ''), price: Number(editPkgPrice) * 100, fileUrl: uploadData.url, groupName: editPkgName }),
        });
      }
      setEditingPackage(null);
      setPkgNewFiles([]);
      await loadItems();
    } catch { alert('Error al actualizar paquete'); }
    finally { setUploading(false); }
  };

  const handleRemoveFromPackage = async (itemId: string) => {
    await fetch('/api/vault', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, groupName: null }),
    });
    await loadItems();
  };

  const openEditPackage = (groupName: string) => {
    setEditingPackage(groupName);
    setEditPkgName(groupName);
    const pkgItems = packages[groupName];
    if (pkgItems && pkgItems.length > 0) setEditPkgPrice(String(pkgItems[0].price / 100));
    setPkgNewFiles([]);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* Mode toggle */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <button
          onClick={() => setMode('individual')}
          className={`rounded-xl p-4 border-2 text-left transition-all ${mode === 'individual' ? 'bg-primary/10 border-primary' : 'bg-card border-border'}`}
        >
          <Camera size={22} className={mode === 'individual' ? 'text-primary' : 'text-muted-foreground'} />
          <p className={`font-medium text-sm mt-2 ${mode === 'individual' ? 'text-primary' : 'text-foreground'}`}>Fotos sueltas</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Cada una tiene su precio</p>
        </button>
        <button
          onClick={() => setMode('packages')}
          className={`rounded-xl p-4 border-2 text-left transition-all ${mode === 'packages' ? 'bg-primary/10 border-primary' : 'bg-card border-border'}`}
        >
          <Package size={22} className={mode === 'packages' ? 'text-primary' : 'text-muted-foreground'} />
          <p className={`font-medium text-sm mt-2 ${mode === 'packages' ? 'text-primary' : 'text-foreground'}`}>Paquetes</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Varias fotos, un precio</p>
        </button>
      </div>

      {mode === 'individual' ? (
        <>
          <label className="block bg-card border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary transition-colors mb-4">
            {uploading
              ? <Sparkles className="mx-auto mb-2 text-primary animate-spin" size={28} />
              : <Plus className="mx-auto mb-2 text-muted-foreground" size={28} />}
            <p className="text-sm text-muted-foreground">{uploading ? 'Subiendo...' : 'Toca para subir fotos o videos'}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Cada archivo se vende por separado</p>
            <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={e => handleFilesSelected(e.target.files)} disabled={uploading} />
          </label>

          {individualItems.length === 0 ? (
            <div className="text-center py-12">
              <Image className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Aún no tienes fotos</p>
              <p className="text-xs text-muted-foreground">Sube tu primera foto para empezar</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {individualItems.map(item => (
                <button key={item.id} onClick={() => { setSelectedPhoto(item); setEditPrice(String(item.price / 100)); }} className="relative aspect-square rounded-lg overflow-hidden bg-slate-900">
                  {item.type === 'video' ? (
                    <>
                      <video src={item.file_url || ''} preload="none" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white fill-white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                      </div>
                    </>
                  ) : (
                    <img src={item.file_url || item.thumbnail_url || ''} alt={item.title || ''} className="w-full h-full object-cover" />
                  )}
                  <div className="absolute bottom-1 left-1 bg-green-500/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    ★{item.price / 100}
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <button
            onClick={() => setCreatingPackage(true)}
            className="w-full bg-card border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary transition-colors mb-4"
          >
            <Plus className="mx-auto mb-2 text-muted-foreground" size={28} />
            <p className="text-sm text-muted-foreground">Crear nuevo paquete</p>
          </button>

          {Object.keys(packages).length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No tienes paquetes</p>
              <p className="text-xs text-muted-foreground">Crea un paquete para vender varias fotos juntas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(packages).map(([name, pkgItems]) => (
                <button
                  key={name}
                  onClick={() => openEditPackage(name)}
                  className="w-full bg-card border border-border rounded-xl p-4 text-left hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-foreground text-sm">{name}</p>
                      <p className="text-xs text-muted-foreground">{pkgItems.length} fotos · ★{pkgItems[0].price / 100} Stars</p>
                    </div>
                    <Edit3 size={16} className="text-muted-foreground" />
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {pkgItems.map(item => (
                      <div key={item.id} className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-slate-900 relative">
                        {item.type === 'video' ? (
                          <div className="w-full h-full flex items-center justify-center bg-slate-800">
                            <svg className="w-6 h-6 text-white/60 fill-white/60" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                          </div>
                        ) : (
                          <img src={item.file_url || item.thumbnail_url || ''} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Price modal */}
      <AnimatePresence>
        {priceModal && (
          <Modal onClose={() => setPriceModal(null)}>
            <h3 className="font-serif text-lg text-foreground mb-1">Precio por archivo</h3>
            <p className="text-xs text-muted-foreground mb-4">
              {priceModal.files.length} archivo{priceModal.files.length > 1 ? 's' : ''} seleccionado{priceModal.files.length > 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-muted-foreground text-lg">★</span>
              <input
                type="number" autoFocus
                className="flex-1 bg-background border border-border rounded-lg p-3 text-foreground text-2xl font-bold text-center outline-none"
                value={newPrice} onChange={e => setNewPrice(e.target.value)}
              />
              <span className="text-muted-foreground text-sm">Stars</span>
            </div>
            <button onClick={handleUploadWithPrice} disabled={uploading} className="w-full bg-primary text-primary-foreground p-3 rounded-lg font-bold disabled:opacity-50">
              {uploading ? 'Subiendo...' : 'GUARDAR Y SUBIR'}
            </button>
          </Modal>
        )}
      </AnimatePresence>

      {/* Photo detail modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <Modal onClose={() => setSelectedPhoto(null)}>
            {selectedPhoto.type === 'video' ? (
              <video src={selectedPhoto.file_url || ''} controls playsInline preload="metadata" className="w-full aspect-square object-cover rounded-xl mb-4" />
            ) : (
              <img src={selectedPhoto.file_url || selectedPhoto.thumbnail_url || ''} alt="" className="w-full aspect-square object-cover rounded-xl mb-4" />
            )}
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Precio (Stars)</label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-muted-foreground">★</span>
                  <input
                    type="number"
                    className="flex-1 bg-background border border-border rounded-lg p-2.5 text-foreground text-lg font-bold outline-none"
                    value={editPrice} onChange={e => setEditPrice(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleUpdatePrice(selectedPhoto.id)} className="flex-1 bg-primary text-primary-foreground p-3 rounded-lg font-bold text-sm">
                  Guardar precio
                </button>
                <button onClick={() => handleDelete(selectedPhoto.id)} className="px-4 p-3 rounded-lg bg-red-500/20 text-red-400 font-bold text-sm">
                  Eliminar
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Package creation modal */}
      <AnimatePresence>
        {creatingPackage && (
          <Modal onClose={() => { setCreatingPackage(false); setPkgSelected([]); setPkgNewFiles([]); }}>
            <h3 className="font-serif text-lg text-foreground mb-4">Crear paquete</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground">Nombre del paquete</label>
                <input className="w-full bg-background border border-border rounded-lg p-3 text-foreground outline-none text-sm mt-1" value={pkgName} onChange={e => setPkgName(e.target.value)} placeholder="Ej: Sesion en la playa" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Precio del paquete completo</label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-muted-foreground">★</span>
                  <input type="number" className="flex-1 bg-background border border-border rounded-lg p-3 text-foreground font-bold outline-none" value={pkgPrice} onChange={e => setPkgPrice(e.target.value)} placeholder="199" />
                  <span className="text-muted-foreground text-sm">Stars</span>
                </div>
              </div>

              {individualItems.length > 0 && (
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Seleccionar fotos que ya subiste</label>
                  <div className="grid grid-cols-4 gap-1.5 max-h-40 overflow-y-auto">
                    {individualItems.map(item => (
                      <button
                        key={item.id}
                        onClick={() => setPkgSelected(prev => prev.includes(item.id) ? prev.filter(x => x !== item.id) : [...prev, item.id])}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 ${pkgSelected.includes(item.id) ? 'border-primary' : 'border-transparent'}`}
                      >
                        <img src={item.file_url || item.thumbnail_url || ''} alt="" className="w-full h-full object-cover" />
                        {pkgSelected.includes(item.id) && (
                          <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                            <Check size={20} className="text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-muted-foreground mb-2 block">
                  Sube fotos y videos {pkgNewFiles.length > 0 && `(${pkgNewFiles.length} seleccionado${pkgNewFiles.length > 1 ? 's' : ''})`}
                </label>
                <label className="block bg-background border border-dashed border-border rounded-lg p-3 text-center cursor-pointer text-sm text-muted-foreground hover:border-primary transition-colors">
                  <Plus size={16} className="inline mr-1" />
                  Agregar fotos o videos
                  <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={e => { if (e.target.files) setPkgNewFiles(prev => [...prev, ...Array.from(e.target.files!)]); }} />
                </label>
                {pkgNewFiles.length > 0 && (
                  <div className="grid grid-cols-4 gap-1.5 mt-2 max-h-40 overflow-y-auto">
                    {pkgNewFiles.map((file, i) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-slate-900">
                        {file.type.startsWith('video/') ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white/60" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                          </div>
                        ) : (
                          <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                        )}
                        <button type="button" onClick={() => setPkgNewFiles(prev => prev.filter((_, j) => j !== i))} className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/70 rounded-full flex items-center justify-center">
                          <X size={9} className="text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-background rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">
                  {pkgSelected.length + pkgNewFiles.length} archivo{pkgSelected.length + pkgNewFiles.length !== 1 ? 's' : ''} en el paquete
                </p>
                {pkgName && pkgPrice && pkgSelected.length === 0 && pkgNewFiles.length === 0 && (
                  <p className="text-[10px] text-primary mt-1 font-medium animate-pulse">Agrega al menos una foto para poder guardar</p>
                )}
              </div>

              <button
                onClick={handleCreatePackage}
                disabled={uploading || !pkgName || !pkgPrice || (pkgSelected.length === 0 && pkgNewFiles.length === 0)}
                className="w-full bg-primary text-primary-foreground p-3 rounded-lg font-bold disabled:opacity-50"
              >
                {uploading ? (uploadStatus || 'Guardando...') : 'GUARDAR Y CREAR PAQUETE'}
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Package edit modal */}
      <AnimatePresence>
        {editingPackage && packages[editingPackage] && (
          <Modal onClose={() => { setEditingPackage(null); setPkgNewFiles([]); }}>
            <h3 className="font-serif text-lg text-foreground mb-4">Editar paquete</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground">Nombre del paquete</label>
                <input className="w-full bg-background border border-border rounded-lg p-3 text-foreground outline-none text-sm mt-1" value={editPkgName} onChange={e => setEditPkgName(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Precio del paquete completo</label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-muted-foreground">★</span>
                  <input type="number" className="flex-1 bg-background border border-border rounded-lg p-3 text-foreground font-bold outline-none" value={editPkgPrice} onChange={e => setEditPkgPrice(e.target.value)} />
                  <span className="text-muted-foreground text-sm">Stars</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Fotos en este paquete</label>
                <div className="grid grid-cols-3 gap-2">
                  {packages[editingPackage].map(item => (
                    <div key={item.id} className="relative aspect-square rounded-lg overflow-hidden bg-slate-900">
                      {item.type === 'video' ? (
                        <div className="w-full h-full flex items-center justify-center bg-slate-800">
                          <svg className="w-8 h-8 text-white/60 fill-white/60" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                      ) : (
                        <img src={item.file_url || item.thumbnail_url || ''} alt="" className="w-full h-full object-cover" />
                      )}
                      <button
                        onClick={async () => {
                          if (packages[editingPackage].length <= 1) { alert('Un paquete necesita al menos 1 foto. Elimina el paquete completo si quieres.'); return; }
                          await handleRemoveFromPackage(item.id);
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Agregar mas fotos</label>
                <label className="block bg-background border border-dashed border-border rounded-lg p-3 text-center cursor-pointer text-sm text-muted-foreground">
                  <Plus size={16} className="inline mr-1" />
                  {pkgNewFiles.length > 0 ? `${pkgNewFiles.length} archivo${pkgNewFiles.length > 1 ? 's' : ''} seleccionado` : 'Seleccionar fotos o videos'}
                  <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={e => { if (e.target.files) setPkgNewFiles(prev => [...prev, ...Array.from(e.target.files!)]); }} />
                </label>
                {pkgNewFiles.length > 0 && (
                  <div className="grid grid-cols-4 gap-1.5 mt-2">
                    {pkgNewFiles.map((file, i) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-slate-900">
                        {file.type.startsWith('video/') ? (
                          <div className="w-full h-full flex items-center justify-center bg-slate-800">
                            <svg className="w-6 h-6 text-white/60 fill-white/60" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                          </div>
                        ) : (
                          <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                        )}
                        <button onClick={() => setPkgNewFiles(prev => prev.filter((_, j) => j !== i))} className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button onClick={handleUpdatePackage} disabled={uploading || !editPkgName || !editPkgPrice} className="flex-1 bg-primary text-primary-foreground p-3 rounded-lg font-bold text-sm disabled:opacity-50">
                  {uploading ? 'Guardando...' : 'GUARDAR CAMBIOS'}
                </button>
                <button onClick={() => handleDeletePackage(editingPackage)} className="px-4 p-3 rounded-lg bg-red-500/20 text-red-400 font-bold text-sm">
                  <Trash2 size={16} />
                </button>
              </div>

              {pkgNewFiles.length > 0 && (
                <p className="text-[10px] text-muted-foreground text-center">* Las nuevas fotos se subirán al guardar los cambios</p>
              )}
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
