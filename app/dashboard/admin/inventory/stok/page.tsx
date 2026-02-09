'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ArrowUp, ArrowDown, Package, Info, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { StaggerContainer, StaggerItem } from '@/components/ui/page-transition';

interface StokPerPerusahaan {
  perusahaan_id: string;
  nama_perusahaan: string;
  total_masuk: number;
  total_mati: number;
  total_keluar: number;
  stok_ayam_hidup: number;
}

interface StokData {
  per_perusahaan: StokPerPerusahaan[];
  total: { total_masuk: number; total_mati: number; total_keluar: number; stok_ayam_hidup: number };
}

export default function StokAyamPage() {
  const [stokData, setStokData] = useState<StokData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStok = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/inventory/stok', { credentials: 'include' });
      const result = await response.json();
      if (result.success) setStokData(result.data);
      else setError(result.error || 'Gagal memuat data stok');
    } catch { setError('Terjadi kesalahan saat memuat data'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchStok(); }, []);

  const fmt = (v: number) => new Intl.NumberFormat('id-ID').format(v);

  if (loading) return <LoadingSpinner text="Memuat data stok..." />;

  const summaryCards = stokData ? [
    { label: 'Total Masuk', value: stokData.total.total_masuk, icon: ArrowUp, color: 'text-emerald-600', bg: 'bg-emerald-100', prefix: '+', unit: 'ekor' },
    { label: 'Total Mati', value: stokData.total.total_mati, icon: ArrowDown, color: 'text-red-600', bg: 'bg-red-100', prefix: '-', unit: 'ekor' },
    { label: 'Total Keluar', value: stokData.total.total_keluar, icon: ArrowDown, color: 'text-orange-600', bg: 'bg-orange-100', prefix: '-', unit: 'ekor' },
    { label: 'Stok Tersedia', value: stokData.total.stok_ayam_hidup, icon: Package, color: 'text-blue-600', bg: 'bg-blue-100', prefix: '', unit: 'ekor ayam hidup', highlight: true },
  ] : [];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Stok Ayam Hidup</h1>
          <p className="text-muted-foreground text-sm mt-1">Perhitungan stok ayam hidup per perusahaan (otomatis)</p>
        </div>
        <Button variant="outline" onClick={fetchStok}><RotateCcw className="w-4 h-4 mr-2" /> Refresh</Button>
      </div>

      {error && <Card className="border-red-200 bg-red-50"><CardContent className="pt-6 text-red-700">{error}</CardContent></Card>}

      {/* Info */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="pt-6 flex gap-3">
          <Info className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-blue-800">Rumus Perhitungan Stok</p>
            <p className="text-blue-700 mt-1"><strong>STOK</strong> = Total Barang Masuk - Total Ayam Mati - Total Barang Keluar</p>
            <p className="text-xs text-blue-600 mt-1">Stok dihitung secara otomatis dan tidak disimpan di database.</p>
          </div>
        </CardContent>
      </Card>

      {stokData && (
        <>
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {summaryCards.map(item => (
              <StaggerItem key={item.label}>
                <Card className={item.highlight ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' : ''}>
                  <CardContent className="flex items-center gap-3 pt-6">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.highlight ? 'bg-white/20' : item.bg}`}>
                      <item.icon className={`w-5 h-5 ${item.highlight ? 'text-white' : item.color}`} />
                    </div>
                    <div>
                      <p className={`text-sm ${item.highlight ? 'text-white/80' : 'text-muted-foreground'}`}>{item.label}</p>
                      <p className={`text-2xl font-bold ${item.highlight ? 'text-white' : item.color}`}>{item.prefix}{fmt(item.value)}</p>
                      <p className={`text-xs ${item.highlight ? 'text-white/60' : 'text-muted-foreground'}`}>{item.unit}</p>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <Card>
            <CardHeader><CardTitle className="text-base">Stok per Perusahaan</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No</TableHead>
                    <TableHead>Perusahaan</TableHead>
                    <TableHead className="text-right text-emerald-600">Masuk</TableHead>
                    <TableHead className="text-right text-red-600">Mati</TableHead>
                    <TableHead className="text-right text-orange-600">Keluar</TableHead>
                    <TableHead className="text-right text-blue-600">Stok</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stokData.per_perusahaan.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Belum ada data perusahaan</TableCell></TableRow>
                  ) : stokData.per_perusahaan.map((item, idx) => (
                    <TableRow key={item.perusahaan_id}>
                      <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="font-medium">{item.nama_perusahaan}</TableCell>
                      <TableCell className="text-right text-emerald-600 font-medium">+{fmt(item.total_masuk)}</TableCell>
                      <TableCell className="text-right text-red-600 font-medium">-{fmt(item.total_mati)}</TableCell>
                      <TableCell className="text-right text-orange-600 font-medium">-{fmt(item.total_keluar)}</TableCell>
                      <TableCell className="text-right">
                        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-bold ${item.stok_ayam_hidup > 0 ? 'bg-blue-100 text-blue-800' : item.stok_ayam_hidup < 0 ? 'bg-red-100 text-red-800' : 'bg-muted text-muted-foreground'}`}>
                          {fmt(item.stok_ayam_hidup)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell colSpan={2}>TOTAL</TableCell>
                    <TableCell className="text-right text-emerald-600">+{fmt(stokData.total.total_masuk)}</TableCell>
                    <TableCell className="text-right text-red-600">-{fmt(stokData.total.total_mati)}</TableCell>
                    <TableCell className="text-right text-orange-600">-{fmt(stokData.total.total_keluar)}</TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex px-4 py-2 rounded-full text-base font-bold bg-blue-600 text-white">{fmt(stokData.total.stok_ayam_hidup)}</span>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
