'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface IzinCuti {
  id: string;
  karyawan_id: string;
  karyawan: {
    id: string;
    nama: string;
    nip: string;
  };
  jenis: 'IZIN' | 'CUTI' | 'SAKIT';
  tanggal_mulai: string;
  tanggal_selesai: string;
  alasan: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
}

export default function IzinCutiAdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [izinCutiList, setIzinCutiList] = useState<IzinCuti[]>([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/izin-cuti', {
        credentials: 'include',
      });

      if (response.status === 401 || response.status === 403) {
        router.push('/login');
        return;
      }

      const result = await response.json();
      if (result.success) {
        setIzinCutiList(result.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter data
  const filteredData = izinCutiList.filter((item) => {
    const matchStatus = !filterStatus || item.status === filterStatus;
    const matchJenis = !filterJenis || item.jenis === filterJenis;
    const matchSearch = !searchTerm || 
      item.karyawan.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.karyawan.nip.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchJenis && matchSearch;
  });

  // Count by status
  const pendingCount = izinCutiList.filter(item => item.status === 'PENDING').length;
  const approvedCount = izinCutiList.filter(item => item.status === 'APPROVED').length;
  const rejectedCount = izinCutiList.filter(item => item.status === 'REJECTED').length;

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Calculate days
  const calculateDays = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  // Handle approve/reject
  const handleAction = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    const action = status === 'APPROVED' ? 'menyetujui' : 'menolak';
    if (!confirm(`Apakah Anda yakin ingin ${action} pengajuan ini?`)) {
      return;
    }

    setProcessingId(id);
    try {
      const response = await fetch('/api/izin-cuti/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ izin_cuti_id: id, status }),
      });

      const result = await response.json();
      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: `Pengajuan berhasil ${status === 'APPROVED' ? 'disetujui' : 'ditolak'}` 
        });
        fetchData();
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan' });
    } finally {
      setProcessingId(null);
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get jenis badge
  const getJenisBadge = (jenis: string) => {
    switch (jenis) {
      case 'IZIN':
        return 'bg-blue-100 text-blue-800';
      case 'CUTI':
        return 'bg-purple-100 text-purple-800';
      case 'SAKIT':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Izin & Cuti</h1>
        <p className="text-gray-600 mt-1">Kelola pengajuan izin dan cuti karyawan</p>
      </div>

      {/* Alert Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-auto">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div 
          className={`bg-white rounded-lg shadow p-6 cursor-pointer transition hover:shadow-md ${filterStatus === 'PENDING' ? 'ring-2 ring-yellow-500' : ''}`}
          onClick={() => setFilterStatus(filterStatus === 'PENDING' ? '' : 'PENDING')}
        >
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Menunggu Persetujuan</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            </div>
          </div>
        </div>

        <div 
          className={`bg-white rounded-lg shadow p-6 cursor-pointer transition hover:shadow-md ${filterStatus === 'APPROVED' ? 'ring-2 ring-green-500' : ''}`}
          onClick={() => setFilterStatus(filterStatus === 'APPROVED' ? '' : 'APPROVED')}
        >
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Disetujui</p>
              <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
            </div>
          </div>
        </div>

        <div 
          className={`bg-white rounded-lg shadow p-6 cursor-pointer transition hover:shadow-md ${filterStatus === 'REJECTED' ? 'ring-2 ring-red-500' : ''}`}
          onClick={() => setFilterStatus(filterStatus === 'REJECTED' ? '' : 'REJECTED')}
        >
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ditolak</p>
              <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cari</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nama atau NIP..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Semua Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Disetujui</option>
              <option value="REJECTED">Ditolak</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jenis</label>
            <select
              value={filterJenis}
              onChange={(e) => setFilterJenis(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Semua Jenis</option>
              <option value="IZIN">Izin</option>
              <option value="CUTI">Cuti</option>
              <option value="SAKIT">Sakit</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => { setSearchTerm(''); setFilterStatus(''); setFilterJenis(''); }}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Reset Filter
            </button>
          </div>
        </div>
      </div>

      {/* Pending List - Show first if there are pending items */}
      {pendingCount > 0 && !filterStatus && (
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200 bg-yellow-50">
            <h3 className="text-lg font-semibold text-yellow-800 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Menunggu Persetujuan ({pendingCount})
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {izinCutiList.filter(item => item.status === 'PENDING').map((item) => (
              <div key={item.id} className="p-6 hover:bg-gray-50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-gray-900">{item.karyawan.nama}</span>
                      <span className="text-sm text-gray-500">({item.karyawan.nip})</span>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getJenisBadge(item.jenis)}`}>
                        {item.jenis}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Tanggal:</span> {formatDate(item.tanggal_mulai)} - {formatDate(item.tanggal_selesai)}
                      <span className="ml-2 text-gray-500">({calculateDays(item.tanggal_mulai, item.tanggal_selesai)} hari)</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Alasan:</span> {item.alasan}
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      Diajukan: {formatDate(item.created_at)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(item.id, 'APPROVED')}
                      disabled={processingId === item.id}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {processingId === item.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      Setujui
                    </button>
                    <button
                      onClick={() => handleAction(item.id, 'REJECTED')}
                      disabled={processingId === item.id}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {processingId === item.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      Tolak
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Data Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {filterStatus ? `Pengajuan ${filterStatus === 'PENDING' ? 'Pending' : filterStatus === 'APPROVED' ? 'Disetujui' : 'Ditolak'}` : 'Semua Pengajuan'} ({filteredData.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Karyawan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jenis</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durasi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alasan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Tidak ada data pengajuan
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.karyawan.nama}</div>
                      <div className="text-sm text-gray-500">{item.karyawan.nip}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getJenisBadge(item.jenis)}`}>
                        {item.jenis}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(item.tanggal_mulai)} - {formatDate(item.tanggal_selesai)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {calculateDays(item.tanggal_mulai, item.tanggal_selesai)} hari
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={item.alasan}>
                      {item.alasan}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(item.status)}`}>
                        {item.status === 'PENDING' ? 'Pending' : item.status === 'APPROVED' ? 'Disetujui' : 'Ditolak'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {item.status === 'PENDING' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAction(item.id, 'APPROVED')}
                            disabled={processingId === item.id}
                            className="text-green-600 hover:text-green-800 disabled:opacity-50"
                            title="Setujui"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleAction(item.id, 'REJECTED')}
                            disabled={processingId === item.id}
                            className="text-red-600 hover:text-red-800 disabled:opacity-50"
                            title="Tolak"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
