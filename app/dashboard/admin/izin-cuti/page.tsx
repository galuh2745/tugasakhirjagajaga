'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Clock, CheckCircle2, XCircle, Search, RotateCcw, Check, X, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { StaggerContainer, StaggerItem } from '@/components/ui/page-transition';

interface IzinCuti {
  id: string;
  karyawan_id: string;
  karyawan: { id: string; nama: string; nip: string; };
  jenis: 'IZIN' | 'CUTI' | 'SAKIT';
  tanggal_mulai: string;
  tanggal_selesai: string;
  alasan: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
}

const selectClass = 'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50';

const statusVariant = (s: string) => {
  const m: Record<string, string> = { PENDING: 'bg-amber-50 text-amber-700 border-amber-200', APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200', REJECTED: 'bg-red-50 text-red-700 border-red-200' };
  return m[s] || 'bg-gray-50 text-gray-700 border-gray-200';
};
const jenisVariant = (j: string) => {
  const m: Record<string, string> = { IZIN: 'bg-blue-50 text-blue-700 border-blue-200', CUTI: 'bg-purple-50 text-purple-700 border-purple-200', SAKIT: 'bg-orange-50 text-orange-700 border-orange-200' };
  return m[j] || 'bg-gray-50 text-gray-700 border-gray-200';
};

export default function IzinCutiAdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [izinCutiList, setIzinCutiList] = useState<IzinCuti[]>([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/izin-cuti', { credentials: 'include' });
      if (response.status === 401 || response.status === 403) { router.push('/login'); return; }
      const result = await response.json();
      if (result.success) setIzinCutiList(result.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredData = izinCutiList.filter((item) => {
    const matchStatus = !filterStatus || item.status === filterStatus;
    const matchJenis = !filterJenis || item.jenis === filterJenis;
    const matchSearch = !searchTerm || item.karyawan.nama.toLowerCase().includes(searchTerm.toLowerCase()) || item.karyawan.nip.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchJenis && matchSearch;
  });

  const pendingCount = izinCutiList.filter(i => i.status === 'PENDING').length;
  const approvedCount = izinCutiList.filter(i => i.status === 'APPROVED').length;
  const rejectedCount = izinCutiList.filter(i => i.status === 'REJECTED').length;

  const formatDate = (s: string) => new Date(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  const calculateDays = (start: string, end: string) => Math.ceil(Math.abs(new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const handleAction = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    const action = status === 'APPROVED' ? 'menyetujui' : 'menolak';
    if (!confirm(`Apakah Anda yakin ingin ${action} pengajuan ini?`)) return;
    setProcessingId(id);
    try {
      const response = await fetch('/api/izin-cuti/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ izin_cuti_id: id, status }) });
      const result = await response.json();
      if (result.success) { toast.success(`Pengajuan berhasil ${status === 'APPROVED' ? 'disetujui' : 'ditolak'}`); fetchData(); }
      else toast.error(result.error);
    } catch { toast.error('Terjadi kesalahan'); } finally { setProcessingId(null); }
  };

  if (loading) return <LoadingSpinner text="Memuat data..." />;

  const summaryCards = [
    { label: 'Menunggu Persetujuan', value: pendingCount, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100', filter: 'PENDING' },
    { label: 'Disetujui', value: approvedCount, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100', filter: 'APPROVED' },
    { label: 'Ditolak', value: rejectedCount, icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', filter: 'REJECTED' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Izin & Cuti</h1>
        <p className="text-muted-foreground text-sm mt-1">Kelola pengajuan izin dan cuti karyawan</p>
      </div>

      {/* Summary Cards */}
      <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {summaryCards.map(item => (
          <StaggerItem key={item.label}>
            <Card className={`cursor-pointer transition hover:shadow-md ${filterStatus === item.filter ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setFilterStatus(filterStatus === item.filter ? '' : item.filter)}>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className={`w-12 h-12 ${item.bg} rounded-lg flex items-center justify-center`}>
                  <item.icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Cari</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Nama atau NIP..." className="pl-9" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={selectClass}>
                <option value="">Semua Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Disetujui</option>
                <option value="REJECTED">Ditolak</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Jenis</Label>
              <select value={filterJenis} onChange={(e) => setFilterJenis(e.target.value)} className={selectClass}>
                <option value="">Semua Jenis</option>
                <option value="IZIN">Izin</option>
                <option value="CUTI">Cuti</option>
                <option value="SAKIT">Sakit</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="w-full" onClick={() => { setSearchTerm(''); setFilterStatus(''); setFilterJenis(''); }}>
                <RotateCcw className="w-4 h-4 mr-2" /> Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending List */}
      {pendingCount > 0 && !filterStatus && (
        <Card className="border-amber-200">
          <CardHeader className="bg-amber-50/50">
            <CardTitle className="text-base text-amber-800 flex items-center gap-2"><Clock className="w-5 h-5" /> Menunggu Persetujuan ({pendingCount})</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {izinCutiList.filter(i => i.status === 'PENDING').map(item => (
              <div key={item.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold">{item.karyawan.nama}</span>
                    <span className="text-sm text-muted-foreground">({item.karyawan.nip})</span>
                    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border ${jenisVariant(item.jenis)}`}>{item.jenis}</span>
                  </div>
                  <p className="text-sm text-muted-foreground"><strong>Tanggal:</strong> {formatDate(item.tanggal_mulai)} - {formatDate(item.tanggal_selesai)} ({calculateDays(item.tanggal_mulai, item.tanggal_selesai)} hari)</p>
                  <p className="text-sm text-muted-foreground"><strong>Alasan:</strong> {item.alasan}</p>
                  <p className="text-xs text-muted-foreground mt-1">Diajukan: {formatDate(item.created_at)}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleAction(item.id, 'APPROVED')} disabled={processingId === item.id} className="bg-emerald-600 hover:bg-emerald-700">
                    {processingId === item.id ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />} Setujui
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleAction(item.id, 'REJECTED')} disabled={processingId === item.id}>
                    {processingId === item.id ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <X className="w-4 h-4 mr-1" />} Tolak
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* All Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {filterStatus ? `Pengajuan ${filterStatus === 'PENDING' ? 'Pending' : filterStatus === 'APPROVED' ? 'Disetujui' : 'Ditolak'}` : 'Semua Pengajuan'} ({filteredData.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Karyawan</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead className="hidden sm:table-cell">Tanggal</TableHead>
                <TableHead className="hidden md:table-cell">Durasi</TableHead>
                <TableHead className="hidden lg:table-cell">Alasan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Tidak ada data pengajuan</TableCell></TableRow>
              ) : filteredData.map(item => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="text-sm font-medium">{item.karyawan.nama}</div>
                    <div className="text-xs text-muted-foreground">{item.karyawan.nip}</div>
                    <div className="text-xs text-muted-foreground sm:hidden mt-1">{formatDate(item.tanggal_mulai)} ({calculateDays(item.tanggal_mulai, item.tanggal_selesai)} hari)</div>
                  </TableCell>
                  <TableCell><span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border ${jenisVariant(item.jenis)}`}>{item.jenis}</span></TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">{formatDate(item.tanggal_mulai)} - {formatDate(item.tanggal_selesai)}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{calculateDays(item.tanggal_mulai, item.tanggal_selesai)} hari</TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground text-sm max-w-xs truncate">{item.alasan}</TableCell>
                  <TableCell><span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border ${statusVariant(item.status)}`}>{item.status === 'PENDING' ? 'Pending' : item.status === 'APPROVED' ? 'Disetujui' : 'Ditolak'}</span></TableCell>
                  <TableCell>
                    {item.status === 'PENDING' ? (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600" onClick={() => handleAction(item.id, 'APPROVED')} disabled={processingId === item.id}><Check className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => handleAction(item.id, 'REJECTED')} disabled={processingId === item.id}><X className="w-4 h-4" /></Button>
                      </div>
                    ) : <span className="text-muted-foreground">-</span>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
