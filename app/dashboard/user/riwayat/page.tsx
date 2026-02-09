'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface RiwayatAbsensi {
  id: string;
  tanggal: string;
  jam_masuk: string | null;
  jam_pulang: string | null;
  status: string;
}

const selectClass = 'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50';

const statusMap: Record<string, { cls: string; label: string }> = {
  HADIR: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Hadir' },
  TERLAMBAT: { cls: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Terlambat' },
  IZIN: { cls: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Izin' },
  CUTI: { cls: 'bg-purple-50 text-purple-700 border-purple-200', label: 'Cuti' },
  SAKIT: { cls: 'bg-orange-50 text-orange-700 border-orange-200', label: 'Sakit' },
  ALPHA: { cls: 'bg-red-50 text-red-700 border-red-200', label: 'Alpha' },
};

export default function RiwayatAbsensiPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [riwayat, setRiwayat] = useState<RiwayatAbsensi[]>([]);
  const [filterBulan, setFilterBulan] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/dashboard/user', { credentials: 'include' });
        if (res.status === 401) { router.push('/login'); return; }
        const data = await res.json();
        if (data.success) setRiwayat(data.data.riwayat.absensi || []);
      } catch (error) { console.error('Fetch error:', error); } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  const formatTime = (t: string | null) => t ? new Date(t).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';

  const filteredRiwayat = filterBulan ? riwayat.filter(i => i.tanggal.startsWith(filterBulan)) : riwayat;
  const uniqueMonths = Array.from(new Set(riwayat.map(i => i.tanggal.substring(0, 7)))).sort().reverse();

  if (loading) return <LoadingSpinner text="Memuat data..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Riwayat Absensi</h1>
          <p className="text-muted-foreground text-sm mt-1">Lihat riwayat kehadiran Anda</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="w-4 h-4" />
          <span>Total: <strong className="text-foreground">{filteredRiwayat.length}</strong> data</span>
        </div>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label>Filter Bulan</Label>
              <select value={filterBulan} onChange={(e) => setFilterBulan(e.target.value)} className={selectClass}>
                <option value="">Semua Bulan</option>
                {uniqueMonths.map(month => (
                  <option key={month} value={month}>
                    {new Date(month + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                  </option>
                ))}
              </select>
            </div>
            {filterBulan && (
              <Button variant="outline" onClick={() => setFilterBulan('')}>
                <RotateCcw className="w-4 h-4 mr-2" /> Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Masuk</TableHead>
                <TableHead>Pulang</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRiwayat.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                        <CalendarDays className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground text-sm">Tidak ada data absensi</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredRiwayat.map(item => {
                const status = statusMap[item.status] || { cls: 'bg-gray-50 text-gray-700 border-gray-200', label: item.status };
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-sm">{formatDate(item.tanggal)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatTime(item.jam_masuk)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatTime(item.jam_pulang)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border ${status.cls}`}>{status.label}</span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Summary Footer */}
          <div className="px-6 py-4 bg-muted/30 border-t">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Menampilkan <span className="font-medium text-foreground">{filteredRiwayat.length}</span> dari{' '}
                <span className="font-medium text-foreground">{riwayat.length}</span> data
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
