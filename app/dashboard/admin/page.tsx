'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Users, CheckCircle, CalendarDays, Clock, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { StaggerContainer, StaggerItem } from '@/components/ui/page-transition';

interface Ringkasan {
  total_karyawan_aktif: number;
  jumlah_hadir_hari_ini: number;
  jumlah_izin_cuti_hari_ini: number;
  jumlah_lembur_hari_ini: number;
}

interface Kehadiran {
  id: string;
  karyawan_id: string;
  karyawan_nama: string;
  karyawan_nip: string;
  jenis_karyawan: string;
  tanggal: string;
  jam_masuk: string | null;
  jam_pulang: string | null;
  status: string;
}

interface Karyawan {
  id: string;
  nama: string;
  nip: string;
}

interface DashboardData {
  ringkasan: Ringkasan;
  kehadiran_harian: Kehadiran[];
  daftar_karyawan: Karyawan[];
  filter: {
    tanggal: string;
    karyawan_id: string | null;
    status: string | null;
  };
}

const statusVariant = (status: string) => {
  const map: Record<string, string> = {
    HADIR: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    TERLAMBAT: 'bg-amber-50 text-amber-700 border-amber-200',
    IZIN: 'bg-blue-50 text-blue-700 border-blue-200',
    CUTI: 'bg-purple-50 text-purple-700 border-purple-200',
    SAKIT: 'bg-orange-50 text-orange-700 border-orange-200',
    ALPHA: 'bg-red-50 text-red-700 border-red-200',
  };
  return map[status] || 'bg-gray-50 text-gray-700 border-gray-200';
};

export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getLocalDateString = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  const [filterTanggal, setFilterTanggal] = useState(getLocalDateString());
  const [filterKaryawan, setFilterKaryawan] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterTanggal) params.append('tanggal', filterTanggal);
      if (filterKaryawan) params.append('karyawan_id', filterKaryawan);
      if (filterStatus) params.append('status', filterStatus);

      const response = await fetch(`/api/dashboard/admin?${params.toString()}`, { credentials: 'include' });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch data');
      }

      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error);
        toast.error(result.error);
      }
    } catch (err) {
      setError('Gagal memuat data dashboard');
      toast.error('Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterTanggal, filterKaryawan, filterStatus]);

  const formatTime = (time: string | null) => {
    if (!time) return '-';
    const date = new Date(time);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <LoadingSpinner text="Memuat dashboard..." />;

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <p className="text-destructive">{error}</p>
          <Button onClick={fetchData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  const summaryCards = [
    { label: 'Total Karyawan', value: data?.ringkasan.total_karyawan_aktif, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Hadir Hari Ini', value: data?.ringkasan.jumlah_hadir_hari_ini, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Izin/Cuti Hari Ini', value: data?.ringkasan.jumlah_izin_cuti_hari_ini, icon: CalendarDays, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Lembur Hari Ini', value: data?.ringkasan.jumlah_lembur_hari_ini, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard Admin</h1>
        <p className="text-muted-foreground text-sm mt-1">Monitoring Kehadiran Karyawan</p>
      </div>

      {/* Summary Cards */}
      <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((item) => (
          <StaggerItem key={item.label}>
            <Card>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className={`w-12 h-12 ${item.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <item.icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="text-2xl font-bold text-foreground">{item.value ?? 0}</p>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filter Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tanggal</Label>
              <Input type="date" value={filterTanggal} onChange={(e) => setFilterTanggal(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Karyawan</Label>
              <select
                value={filterKaryawan}
                onChange={(e) => setFilterKaryawan(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <option value="">Semua Karyawan</option>
                {data?.daftar_karyawan.map((k) => (
                  <option key={k.id} value={k.id}>{k.nama} ({k.nip})</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <option value="">Semua Status</option>
                <option value="HADIR">Hadir</option>
                <option value="TERLAMBAT">Terlambat</option>
                <option value="IZIN">Izin</option>
                <option value="CUTI">Cuti</option>
                <option value="SAKIT">Sakit</option>
                <option value="ALPHA">Alpha</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Monitoring Kehadiran Harian</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NIP</TableHead>
                <TableHead>Nama Karyawan</TableHead>
                <TableHead>Jenis Karyawan</TableHead>
                <TableHead>Jam Masuk</TableHead>
                <TableHead>Jam Pulang</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.kehadiran_harian.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Tidak ada data kehadiran
                  </TableCell>
                </TableRow>
              ) : (
                data?.kehadiran_harian.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm">{item.karyawan_nip}</TableCell>
                    <TableCell className="font-medium">{item.karyawan_nama}</TableCell>
                    <TableCell className="text-muted-foreground">{item.jenis_karyawan}</TableCell>
                    <TableCell className="text-muted-foreground">{formatTime(item.jam_masuk)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatTime(item.jam_pulang)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusVariant(item.status)}`}>
                        {item.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
