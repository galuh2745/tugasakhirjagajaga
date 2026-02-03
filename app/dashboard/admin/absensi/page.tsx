'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// =============================================
// INTERFACE DEFINITIONS
// =============================================
interface JenisKaryawan {
  id: string;
  nama: string;
}

interface DetailAbsensi {
  id: string;
  tanggal: string;
  jam_masuk: string;
  jam_pulang: string;
  status: string;
  foto_masuk: string | null;
  foto_pulang: string | null;
}

interface RekapKaryawan {
  karyawan_id: string;
  nip: string;
  nama: string;
  jenis_karyawan: JenisKaryawan;
  rekap: {
    hadir: number;
    terlambat: number;
    izin: number;
    cuti: number;
    alpha: number;
    total_masuk: number;
  };
  detail: DetailAbsensi[];
}

interface Summary {
  total_karyawan: number;
  total_hadir: number;
  total_terlambat: number;
  total_izin: number;
  total_cuti: number;
  total_alpha: number;
}

interface Periode {
  bulan: number;
  tahun: number;
  tanggal_awal: string;
  tanggal_akhir: string;
}

interface RekapResponse {
  success: boolean;
  data?: {
    periode: Periode;
    summary: Summary;
    rekap: RekapKaryawan[];
  };
  error?: string;
}

interface KaryawanOption {
  id: string;
  nip: string;
  nama: string;
}

interface JenisKaryawanOption {
  id: string;
  nama_jenis: string;
}

// =============================================
// HELPER FUNCTIONS
// =============================================
const getBulanNama = (bulan: number): string => {
  const namaBulan = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return namaBulan[bulan - 1] || '';
};

const getStatusBadge = (status: string): string => {
  const badges: Record<string, string> = {
    HADIR: 'bg-green-100 text-green-800',
    TERLAMBAT: 'bg-yellow-100 text-yellow-800',
    IZIN: 'bg-blue-100 text-blue-800',
    CUTI: 'bg-purple-100 text-purple-800',
    ALPHA: 'bg-red-100 text-red-800',
  };
  return badges[status] || 'bg-gray-100 text-gray-800';
};

