'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamic import Camera component to avoid SSR issues
const Camera = dynamic(() => import('@/components/Camera'), { ssr: false });

interface Karyawan {
  id: string;
  nama: string;
  nip: string;
  jenis_karyawan: string;
  jam_masuk_normal: string;
  jam_pulang_normal: string;
}

interface AbsensiHariIni {
  id: string;
  tanggal: string;
  jam_masuk: string | null;
  jam_pulang: string | null;
  status: string;
}

interface Ringkasan {
  absensi_hari_ini: AbsensiHariIni | null;
  total_kehadiran_bulan_ini: number;
  total_jam_lembur_bulan_ini: number;
}

interface RiwayatAbsensi {
  id: string;
  tanggal: string;
  jam_masuk: string | null;
  jam_pulang: string | null;
  status: string;
}

interface RiwayatIzinCuti {
  id: string;
  jenis: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  alasan: string;
  status: string;
  created_at: string;
}

interface RiwayatLembur {
  id: string;
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
  total_jam: number;
  keterangan: string;
}

interface DashboardData {
  karyawan: Karyawan;
  ringkasan: Ringkasan;
  riwayat: {
    absensi: RiwayatAbsensi[];
    izin_cuti: RiwayatIzinCuti[];
    lembur: RiwayatLembur[];
  };
}

