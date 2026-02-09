'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, Eye, PlusCircle, MinusCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { StaggerContainer, StaggerItem } from '@/components/ui/page-transition';

const selectClass = 'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50';

interface JenisDaging { id: string; nama_jenis: string; }
interface DetailItem { jenis_daging_id: string; berat_kg: string; harga_per_kg: string; subtotal: number; }
interface BarangKeluarDaging {
  id: string; tanggal: string; nama_customer: string;
  pengeluaran: number; keterangan: string | null; total_penjualan: number; saldo: number;
  details: { id: string; jenis_daging_id: string; jenis_daging: JenisDaging; berat_kg: number; harga_per_kg: number; subtotal: number }[];
  created_at: string;
}

export default function BarangKeluarDagingPage() {
  const [data, setData] = useState<BarangKeluarDaging[]>([]);
  const [jenisDagingList, setJenisDagingList] = useState<JenisDaging[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterTanggalDari, setFilterTanggalDari] = useState('');
  const [filterTanggalSampai, setFilterTanggalSampai] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedData, setSelectedData] = useState<BarangKeluarDaging | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [viewingData, setViewingData] = useState<BarangKeluarDaging | null>(null);
  const [formHeader, setFormHeader] = useState({ tanggal: '', nama_customer: '', pengeluaran: '', keterangan: '' });
  const [formDetails, setFormDetails] = useState<DetailItem[]>([{ jenis_daging_id: '', berat_kg: '', harga_per_kg: '', subtotal: 0 }]);

  useEffect(() => { fetchJenisDaging(); }, []);
  useEffect(() => { fetchData(); }, [filterCustomer, filterTanggalDari, filterTanggalSampai]);


  const fetchJenisDaging = async () => { try { const r = await fetch('/api/inventory/jenis-daging?aktif=true', { credentials: 'include' }); const res = await r.json(); if (res.success) setJenisDagingList(res.data); } catch {} };
  const fetchData = async () => {
    try { setLoading(true); const p = new URLSearchParams(); if (filterCustomer) p.set('customer', filterCustomer); if (filterTanggalDari) p.set('tanggal_dari', filterTanggalDari); if (filterTanggalSampai) p.set('tanggal_sampai', filterTanggalSampai);
      const r = await fetch(`/api/inventory/barang-keluar/daging?${p}`, { credentials: 'include' }); const res = await r.json(); if (res.success) setData(res.data); else toast.error(res.error);
    } catch { toast.error('Terjadi kesalahan'); } finally { setLoading(false); }
  };

  const openAddModal = () => {
    setModalMode('add'); setSelectedData(null);
    setFormHeader({ tanggal: new Date().toISOString().split('T')[0], nama_customer: '', pengeluaran: '', keterangan: '' });
    setFormDetails([{ jenis_daging_id: '', berat_kg: '', harga_per_kg: '', subtotal: 0 }]);
    setShowModal(true);
  };

  const openEditModal = (item: BarangKeluarDaging) => {
    setModalMode('edit'); setSelectedData(item);
    setFormHeader({ tanggal: item.tanggal, nama_customer: item.nama_customer, pengeluaran: item.pengeluaran.toString(), keterangan: item.keterangan || '' });
    setFormDetails(item.details.map(d => ({ jenis_daging_id: d.jenis_daging_id || d.jenis_daging.id, berat_kg: d.berat_kg.toString(), harga_per_kg: d.harga_per_kg.toString(), subtotal: d.subtotal })));
    setShowModal(true);
  };

  const addDetailRow = () => setFormDetails([...formDetails, { jenis_daging_id: '', berat_kg: '', harga_per_kg: '', subtotal: 0 }]);
  const removeDetailRow = (idx: number) => { if (formDetails.length > 1) setFormDetails(formDetails.filter((_, i) => i !== idx)); };
  const updateDetail = (idx: number, field: string, value: string) => {
    const updated = [...formDetails]; (updated[idx] as unknown as Record<string, string | number>)[field] = value;
    const berat = parseFloat(updated[idx].berat_kg) || 0;
    const harga = parseFloat(updated[idx].harga_per_kg) || 0;
    updated[idx].subtotal = berat * harga;
    setFormDetails(updated);
  };

  const calculatedTotal = useMemo(() => formDetails.reduce((s, d) => s + d.subtotal, 0), [formDetails]);
  const calculatedSaldo = useMemo(() => calculatedTotal - (parseFloat(formHeader.pengeluaran) || 0), [calculatedTotal, formHeader.pengeluaran]);

  const summary = useMemo(() => ({
    totalPenjualan: data.reduce((s, d) => s + d.total_penjualan, 0),
    totalPengeluaran: data.reduce((s, d) => s + d.pengeluaran, 0),
    totalSaldo: data.reduce((s, d) => s + d.saldo, 0),
  }), [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const method = modalMode === 'add' ? 'POST' : 'PUT';
      const body = { ...(modalMode === 'edit' && { id: selectedData?.id }), ...formHeader, pengeluaran: parseFloat(formHeader.pengeluaran) || 0, details: formDetails.map(d => ({ jenis_daging_id: d.jenis_daging_id, berat_kg: parseFloat(d.berat_kg) || 0, harga_per_kg: parseFloat(d.harga_per_kg) || 0 })) };
      const r = await fetch('/api/inventory/barang-keluar/daging', { method, headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) });
      const res = await r.json(); if (res.success) { toast.success('Data berhasil disimpan'); setShowModal(false); fetchData(); } else toast.error(res.error);
    } catch { toast.error('Terjadi kesalahan'); } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return;
    try { const r = await fetch(`/api/inventory/barang-keluar/daging?id=${id}`, { method: 'DELETE', credentials: 'include' }); const res = await r.json(); if (res.success) { toast.success('Data berhasil dihapus'); fetchData(); } else toast.error(res.error); } catch { toast.error('Terjadi kesalahan'); }
  };

  const fmtC = (v: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
  const fmtN = (v: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(v);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-bold text-foreground">Barang Keluar - Daging</h1><p className="text-muted-foreground text-sm mt-1">Pencatatan penjualan daging keluar</p></div>

      <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StaggerItem><Card className="border-l-4 border-l-blue-500"><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total Penjualan</p><p className="text-2xl font-bold text-blue-600 mt-1">{fmtC(summary.totalPenjualan)}</p></CardContent></Card></StaggerItem>
        <StaggerItem><Card className="border-l-4 border-l-red-500"><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total Pengeluaran</p><p className="text-2xl font-bold text-red-600 mt-1">{fmtC(summary.totalPengeluaran)}</p></CardContent></Card></StaggerItem>
        <StaggerItem><Card className="border-l-4 border-l-emerald-500"><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total Saldo</p><p className={`text-2xl font-bold mt-1 ${summary.totalSaldo >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmtC(summary.totalSaldo)}</p></CardContent></Card></StaggerItem>
      </StaggerContainer>

      <Card><CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2"><Label>Customer</Label><Input placeholder="Cari customer..." value={filterCustomer} onChange={(e) => setFilterCustomer(e.target.value)} /></div>
          <div className="space-y-2"><Label>Tanggal Dari</Label><input type="date" value={filterTanggalDari} onChange={(e) => setFilterTanggalDari(e.target.value)} className={selectClass} /></div>
          <div className="space-y-2"><Label>Tanggal Sampai</Label><input type="date" value={filterTanggalSampai} onChange={(e) => setFilterTanggalSampai(e.target.value)} className={selectClass} /></div>
          <div className="flex items-end"><Button className="w-full" onClick={openAddModal}><Plus className="w-4 h-4 mr-2" /> Tambah Data</Button></div>
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Tanggal</TableHead><TableHead>Customer</TableHead><TableHead className="text-right">Penjualan</TableHead><TableHead className="text-right">Pengeluaran</TableHead><TableHead className="text-right">Saldo</TableHead><TableHead>Aksi</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Memuat data...</TableCell></TableRow>
            : data.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Belum ada data</TableCell></TableRow>
            : data.map(item => (
              <TableRow key={item.id}>
                <TableCell className="whitespace-nowrap">{item.tanggal}</TableCell>
                <TableCell>{item.nama_customer}</TableCell>
                <TableCell className="text-right">{fmtC(item.total_penjualan)}</TableCell>
                <TableCell className="text-right text-red-600">{fmtC(item.pengeluaran)}</TableCell>
                <TableCell className={`text-right font-medium ${item.saldo >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmtC(item.saldo)}</TableCell>
                <TableCell><div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600" onClick={() => { setViewingData(item); setShowDetailModal(true); }}><Eye className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => openEditModal(item)}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => handleDelete(item.id)}><Trash2 className="w-4 h-4" /></Button>
                </div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      {/* Detail View Dialog */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Detail Penjualan</DialogTitle></DialogHeader>
          {viewingData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Tanggal:</span> <span className="font-medium">{viewingData.tanggal}</span></div>
                <div><span className="text-muted-foreground">Customer:</span> <span className="font-medium">{viewingData.nama_customer}</span></div>
                <div><span className="text-muted-foreground">Keterangan:</span> <span className="font-medium">{viewingData.keterangan || '-'}</span></div>
              </div>
              <Table>
                <TableHeader><TableRow><TableHead>Jenis Daging</TableHead><TableHead className="text-right">Berat (kg)</TableHead><TableHead className="text-right">Harga/kg</TableHead><TableHead className="text-right">Subtotal</TableHead></TableRow></TableHeader>
                <TableBody>
                  {viewingData.details.map((d, i) => (
                    <TableRow key={i}><TableCell>{d.jenis_daging.nama_jenis}</TableCell><TableCell className="text-right">{fmtN(d.berat_kg)}</TableCell><TableCell className="text-right">{fmtC(d.harga_per_kg)}</TableCell><TableCell className="text-right">{fmtC(d.subtotal)}</TableCell></TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow><TableCell colSpan={3} className="text-right font-medium">Total Penjualan</TableCell><TableCell className="text-right font-bold text-blue-600">{fmtC(viewingData.total_penjualan)}</TableCell></TableRow>
                  <TableRow><TableCell colSpan={3} className="text-right font-medium">Pengeluaran</TableCell><TableCell className="text-right text-red-600">{fmtC(viewingData.pengeluaran)}</TableCell></TableRow>
                  <TableRow><TableCell colSpan={3} className="text-right font-medium">Saldo</TableCell><TableCell className={`text-right font-bold ${viewingData.saldo >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmtC(viewingData.saldo)}</TableCell></TableRow>
                </TableFooter>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{modalMode === 'add' ? 'Tambah Barang Keluar Daging' : 'Edit Barang Keluar Daging'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Tanggal <span className="text-red-500">*</span></Label><input type="date" value={formHeader.tanggal} onChange={(e) => setFormHeader({ ...formHeader, tanggal: e.target.value })} className={selectClass} required /></div>
              <div className="space-y-2"><Label>Nama Customer <span className="text-red-500">*</span></Label><Input value={formHeader.nama_customer} onChange={(e) => setFormHeader({ ...formHeader, nama_customer: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Pengeluaran</Label><Input type="number" value={formHeader.pengeluaran} onChange={(e) => setFormHeader({ ...formHeader, pengeluaran: e.target.value })} min={0} /></div>
            </div>
            <div className="space-y-2"><Label>Keterangan</Label><Textarea value={formHeader.keterangan} onChange={(e) => setFormHeader({ ...formHeader, keterangan: e.target.value })} rows={2} /></div>

            <div className="space-y-3">
              <div className="flex items-center justify-between"><Label className="text-base font-semibold">Detail Daging</Label><Button type="button" variant="outline" size="sm" onClick={addDetailRow}><PlusCircle className="w-4 h-4 mr-1" /> Tambah Baris</Button></div>
              {formDetails.map((d, idx) => (
                <Card key={idx} className="p-3"><div className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-3 space-y-1"><Label className="text-xs">Jenis Daging</Label><select value={d.jenis_daging_id} onChange={(e) => updateDetail(idx, 'jenis_daging_id', e.target.value)} className={selectClass} required><option value="">Pilih</option>{jenisDagingList.map(j => <option key={j.id} value={j.id}>{j.nama_jenis}</option>)}</select></div>
                  <div className="col-span-2 space-y-1"><Label className="text-xs">Berat (kg)</Label><Input type="number" step="0.01" value={d.berat_kg} onChange={(e) => updateDetail(idx, 'berat_kg', e.target.value)} required /></div>
                  <div className="col-span-3 space-y-1"><Label className="text-xs">Harga/kg</Label><Input type="number" value={d.harga_per_kg} onChange={(e) => updateDetail(idx, 'harga_per_kg', e.target.value)} required /></div>
                  <div className="col-span-3 space-y-1"><Label className="text-xs">Subtotal</Label><p className="text-sm font-medium py-2">{fmtC(d.subtotal)}</p></div>
                  <div className="col-span-1 flex justify-center">{formDetails.length > 1 && <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => removeDetailRow(idx)}><MinusCircle className="w-4 h-4" /></Button>}</div>
                </div></Card>
              ))}
            </div>

            <Card className="bg-muted/50"><CardContent className="pt-4 space-y-1 text-sm">
              <div className="flex justify-between"><span>Total Penjualan:</span><span className="font-bold text-blue-600">{fmtC(calculatedTotal)}</span></div>
              <div className="flex justify-between"><span>Pengeluaran:</span><span className="text-red-600">{fmtC(parseFloat(formHeader.pengeluaran) || 0)}</span></div>
              <div className="flex justify-between border-t pt-1"><span className="font-medium">Saldo:</span><span className={`font-bold ${calculatedSaldo >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmtC(calculatedSaldo)}</span></div>
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
