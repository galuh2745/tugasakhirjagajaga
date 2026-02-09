'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { StaggerContainer, StaggerItem } from '@/components/ui/page-transition';

const selectClass = 'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50';

interface Perusahaan { id: string; nama_perusahaan: string; }
interface StokPerusahaan { perusahaan_id: string; nama_perusahaan: string; total_masuk: number; total_mati: number; total_keluar: number; stok_ayam_hidup: number; }
interface BarangKeluarAyamHidup {
  id: string; perusahaan_id: string; perusahaan: Perusahaan; tanggal: string; nama_customer: string;
  jumlah_ekor: number; total_kg: number; jenis_daging: 'JUMBO' | 'BESAR' | 'KECIL'; harga_per_kg: number;
  total_penjualan: number; pengeluaran: number; total_bersih: number; created_at: string;
}

export default function BarangKeluarAyamHidupPage() {
  const [data, setData] = useState<BarangKeluarAyamHidup[]>([]);
  const [perusahaanList, setPerusahaanList] = useState<Perusahaan[]>([]);
  const [stokList, setStokList] = useState<StokPerusahaan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPerusahaan, setFilterPerusahaan] = useState('');
  const [filterTanggalDari, setFilterTanggalDari] = useState('');
  const [filterTanggalSampai, setFilterTanggalSampai] = useState('');
  const [filterSearch, setFilterSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedData, setSelectedData] = useState<BarangKeluarAyamHidup | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    perusahaan_id: '', tanggal: '', nama_customer: '', jumlah_ekor: '', total_kg: '',
    jenis_daging: 'BESAR' as 'JUMBO' | 'BESAR' | 'KECIL', harga_per_kg: '', pengeluaran: ''
  });

  useEffect(() => { fetchPerusahaan(); fetchStok(); }, []);
  useEffect(() => { fetchData(); }, [filterPerusahaan, filterTanggalDari, filterTanggalSampai, filterSearch]);

  const fetchPerusahaan = async () => { try { const r = await fetch('/api/inventory/perusahaan', { credentials: 'include' }); const res = await r.json(); if (res.success) setPerusahaanList(res.data); } catch {} };
  const fetchStok = async () => { try { const r = await fetch('/api/inventory/stok', { credentials: 'include' }); const res = await r.json(); if (res.success) setStokList(res.data?.per_perusahaan || []); } catch {} };
  const fetchData = async () => {
    try { setLoading(true); const p = new URLSearchParams(); if (filterPerusahaan) p.set('perusahaan_id', filterPerusahaan); if (filterTanggalDari) p.set('tanggal_dari', filterTanggalDari); if (filterTanggalSampai) p.set('tanggal_sampai', filterTanggalSampai); if (filterSearch) p.set('search', filterSearch);
      const r = await fetch(`/api/inventory/barang-keluar/ayam-hidup?${p}`, { credentials: 'include' }); const res = await r.json(); if (res.success) setData(res.data); else toast.error(res.error);
    } catch { toast.error('Terjadi kesalahan'); } finally { setLoading(false); }
  };

  const getStokForPerusahaan = (pid: string) => stokList.find(s => s.perusahaan_id === pid);

  const openAddModal = () => {
    setModalMode('add'); setSelectedData(null);
    setFormData({ perusahaan_id: '', tanggal: new Date().toISOString().split('T')[0], nama_customer: '', jumlah_ekor: '', total_kg: '', jenis_daging: 'BESAR', harga_per_kg: '', pengeluaran: '' });
    setShowModal(true);
  };
  const openEditModal = (item: BarangKeluarAyamHidup) => {
    setModalMode('edit'); setSelectedData(item);
    setFormData({ perusahaan_id: item.perusahaan_id, tanggal: item.tanggal, nama_customer: item.nama_customer, jumlah_ekor: item.jumlah_ekor.toString(), total_kg: item.total_kg.toString(), jenis_daging: item.jenis_daging, harga_per_kg: item.harga_per_kg.toString(), pengeluaran: item.pengeluaran.toString() });
    setShowModal(true);
  };

  const calculatedTotalPenjualan = useMemo(() => (parseFloat(formData.total_kg) || 0) * (parseFloat(formData.harga_per_kg) || 0), [formData.total_kg, formData.harga_per_kg]);
  const calculatedTotalBersih = useMemo(() => calculatedTotalPenjualan - (parseFloat(formData.pengeluaran) || 0), [calculatedTotalPenjualan, formData.pengeluaran]);

  const summary = useMemo(() => ({
    totalEkor: data.reduce((s, d) => s + d.jumlah_ekor, 0),
    totalKg: data.reduce((s, d) => s + d.total_kg, 0),
    totalPenjualan: data.reduce((s, d) => s + d.total_penjualan, 0),
    totalPengeluaran: data.reduce((s, d) => s + d.pengeluaran, 0),
    totalBersih: data.reduce((s, d) => s + d.total_bersih, 0),
  }), [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const method = modalMode === 'add' ? 'POST' : 'PUT';
      const body = { ...(modalMode === 'edit' && { id: selectedData?.id }), ...formData, jumlah_ekor: parseInt(formData.jumlah_ekor) || 0, total_kg: parseFloat(formData.total_kg) || 0, harga_per_kg: parseFloat(formData.harga_per_kg) || 0, pengeluaran: parseFloat(formData.pengeluaran) || 0 };
      const r = await fetch('/api/inventory/barang-keluar/ayam-hidup', { method, headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) });
      const res = await r.json(); if (res.success) { toast.success('Data berhasil disimpan'); setShowModal(false); fetchData(); fetchStok(); } else toast.error(res.error);
    } catch { toast.error('Terjadi kesalahan'); } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return;
    try { const r = await fetch(`/api/inventory/barang-keluar/ayam-hidup?id=${id}`, { method: 'DELETE', credentials: 'include' }); const res = await r.json(); if (res.success) { toast.success('Data berhasil dihapus'); fetchData(); fetchStok(); } else toast.error(res.error); } catch { toast.error('Terjadi kesalahan'); }
  };

  const fmtC = (v: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
  const fmtN = (v: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(v);
  const stokForForm = formData.perusahaan_id ? getStokForPerusahaan(formData.perusahaan_id) : null;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-bold text-foreground">Barang Keluar - Ayam Hidup</h1><p className="text-muted-foreground text-sm mt-1">Pencatatan penjualan ayam hidup</p></div>

      <StaggerContainer className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StaggerItem><Card className="border-l-4 border-l-indigo-500"><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Total Ekor</p><p className="text-xl font-bold text-indigo-600 mt-1">{fmtN(summary.totalEkor)}</p></CardContent></Card></StaggerItem>
        <StaggerItem><Card className="border-l-4 border-l-purple-500"><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Total Kg</p><p className="text-xl font-bold text-purple-600 mt-1">{fmtN(summary.totalKg)}</p></CardContent></Card></StaggerItem>
        <StaggerItem><Card className="border-l-4 border-l-blue-500"><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Total Penjualan</p><p className="text-xl font-bold text-blue-600 mt-1">{fmtC(summary.totalPenjualan)}</p></CardContent></Card></StaggerItem>
        <StaggerItem><Card className="border-l-4 border-l-red-500"><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Pengeluaran</p><p className="text-xl font-bold text-red-600 mt-1">{fmtC(summary.totalPengeluaran)}</p></CardContent></Card></StaggerItem>
        <StaggerItem><Card className="border-l-4 border-l-emerald-500"><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Total Bersih</p><p className={`text-xl font-bold mt-1 ${summary.totalBersih >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmtC(summary.totalBersih)}</p></CardContent></Card></StaggerItem>
      </StaggerContainer>

      <Card><CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="space-y-2"><Label>Perusahaan</Label><select value={filterPerusahaan} onChange={(e) => setFilterPerusahaan(e.target.value)} className={selectClass}><option value="">Semua</option>{perusahaanList.map(p => <option key={p.id} value={p.id}>{p.nama_perusahaan}</option>)}</select></div>
          <div className="space-y-2"><Label>Tanggal Dari</Label><input type="date" value={filterTanggalDari} onChange={(e) => setFilterTanggalDari(e.target.value)} className={selectClass} /></div>
          <div className="space-y-2"><Label>Tanggal Sampai</Label><input type="date" value={filterTanggalSampai} onChange={(e) => setFilterTanggalSampai(e.target.value)} className={selectClass} /></div>
          <div className="space-y-2"><Label>Cari Customer</Label><Input placeholder="Nama customer..." value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} /></div>
          <div className="flex items-end"><Button className="w-full" onClick={openAddModal}><Plus className="w-4 h-4 mr-2" /> Tambah Data</Button></div>
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Tanggal</TableHead><TableHead>Perusahaan</TableHead><TableHead>Customer</TableHead><TableHead className="text-right">Ekor</TableHead><TableHead className="text-right">Kg</TableHead><TableHead>Jenis</TableHead><TableHead className="text-right">Harga/kg</TableHead><TableHead className="text-right">Penjualan</TableHead><TableHead className="text-right">Pengeluaran</TableHead><TableHead className="text-right">Bersih</TableHead><TableHead>Aksi</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={11} className="text-center py-8 text-muted-foreground">Memuat data...</TableCell></TableRow>
              : data.length === 0 ? <TableRow><TableCell colSpan={11} className="text-center py-8 text-muted-foreground">Belum ada data</TableCell></TableRow>
              : data.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="whitespace-nowrap">{item.tanggal}</TableCell>
                  <TableCell>{item.perusahaan.nama_perusahaan}</TableCell>
                  <TableCell>{item.nama_customer}</TableCell>
                  <TableCell className="text-right">{fmtN(item.jumlah_ekor)}</TableCell>
                  <TableCell className="text-right">{fmtN(item.total_kg)}</TableCell>
                  <TableCell><span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${item.jenis_daging === 'JUMBO' ? 'bg-purple-50 text-purple-700' : item.jenis_daging === 'BESAR' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>{item.jenis_daging}</span></TableCell>
                  <TableCell className="text-right">{fmtC(item.harga_per_kg)}</TableCell>
                  <TableCell className="text-right">{fmtC(item.total_penjualan)}</TableCell>
                  <TableCell className="text-right text-red-600">{fmtC(item.pengeluaran)}</TableCell>
                  <TableCell className={`text-right font-medium ${item.total_bersih >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmtC(item.total_bersih)}</TableCell>
                  <TableCell><div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => openEditModal(item)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => handleDelete(item.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent></Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{modalMode === 'add' ? 'Tambah Barang Keluar Ayam Hidup' : 'Edit Barang Keluar Ayam Hidup'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label>Perusahaan <span className="text-red-500">*</span></Label><select value={formData.perusahaan_id} onChange={(e) => setFormData({ ...formData, perusahaan_id: e.target.value })} className={selectClass} required><option value="">Pilih Perusahaan</option>{perusahaanList.map(p => <option key={p.id} value={p.id}>{p.nama_perusahaan}</option>)}</select></div>
            {stokForForm && (
              <div className="rounded-md border border-blue-200 bg-blue-50/50 p-3 text-sm">
                <p className="font-medium text-blue-800">Stok Tersedia:</p>
                <p className="text-blue-700">Stok Ayam Hidup: {fmtN(stokForForm.stok_ayam_hidup)} ekor</p>
                {formData.jumlah_ekor && parseInt(formData.jumlah_ekor) > stokForForm.stok_ayam_hidup && (
                  <div className="flex items-center gap-1 mt-1 text-amber-600"><AlertTriangle className="w-3.5 h-3.5" /><span className="text-xs">Jumlah melebihi stok!</span></div>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Tanggal <span className="text-red-500">*</span></Label><input type="date" value={formData.tanggal} onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })} className={selectClass} required /></div>
              <div className="space-y-2"><Label>Nama Customer <span className="text-red-500">*</span></Label><Input value={formData.nama_customer} onChange={(e) => setFormData({ ...formData, nama_customer: e.target.value })} required /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Jumlah Ekor <span className="text-red-500">*</span></Label><Input type="number" value={formData.jumlah_ekor} onChange={(e) => setFormData({ ...formData, jumlah_ekor: e.target.value })} required min={1} /></div>
              <div className="space-y-2"><Label>Total Kg <span className="text-red-500">*</span></Label><Input type="number" step="0.01" value={formData.total_kg} onChange={(e) => setFormData({ ...formData, total_kg: e.target.value })} required /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Jenis Daging <span className="text-red-500">*</span></Label><select value={formData.jenis_daging} onChange={(e) => setFormData({ ...formData, jenis_daging: e.target.value as 'JUMBO' | 'BESAR' | 'KECIL' })} className={selectClass} required><option value="JUMBO">Jumbo</option><option value="BESAR">Besar</option><option value="KECIL">Kecil</option></select></div>
              <div className="space-y-2"><Label>Harga per Kg <span className="text-red-500">*</span></Label><Input type="number" value={formData.harga_per_kg} onChange={(e) => setFormData({ ...formData, harga_per_kg: e.target.value })} required /></div>
            </div>
            <div className="space-y-2"><Label>Pengeluaran</Label><Input type="number" value={formData.pengeluaran} onChange={(e) => setFormData({ ...formData, pengeluaran: e.target.value })} min={0} /></div>

            <Card className="bg-muted/50"><CardContent className="pt-4 space-y-1 text-sm">
              <div className="flex justify-between"><span>Total Penjualan:</span><span className="font-bold text-blue-600">{fmtC(calculatedTotalPenjualan)}</span></div>
              <div className="flex justify-between"><span>Pengeluaran:</span><span className="text-red-600">{fmtC(parseFloat(formData.pengeluaran) || 0)}</span></div>
              <div className="flex justify-between border-t pt-1"><span className="font-medium">Total Bersih:</span><span className={`font-bold ${calculatedTotalBersih >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmtC(calculatedTotalBersih)}</span></div>
            </CardContent></Card>

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
