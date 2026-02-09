'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface JenisDaging { id: string; nama_jenis: string; aktif: boolean; created_at: string; }

export default function JenisDagingPage() {
  const [data, setData] = useState<JenisDaging[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedData, setSelectedData] = useState<JenisDaging | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ nama_jenis: '', aktif: true });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try { setLoading(true); const r = await fetch('/api/inventory/jenis-daging', { credentials: 'include' }); const res = await r.json(); if (res.success) setData(res.data); else toast.error(res.error); } catch { toast.error('Terjadi kesalahan'); } finally { setLoading(false); }
  };

  const openAddModal = () => { setModalMode('add'); setFormData({ nama_jenis: '', aktif: true }); setSelectedData(null); setShowModal(true); };
  const openEditModal = (item: JenisDaging) => { setModalMode('edit'); setFormData({ nama_jenis: item.nama_jenis, aktif: item.aktif }); setSelectedData(item); setShowModal(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const method = modalMode === 'add' ? 'POST' : 'PUT';
      const body = modalMode === 'add' ? { nama_jenis: formData.nama_jenis } : { id: selectedData?.id, nama_jenis: formData.nama_jenis, aktif: formData.aktif };
      const r = await fetch('/api/inventory/jenis-daging', { method, headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) });
      const res = await r.json();
      if (res.success) { toast.success('Data berhasil disimpan'); setShowModal(false); fetchData(); } else toast.error(res.error);
    } catch { toast.error('Terjadi kesalahan'); } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return;
    try { const r = await fetch(`/api/inventory/jenis-daging?id=${id}`, { method: 'DELETE', credentials: 'include' }); const res = await r.json(); if (res.success) { toast.success('Data berhasil dihapus'); fetchData(); } else toast.error(res.error); } catch { toast.error('Terjadi kesalahan'); }
  };

  const toggleAktif = async (item: JenisDaging) => {
    try { const r = await fetch('/api/inventory/jenis-daging', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ id: item.id, aktif: !item.aktif }) }); const res = await r.json(); if (res.success) fetchData(); else toast.error(res.error); } catch { toast.error('Terjadi kesalahan'); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-bold text-foreground">Master Jenis Daging</h1><p className="text-muted-foreground text-sm mt-1">Kelola data jenis daging untuk penjualan</p></div>

      <Card><CardContent className="pt-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Total: <span className="font-semibold text-foreground">{data.length}</span> jenis daging</p>
        <Button onClick={openAddModal}><Plus className="w-4 h-4 mr-2" /> Tambah Jenis Daging</Button>
      </CardContent></Card>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>No</TableHead><TableHead>Nama Jenis Daging</TableHead><TableHead className="text-center">Status</TableHead><TableHead>Aksi</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Memuat data...</TableCell></TableRow>
            ) : data.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Belum ada data jenis daging</TableCell></TableRow>
            ) : data.map((item, idx) => (
              <TableRow key={item.id}>
                <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                <TableCell className="font-medium">{item.nama_jenis}</TableCell>
                <TableCell className="text-center">
                  <button onClick={() => toggleAktif(item)} className={`px-3 py-1 rounded-full text-xs font-medium border ${item.aktif ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'}`}>
                    {item.aktif ? 'Aktif' : 'Nonaktif'}
                  </button>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => openEditModal(item)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => handleDelete(item.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>{modalMode === 'add' ? 'Tambah Jenis Daging' : 'Edit Jenis Daging'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label>Nama Jenis Daging <span className="text-red-500">*</span></Label><Input value={formData.nama_jenis} onChange={(e) => setFormData({ ...formData, nama_jenis: e.target.value })} required placeholder="Contoh: Ceker, Sayap, Dada, dll" /></div>
            {modalMode === 'edit' && <label className="flex items-center gap-2"><input type="checkbox" checked={formData.aktif} onChange={(e) => setFormData({ ...formData, aktif: e.target.checked })} className="w-4 h-4 rounded" /><span className="text-sm">Aktif</span></label>}
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)} disabled={submitting}>Batal</Button>
              <Button type="submit" disabled={submitting}>{submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...</> : 'Simpan'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