const formatTanggal = (tanggalStr: string): string => {
  const date = new Date(tanggalStr);
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

// =============================================
// MAIN COMPONENT
// =============================================
export default function RiwayatAbsensiPage() {
  const router = useRouter();
  
  // State untuk filter
  const [bulan, setBulan] = useState<number>(new Date().getMonth() + 1);
  const [tahun, setTahun] = useState<number>(new Date().getFullYear());
  const [selectedKaryawan, setSelectedKaryawan] = useState<string>('');
  const [selectedJenisKaryawan, setSelectedJenisKaryawan] = useState<string>('');
  
  // State untuk data
  const [loading, setLoading] = useState<boolean>(true);
  const [rekapData, setRekapData] = useState<RekapKaryawan[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [periode, setPeriode] = useState<Periode | null>(null);
  
  // State untuk detail view
  const [expandedKaryawan, setExpandedKaryawan] = useState<string | null>(null);
  
  // State untuk dropdown options
  const [karyawanOptions, setKaryawanOptions] = useState<KaryawanOption[]>([]);
  const [jenisKaryawanOptions, setJenisKaryawanOptions] = useState<JenisKaryawanOption[]>([]);
  
  // State untuk error
  const [error, setError] = useState<string | null>(null);
  
  // State untuk export PDF
  const [exporting, setExporting] = useState<boolean>(false);
  
  // State untuk photo modal
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // =============================================
  // FETCH DATA FUNCTIONS
  // =============================================
  
  // Fetch options untuk dropdown
  const fetchOptions = async () => {
    try {
      // Fetch karyawan list
      const karyawanRes = await fetch('/api/karyawan', { credentials: 'include' });
      if (karyawanRes.ok) {
        const karyawanData = await karyawanRes.json();
        if (karyawanData.success) {
          setKaryawanOptions(karyawanData.data.map((k: { id: string; nip: string; nama: string }) => ({
            id: k.id,
            nip: k.nip,
            nama: k.nama,
          })));
        }
      }
      
      // Fetch jenis karyawan list
      const jenisRes = await fetch('/api/jenis-karyawan', { credentials: 'include' });
      if (jenisRes.ok) {
        const jenisData = await jenisRes.json();
        if (jenisData.success) {
          setJenisKaryawanOptions(jenisData.data);
        }
      }
    } catch (err) {
      console.error('Error fetching options:', err);
    }
  };

  // Fetch rekap absensi bulanan
  const fetchRekapAbsensi = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query params
      const params = new URLSearchParams({
        bulan: bulan.toString(),
        tahun: tahun.toString(),
      });
      
      if (selectedKaryawan) {
        params.append('karyawan_id', selectedKaryawan);
      }
      
      if (selectedJenisKaryawan) {
        params.append('jenis_karyawan_id', selectedJenisKaryawan);
      }
      
      const response = await fetch(`/api/absensi/rekap-bulanan?${params.toString()}`, {
        credentials: 'include',
      });
      
      if (response.status === 401 || response.status === 403) {
        router.push('/login');
        return;
      }
      
      const result: RekapResponse = await response.json();
      
      if (result.success && result.data) {
        setRekapData(result.data.rekap);
        setSummary(result.data.summary);
        setPeriode(result.data.periode);
      } else {
        setError(result.error || 'Gagal memuat data rekap absensi');
      }
    } catch (err) {
      console.error('Error fetching rekap:', err);
      setError('Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  // =============================================
  // USE EFFECTS
  // =============================================
  
  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    fetchRekapAbsensi();
  }, [bulan, tahun, selectedKaryawan, selectedJenisKaryawan]);

  // =============================================
  // EVENT HANDLERS
  // =============================================
  
  const handleRowClick = (karyawanId: string) => {
    setExpandedKaryawan(expandedKaryawan === karyawanId ? null : karyawanId);
  };

  const handleReset = () => {
    setBulan(new Date().getMonth() + 1);
    setTahun(new Date().getFullYear());
    setSelectedKaryawan('');
    setSelectedJenisKaryawan('');
    setExpandedKaryawan(null);
  };

  // Export PDF handler
  const handleExportPDF = async () => {
    try {
      setExporting(true);
      setError('');
      
      // Build query params
      const params = new URLSearchParams({
        bulan: bulan.toString(),
        tahun: tahun.toString(),
      });
      
      if (selectedKaryawan) {
        params.append('karyawan_id', selectedKaryawan);
      }
      
      if (selectedJenisKaryawan) {
        params.append('jenis_karyawan_id', selectedJenisKaryawan);
      }
      
      const response = await fetch(`/api/absensi/rekap-bulanan/pdf?${params.toString()}`, {
        credentials: 'include',
      });
      
      // Cek Content-Type response
      const contentType = response.headers.get('content-type');
      
      if (!response.ok) {
        // Jika response adalah JSON (error dari server)
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Gagal mengexport PDF');
        }
        // Jika bukan JSON, throw generic error
        throw new Error(`Gagal mengexport PDF (Status: ${response.status})`);
      }
      
      // Pastikan response adalah PDF
      if (!contentType || !contentType.includes('application/pdf')) {
        throw new Error('Response bukan file PDF');
      }
      
      // Download file PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Rekap_Absensi_${getBulanNama(bulan)}_${tahun}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (err) {
      console.error('Error exporting PDF:', err);
      const errorMessage = err instanceof Error ? err.message : 'Gagal mengexport PDF';
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setExporting(false);
    }
  };

  // =============================================
  // GENERATE OPTIONS
  // =============================================
  
  // Generate tahun options (5 tahun ke belakang sampai tahun depan)
  const tahunOptions = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear + 1; y >= currentYear - 5; y--) {
    tahunOptions.push(y);
  }

  // =============================================
  // RENDER
  // =============================================
  
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Riwayat Absensi Bulanan</h1>
          <p className="text-gray-600 mt-1">
            Rekap absensi karyawan per bulan untuk evaluasi dan pelaporan
          </p>
        </div>
        {/* Export PDF Button */}
        <button
          onClick={handleExportPDF}
          disabled={exporting || loading || rekapData.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {exporting ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Mengexport...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export PDF</span>
            </>
          )}
        </button>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Filter Bulan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bulan</label>
            <select
              value={bulan}
              onChange={(e) => setBulan(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {getBulanNama(i + 1)}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Tahun */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tahun</label>
            <select
              value={tahun}
              onChange={(e) => setTahun(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {tahunOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Jenis Karyawan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Karyawan</label>
            <select
              value={selectedJenisKaryawan}
              onChange={(e) => setSelectedJenisKaryawan(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Semua Jenis</option>
              {jenisKaryawanOptions.map((jenis) => (
                <option key={jenis.id} value={jenis.id}>
                  {jenis.nama_jenis}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Karyawan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Karyawan</label>
            <select
              value={selectedKaryawan}
              onChange={(e) => setSelectedKaryawan(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Semua Karyawan</option>
              {karyawanOptions.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama} ({k.nip})
                </option>
              ))}
            </select>
          </div>

          {/* Reset Button */}
          <div className="flex items-end">
            <button
              onClick={handleReset}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
            >
              Reset Filter
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Karyawan</div>
            <div className="text-2xl font-bold text-gray-900">{summary.total_karyawan}</div>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-4 border border-green-200">
            <div className="text-sm text-green-600">Total Hadir</div>
            <div className="text-2xl font-bold text-green-700">{summary.total_hadir}</div>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-4 border border-yellow-200">
            <div className="text-sm text-yellow-600">Total Terlambat</div>
            <div className="text-2xl font-bold text-yellow-700">{summary.total_terlambat}</div>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-4 border border-blue-200">
            <div className="text-sm text-blue-600">Total Izin</div>
            <div className="text-2xl font-bold text-blue-700">{summary.total_izin}</div>
          </div>
          <div className="bg-purple-50 rounded-lg shadow p-4 border border-purple-200">
            <div className="text-sm text-purple-600">Total Cuti</div>
            <div className="text-2xl font-bold text-purple-700">{summary.total_cuti}</div>
          </div>
          <div className="bg-red-50 rounded-lg shadow p-4 border border-red-200">
            <div className="text-sm text-red-600">Total Alpha</div>
            <div className="text-2xl font-bold text-red-700">{summary.total_alpha}</div>
          </div>
        </div>
      )}

      {/* Periode Info */}
      {periode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-blue-800 font-medium">
              Periode: {getBulanNama(periode.bulan)} {periode.tahun}
            </span>
            <span className="text-blue-600 text-sm">
              ({periode.tanggal_awal} s/d {periode.tanggal_akhir})
            </span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-red-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="bg-white rounded-lg shadow p-12">
          <div className="flex flex-col items-center justify-center">
            <svg className="animate-spin w-10 h-10 text-blue-600 mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-gray-600">Memuat data rekap absensi...</p>
          </div>
        </div>
      ) : (
        /* Rekap Table */
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    NIP
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama Karyawan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jenis Karyawan
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hadir
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Terlambat
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Izin
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cuti
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Alpha
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rekapData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <p>Tidak ada data absensi untuk periode ini</p>
                    </td>
                  </tr>
                ) : (
                  rekapData.map((item) => (
                    <React.Fragment key={item.karyawan_id}>
                      {/* Main Row */}
                      <tr
                        onClick={() => handleRowClick(item.karyawan_id)}
                        className="hover:bg-gray-50 cursor-pointer transition"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <svg
                              className={`w-4 h-4 text-gray-400 transition-transform ${
                                expandedKaryawan === item.karyawan_id ? 'rotate-90' : ''
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            <span className="text-sm font-medium text-gray-900">{item.nip}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{item.nama}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                            {item.jenis_karyawan.nama}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 text-sm font-semibold text-green-700 bg-green-100 rounded-full">
                            {item.rekap.hadir}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 text-sm font-semibold text-yellow-700 bg-yellow-100 rounded-full">
                            {item.rekap.terlambat}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 text-sm font-semibold text-blue-700 bg-blue-100 rounded-full">
                            {item.rekap.izin}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 text-sm font-semibold text-purple-700 bg-purple-100 rounded-full">
                            {item.rekap.cuti}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 text-sm font-semibold text-red-700 bg-red-100 rounded-full">
                            {item.rekap.alpha}
                          </span>
                        </td>
                      </tr>

                      {/* Detail Row (Expandable) */}
                      {expandedKaryawan === item.karyawan_id && (
                        <tr key={`${item.karyawan_id}-detail`}>
                          <td colSpan={8} className="px-6 py-4 bg-gray-50">
                            <div className="ml-6">
                              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                Detail Absensi Harian - {item.nama}
                              </h4>
                              {item.detail.length === 0 ? (
                                <p className="text-sm text-gray-500 italic">
                                  Tidak ada data absensi untuk karyawan ini pada periode ini
                                </p>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                                    <thead className="bg-gray-100">
                                      <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                          Tanggal
                                        </th>
                                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                                          Jam Masuk
                                        </th>
                                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                                          Jam Pulang
                                        </th>
                                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                                          Status
                                        </th>
                                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                                          Foto
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                      {item.detail.map((detail) => (
                                        <tr key={detail.id} className="hover:bg-gray-50">
                                          <td className="px-4 py-2 text-sm text-gray-900">
                                            {formatTanggal(detail.tanggal)}
                                          </td>
                                          <td className="px-4 py-2 text-sm text-gray-600 text-center">
                                            {detail.jam_masuk}
                                          </td>
                                          <td className="px-4 py-2 text-sm text-gray-600 text-center">
                                            {detail.jam_pulang}
                                          </td>
                                          <td className="px-4 py-2 text-center">
                                            <span
                                              className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(
                                                detail.status
                                              )}`}
                                            >
                                              {detail.status}
                                            </span>
                                          </td>
                                          <td className="px-4 py-2 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                              {detail.foto_masuk ? (
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedPhoto(detail.foto_masuk);
                                                  }}
                                                  className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition flex items-center gap-1"
                                                  title="Lihat Foto Masuk"
                                                >
                                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                                  </svg>
                                                  Masuk
                                                </button>
                                              ) : (
                                                <span className="text-xs text-gray-400">-</span>
                                              )}
                                              {detail.foto_pulang && (
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedPhoto(detail.foto_pulang);
                                                  }}
                                                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition flex items-center gap-1"
                                                  title="Lihat Foto Pulang"
                                                >
                                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                                  </svg>
                                                  Pulang
                                                </button>
                                              )}
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info Footer */}
      <div className="mt-6 text-sm text-gray-500">
        <p>💡 Klik pada baris karyawan untuk melihat detail absensi harian</p>
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden shadow-2xl">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={selectedPhoto}
              alt="Foto Absensi"
              className="max-w-full max-h-[85vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="p-4 bg-white border-t">
              <p className="text-sm text-gray-600 text-center">
                Foto absensi dengan watermark (nama, waktu, lokasi)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