export default function UserDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'absensi' | 'izin' | 'lembur'>('absensi');
  
  // State untuk modal dan aksi
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  // Fungsi Absen Masuk - buka kamera
  const handleAbsenMasuk = async () => {
    setShowCamera(true);
  };

  // Fungsi kirim absen masuk dengan foto
  const handleCapturePhoto = async (photo: Blob, latitude: number, longitude: number) => {
    setActionLoading(true);
    setActionMessage(null);
    
    try {
      const formData = new FormData();
      formData.append('photo', photo, 'absensi.jpg');
      formData.append('latitude', latitude.toString());
      formData.append('longitude', longitude.toString());
      
      const response = await fetch('/api/absensi/masuk', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      
      const result = await response.json();
      
      console.log('Absen masuk response:', result);
      
      if (result.success) {
        setActionMessage({ type: 'success', text: result.message || 'Berhasil absen masuk!' });
        setShowCamera(false);
        // Refresh data
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setActionMessage({ type: 'error', text: result.error || 'Gagal absen masuk' });
        setShowCamera(false);
      }
    } catch (err: unknown) {
      console.error('Error absen masuk:', err);
      setActionMessage({ type: 'error', text: 'Gagal mengirim absensi' });
      setShowCamera(false);
    } finally {
      setActionLoading(false);
    }
  };

  // Fungsi Absen Pulang
  const handleAbsenPulang = async () => {
    setActionLoading(true);
    setActionMessage(null);
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });
      
      const response = await fetch('/api/absensi/pulang', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setActionMessage({ type: 'success', text: 'Berhasil absen pulang!' });
        window.location.reload();
      } else {
        setActionMessage({ type: 'error', text: result.error || 'Gagal absen pulang' });
      }
    } catch (err: any) {
      if (err.code === 1) {
        setActionMessage({ type: 'error', text: 'Izinkan akses lokasi untuk absen' });
      } else {
        setActionMessage({ type: 'error', text: 'Gagal mendapatkan lokasi' });
      }
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard/user', {
          credentials: 'include',
        });

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
        }
      } catch (err) {
        setError('Gagal memuat data dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const formatTime = (time: string | null) => {
    if (!time) return '-';
    const date = new Date(time);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      HADIR: 'bg-green-100 text-green-800',
      TERLAMBAT: 'bg-yellow-100 text-yellow-800',
      IZIN: 'bg-blue-100 text-blue-800',
      CUTI: 'bg-purple-100 text-purple-800',
      SAKIT: 'bg-orange-100 text-orange-800',
      ALPHA: 'bg-red-100 text-red-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

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

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Absensi</h1>
          <p className="text-gray-500 text-sm mt-1">Absen masuk dan pulang hari ini</p>
        </div>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('id-ID', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          })}
        </div>
      </div>

        {/* Alert Message */}
        {actionMessage && (
          <div className={`p-4 rounded-xl flex items-center gap-3 ${
            actionMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
          }`}>
            {actionMessage.type === 'success' ? (
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span className="text-sm flex-1">{actionMessage.text}</span>
            <button onClick={() => setActionMessage(null)} className="text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Tombol Aksi Cepat */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Aksi Cepat</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tombol Absen Masuk */}
            <button
              onClick={handleAbsenMasuk}
              disabled={actionLoading || !!data?.ringkasan.absensi_hari_ini?.jam_masuk}
              className="flex flex-col items-center justify-center p-6 bg-green-50 hover:bg-green-100 border-2 border-green-200 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center mb-3">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </div>
              <span className="text-base font-semibold text-green-700">Absen Masuk</span>
              {data?.ringkasan.absensi_hari_ini?.jam_masuk ? (
                <span className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Sudah absen
                </span>
              ) : (
                <span className="text-xs text-gray-500 mt-1">Klik untuk absen masuk</span>
              )}
            </button>

            {/* Tombol Absen Pulang */}
            <button
              onClick={handleAbsenPulang}
              disabled={actionLoading || !data?.ringkasan.absensi_hari_ini?.jam_masuk || !!data?.ringkasan.absensi_hari_ini?.jam_pulang}
              className="flex flex-col items-center justify-center p-6 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center mb-3">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <span className="text-base font-semibold text-blue-700">Absen Pulang</span>
              {data?.ringkasan.absensi_hari_ini?.jam_pulang ? (
                <span className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Sudah absen
                </span>
              ) : !data?.ringkasan.absensi_hari_ini?.jam_masuk ? (
                <span className="text-xs text-gray-500 mt-1">Absen masuk dulu</span>
              ) : (
                <span className="text-xs text-gray-500 mt-1">Klik untuk absen pulang</span>
              )}
            </button>
          </div>
          
          {actionLoading && (
            <div className="mt-4 flex items-center justify-center gap-2 text-gray-600">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Memproses...</span>
            </div>
          )}
        </div>

        {/* Cards Ringkasan */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Status Absensi Hari Ini */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Status Hari Ini</h3>
            {data?.ringkasan.absensi_hari_ini ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Status:</span>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(data.ringkasan.absensi_hari_ini.status)}`}>
                    {data.ringkasan.absensi_hari_ini.status}
                  </span>
                </div>
                <div className="space-y-1 mt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Masuk:</span>
                    <span className="font-medium text-gray-900">{formatTime(data.ringkasan.absensi_hari_ini.jam_masuk)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Pulang:</span>
                    <span className="font-medium text-gray-900">{formatTime(data.ringkasan.absensi_hari_ini.jam_pulang)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">Belum absen hari ini</p>
              </div>
            )}
          </div>

          {/* Total Kehadiran Bulan Ini */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Kehadiran Bulan Ini</p>
                <p className="text-2xl font-bold text-gray-900">{data?.ringkasan.total_kehadiran_bulan_ini}</p>
                <p className="text-xs text-gray-500 mt-1">Hari hadir</p>
              </div>
            </div>
          </div>

          {/* Total Jam Lembur */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Lembur Bulan Ini</p>
                <p className="text-2xl font-bold text-gray-900">{data?.ringkasan.total_jam_lembur_bulan_ini}</p>
                <p className="text-xs text-gray-500 mt-1">Jam total</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('absensi')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'absensi'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Riwayat Absensi
              </button>
              <button
                onClick={() => setActiveTab('izin')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'izin'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Riwayat Izin & Cuti
              </button>
              <button
                onClick={() => setActiveTab('lembur')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'lembur'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Riwayat Lembur
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Tab Absensi */}
            {activeTab === 'absensi' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jam Masuk</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jam Pulang</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data?.riwayat.absensi.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-gray-500">Belum ada data absensi</td>
                      </tr>
                    ) : (
                      data?.riwayat.absensi.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(item.tanggal)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatTime(item.jam_masuk)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatTime(item.jam_pulang)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(item.status)}`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab Izin & Cuti */}
            {activeTab === 'izin' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jenis</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal Mulai</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal Selesai</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alasan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data?.riwayat.izin_cuti.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500">Belum ada pengajuan izin/cuti</td>
                      </tr>
                    ) : (
                      data?.riwayat.izin_cuti.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.jenis}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(item.tanggal_mulai)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(item.tanggal_selesai)}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{item.alasan}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(item.status)}`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab Lembur */}
            {activeTab === 'lembur' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jam Mulai</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jam Selesai</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Jam</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data?.riwayat.lembur.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500">Belum ada data lembur</td>
                      </tr>
                    ) : (
                      data?.riwayat.lembur.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(item.tanggal)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatTime(item.jam_mulai)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatTime(item.jam_selesai)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.total_jam} jam</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{item.keterangan}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      {/* Camera Modal */}
      {showCamera && (
        <Camera
          onCapture={handleCapturePhoto}
          onCancel={() => setShowCamera(false)}
          isSubmitting={actionLoading}
        />
      )}
    </div>
  );
}