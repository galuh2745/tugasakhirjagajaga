'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface RiwayatAbsensi {
  id: string;
  tanggal: string;
  jam_masuk: string | null;
  jam_pulang: string | null;
  status: string;
}

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
        
        if (res.status === 401) {
          router.push('/login');
          return;
        }

        const data = await res.json();
        if (data.success) {
          setRiwayat(data.data.riwayat.absensi || []);
        }
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (time: string | null) => {
    if (!time) return '-';
    return new Date(time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { class: string; label: string }> = {
      HADIR: { class: 'bg-emerald-50 text-emerald-700 border border-emerald-100', label: 'Hadir' },
      TERLAMBAT: { class: 'bg-amber-50 text-amber-700 border border-amber-100', label: 'Terlambat' },
      IZIN: { class: 'bg-blue-50 text-blue-700 border border-blue-100', label: 'Izin' },
      CUTI: { class: 'bg-purple-50 text-purple-700 border border-purple-100', label: 'Cuti' },
      SAKIT: { class: 'bg-orange-50 text-orange-700 border border-orange-100', label: 'Sakit' },
      ALPHA: { class: 'bg-red-50 text-red-700 border border-red-100', label: 'Alpha' },
    };
    return badges[status] || { class: 'bg-gray-50 text-gray-700 border border-gray-100', label: status };
  };

  // Filter by month
  const filteredRiwayat = filterBulan
    ? riwayat.filter(item => item.tanggal.startsWith(filterBulan))
    : riwayat;

  // Get unique months for filter
  const uniqueMonths = Array.from(new Set(riwayat.map(item => item.tanggal.substring(0, 7)))).sort().reverse();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-red-500 rounded-full animate-spin"></div>
          <p className="text-gray-400 text-sm">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Riwayat Absensi</h1>
          <p className="text-gray-500 text-sm mt-1">Lihat riwayat kehadiran Anda</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span>Total: <strong className="text-gray-700">{filteredRiwayat.length}</strong> data</span>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter Bulan</label>
            <select
              value={filterBulan}
              onChange={(e) => setFilterBulan(e.target.value)}
              className="w-full sm:w-auto px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all cursor-pointer"
            >
              <option value="">Semua Bulan</option>
              {uniqueMonths.map(month => (
                <option key={month} value={month}>
                  {new Date(month + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Jam Masuk</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Jam Pulang</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRiwayat.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 text-sm">Tidak ada data absensi</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRiwayat.map((item, index) => {
                  const status = getStatusBadge(item.status);
                  return (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-gray-50/50 transition-colors ${
                        index !== filteredRiwayat.length - 1 ? 'border-b border-gray-100' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-800">{formatDate(item.tanggal)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{formatTime(item.jam_masuk)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{formatTime(item.jam_pulang)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${status.class}`}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Summary Footer */}
        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Menampilkan <span className="font-medium text-gray-700">{filteredRiwayat.length}</span> dari{' '}
              <span className="font-medium text-gray-700">{riwayat.length}</span> data
            </p>
            {filterBulan && (
              <button
                onClick={() => setFilterBulan('')}
                className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
