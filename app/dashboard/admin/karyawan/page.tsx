'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface JenisKaryawan {
  id: string;
  nama_jenis: string;
  jam_masuk: string;
  jam_pulang: string;
  toleransi_terlambat: number;
  jumlah_karyawan: number;
}

interface Karyawan {
  id: string;
  user_id: string;
  nip: string;
  nama: string;
  email: string;
  no_hp: string;
  alamat: string;
  status: 'AKTIF' | 'NONAKTIF';
  jenis_karyawan: {
    id: string;
    nama_jenis: string;
    jam_masuk: string;
    jam_pulang: string;
  };
  created_at: string;
}

export default function ManajemenKaryawanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [karyawanList, setKaryawanList] = useState<Karyawan[]>([]);
  const [jenisKaryawanList, setJenisKaryawanList] = useState<JenisKaryawan[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showJenisModal, setShowJenisModal] = useState(false);
  const [showAddJenisModal, setShowAddJenisModal] = useState(false);
  const [showEditJenisModal, setShowEditJenisModal] = useState(false);
  const [selectedKaryawan, setSelectedKaryawan] = useState<Karyawan | null>(null);
  const [selectedJenis, setSelectedJenis] = useState<JenisKaryawan | null>(null);
  
  // Multi-select states
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Form states
  const [formLoading, setFormLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Form karyawan
  const [formKaryawan, setFormKaryawan] = useState({
    nama: '',
    nip: '',
    email: '',
    password: '',
    jenis_karyawan_id: '',
    no_hp: '',
    alamat: '',
    status: 'AKTIF',
  });

  // Form jenis karyawan
  const [formJenis, setFormJenis] = useState({
    nama_jenis: '',
    jam_masuk: '07:00',
    jam_pulang: '16:00',
    toleransi_terlambat: 15,
  });

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch karyawan
      let url = '/api/karyawan?';
      if (filterStatus) url += `status=${filterStatus}&`;
      if (filterJenis) url += `jenis_karyawan_id=${filterJenis}&`;
      if (searchTerm) url += `search=${searchTerm}&`;
      
      const [karyawanRes, jenisRes] = await Promise.all([
        fetch(url, { credentials: 'include' }),
        fetch('/api/jenis-karyawan', { credentials: 'include' })
      ]);

      if (karyawanRes.status === 401 || jenisRes.status === 401) {
        router.push('/login');
        return;
      }

      const karyawanData = await karyawanRes.json();
      const jenisData = await jenisRes.json();

      if (karyawanData.success) setKaryawanList(karyawanData.data);
      if (jenisData.success) setJenisKaryawanList(jenisData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterStatus, filterJenis, searchTerm]);

  // Format time
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  // Handle submit karyawan baru
  const handleSubmitKaryawan = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/karyawan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formKaryawan),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: 'Karyawan berhasil ditambahkan' });
        setShowAddModal(false);
        setFormKaryawan({
          nama: '', nip: '', email: '', password: '',
          jenis_karyawan_id: '', no_hp: '', alamat: '', status: 'AKTIF',
        });
        fetchData();
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan' });
    } finally {
      setFormLoading(false);
    }
  };

  // Handle update karyawan
  const handleUpdateKaryawan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKaryawan) return;
    
    setFormLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/karyawan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: selectedKaryawan.id, ...formKaryawan }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: 'Data karyawan berhasil diperbarui' });
        setShowEditModal(false);
        fetchData();
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan' });
    } finally {
      setFormLoading(false);
    }
  };

  // Handle delete karyawan
  const handleDeleteKaryawan = async (id: string, nama: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus karyawan "${nama}"? Semua data absensi akan ikut terhapus.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/karyawan?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: 'Karyawan berhasil dihapus' });
        fetchData();
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan' });
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedIds.size === karyawanList.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(karyawanList.map(k => k.id)));
    }
  };

  // Handle select single
  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Handle delete multiple karyawan
  const handleDeleteMultiple = async () => {
    if (selectedIds.size === 0) return;
    
    if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.size} karyawan? Semua data absensi akan ikut terhapus.`)) {
      return;
    }

    setIsDeleting(true);
    let successCount = 0;
    let failCount = 0;

    for (const id of selectedIds) {
      try {
        const response = await fetch(`/api/karyawan?id=${id}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        const result = await response.json();
        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        failCount++;
      }
    }

    setIsDeleting(false);
    setSelectedIds(new Set());
    
    if (failCount === 0) {
      setMessage({ type: 'success', text: `${successCount} karyawan berhasil dihapus` });
    } else {
      setMessage({ type: 'error', text: `${successCount} berhasil, ${failCount} gagal dihapus` });
    }
    
    fetchData();
  };

  // Handle submit jenis karyawan baru
  const handleSubmitJenis = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const response = await fetch('/api/jenis-karyawan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formJenis),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: 'Jenis karyawan berhasil ditambahkan' });
        setShowAddJenisModal(false);
        setFormJenis({ nama_jenis: '', jam_masuk: '07:00', jam_pulang: '16:00', toleransi_terlambat: 15 });
        fetchData();
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan' });
    } finally {
      setFormLoading(false);
    }
  };

  // Handle update jenis karyawan
  const handleUpdateJenis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJenis) return;

    setFormLoading(true);

    try {
      const response = await fetch('/api/jenis-karyawan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: selectedJenis.id, ...formJenis }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: 'Pengaturan jam kerja berhasil diperbarui' });
        setShowEditJenisModal(false);
        fetchData();
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan' });
    } finally {
      setFormLoading(false);
    }
  };

  // Handle delete jenis karyawan
  const handleDeleteJenis = async (id: string, nama: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus jenis karyawan "${nama}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/jenis-karyawan?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: 'Jenis karyawan berhasil dihapus' });
        fetchData();
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan' });
    }
  };

  // Open edit modal
  const openEditModal = (karyawan: Karyawan) => {
    setSelectedKaryawan(karyawan);
    setFormKaryawan({
      nama: karyawan.nama,
      nip: karyawan.nip,
      email: karyawan.email,
      password: '',
      jenis_karyawan_id: karyawan.jenis_karyawan.id,
      no_hp: karyawan.no_hp,
      alamat: karyawan.alamat,
      status: karyawan.status,
    });
    setShowEditModal(true);
  };

  // Open edit jenis modal
  const openEditJenisModal = (jenis: JenisKaryawan) => {
    setSelectedJenis(jenis);
    const jamMasuk = new Date(jenis.jam_masuk);
    const jamPulang = new Date(jenis.jam_pulang);
    setFormJenis({
      nama_jenis: jenis.nama_jenis,
      jam_masuk: `${String(jamMasuk.getHours()).padStart(2, '0')}:${String(jamMasuk.getMinutes()).padStart(2, '0')}`,
      jam_pulang: `${String(jamPulang.getHours()).padStart(2, '0')}:${String(jamPulang.getMinutes()).padStart(2, '0')}`,
      toleransi_terlambat: jenis.toleransi_terlambat,
    });
    setShowEditJenisModal(true);
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manajemen Karyawan</h1>
              <p className="text-gray-600 mt-1">Kelola data karyawan dan pengaturan jam kerja</p>
            </div>
            <button
              onClick={() => router.push('/dashboard/admin')}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Kembali
            </button>
          </div>
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

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={() => {
              setFormKaryawan({ nama: '', nip: '', email: '', password: '', jenis_karyawan_id: '', no_hp: '', alamat: '', status: 'AKTIF' });
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Tambah Karyawan
          </button>
          <button
            onClick={() => setShowJenisModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Pengaturan Jam Kerja
          </button>
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
                placeholder="Nama, NIP, atau Email..."
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
                <option value="AKTIF">Aktif</option>
                <option value="NONAKTIF">Nonaktif</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Karyawan</label>
              <select
                value={filterJenis}
                onChange={(e) => setFilterJenis(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Semua Jenis</option>
                {jenisKaryawanList.map((jenis) => (
                  <option key={jenis.id} value={jenis.id}>{jenis.nama_jenis}</option>
                ))}
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

        {/* Karyawan Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Daftar Karyawan ({karyawanList.length})</h3>
            {selectedIds.size > 0 && (
              <button
                onClick={handleDeleteMultiple}
                disabled={isDeleting}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span className="hidden sm:inline">Menghapus...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span className="hidden sm:inline">Hapus {selectedIds.size} Terpilih</span>
                    <span className="sm:hidden">Hapus ({selectedIds.size})</span>
                  </>
                )}
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left">
                    <input
                      type="checkbox"
                      checked={karyawanList.length > 0 && selectedIds.size === karyawanList.length}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">NIP</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Email</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Jenis</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">No HP</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {karyawanList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 sm:px-6 py-6 sm:py-8 text-center text-gray-500 text-sm">
                      Belum ada data karyawan
                    </td>
                  </tr>
                ) : (
                  karyawanList.map((karyawan) => (
                    <tr key={karyawan.id} className={`hover:bg-gray-50 ${selectedIds.has(karyawan.id) ? 'bg-blue-50' : ''}`}>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(karyawan.id)}
                          onChange={() => handleSelectOne(karyawan.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">{karyawan.nip}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="text-xs sm:text-sm text-gray-900">{karyawan.nama}</div>
                        <div className="text-xs text-gray-500 md:hidden">{karyawan.email}</div>
                        <div className="text-xs text-gray-400 sm:hidden">{karyawan.jenis_karyawan.nama_jenis}</div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden md:table-cell">{karyawan.email}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden sm:table-cell">{karyawan.jenis_karyawan.nama_jenis}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden lg:table-cell">{karyawan.no_hp}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 sm:py-1 text-xs font-semibold rounded-full ${
                          karyawan.status === 'AKTIF' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {karyawan.status}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(karyawan)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteKaryawan(karyawan.id, karyawan.nama)}
                            className="text-red-600 hover:text-red-800"
                            title="Hapus"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Tambah Karyawan */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Tambah Karyawan Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmitKaryawan} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap *</label>
                  <input
                    type="text"
                    value={formKaryawan.nama}
                    onChange={(e) => setFormKaryawan({ ...formKaryawan, nama: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">NIP *</label>
                  <input
                    type="text"
                    value={formKaryawan.nip}
                    onChange={(e) => setFormKaryawan({ ...formKaryawan, nip: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={formKaryawan.email}
                    onChange={(e) => setFormKaryawan({ ...formKaryawan, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <input
                    type="password"
                    value={formKaryawan.password}
                    onChange={(e) => setFormKaryawan({ ...formKaryawan, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Minimal 6 karakter"
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Karyawan *</label>
                  <select
                    value={formKaryawan.jenis_karyawan_id}
                    onChange={(e) => setFormKaryawan({ ...formKaryawan, jenis_karyawan_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Pilih Jenis</option>
                    {jenisKaryawanList.map((jenis) => (
                      <option key={jenis.id} value={jenis.id}>{jenis.nama_jenis}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">No HP *</label>
                  <input
                    type="text"
                    value={formKaryawan.no_hp}
                    onChange={(e) => setFormKaryawan({ ...formKaryawan, no_hp: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formKaryawan.status}
                    onChange={(e) => setFormKaryawan({ ...formKaryawan, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="AKTIF">Aktif</option>
                    <option value="NONAKTIF">Nonaktif</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat *</label>
                <textarea
                  value={formKaryawan.alamat}
                  onChange={(e) => setFormKaryawan({ ...formKaryawan, alamat: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {formLoading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Karyawan */}
      {showEditModal && selectedKaryawan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Karyawan</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleUpdateKaryawan} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    value={formKaryawan.nama}
                    onChange={(e) => setFormKaryawan({ ...formKaryawan, nama: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">NIP</label>
                  <input
                    type="text"
                    value={formKaryawan.nip}
                    onChange={(e) => setFormKaryawan({ ...formKaryawan, nip: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formKaryawan.email}
                    onChange={(e) => setFormKaryawan({ ...formKaryawan, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
                  <input
                    type="password"
                    value={formKaryawan.password}
                    onChange={(e) => setFormKaryawan({ ...formKaryawan, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Kosongkan jika tidak diubah"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Karyawan</label>
                  <select
                    value={formKaryawan.jenis_karyawan_id}
                    onChange={(e) => setFormKaryawan({ ...formKaryawan, jenis_karyawan_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {jenisKaryawanList.map((jenis) => (
                      <option key={jenis.id} value={jenis.id}>{jenis.nama_jenis}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">No HP</label>
                  <input
                    type="text"
                    value={formKaryawan.no_hp}
                    onChange={(e) => setFormKaryawan({ ...formKaryawan, no_hp: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formKaryawan.status}
                    onChange={(e) => setFormKaryawan({ ...formKaryawan, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="AKTIF">Aktif</option>
                    <option value="NONAKTIF">Nonaktif</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                <textarea
                  value={formKaryawan.alamat}
                  onChange={(e) => setFormKaryawan({ ...formKaryawan, alamat: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {formLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pengaturan Jam Kerja */}
      {showJenisModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Pengaturan Jam Kerja & Jenis Karyawan</h3>
              <button onClick={() => setShowJenisModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <button
                onClick={() => {
                  setFormJenis({ nama_jenis: '', jam_masuk: '07:00', jam_pulang: '16:00', toleransi_terlambat: 15 });
                  setShowAddJenisModal(true);
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Tambah Jenis Karyawan
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jenis</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jam Masuk</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jam Pulang</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Toleransi</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Karyawan</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {jenisKaryawanList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        Belum ada jenis karyawan
                      </td>
                    </tr>
                  ) : (
                    jenisKaryawanList.map((jenis) => (
                      <tr key={jenis.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{jenis.nama_jenis}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{formatTime(jenis.jam_masuk)}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{formatTime(jenis.jam_pulang)}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{jenis.toleransi_terlambat} menit</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{jenis.jumlah_karyawan} orang</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditJenisModal(jenis)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Edit"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteJenis(jenis.id, jenis.nama_jenis)}
                              className="text-red-600 hover:text-red-800"
                              title="Hapus"
                              disabled={jenis.jumlah_karyawan > 0}
                            >
                              <svg className={`w-5 h-5 ${jenis.jumlah_karyawan > 0 ? 'opacity-30 cursor-not-allowed' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">ℹ️ Informasi Toleransi Keterlambatan</h4>
              <p className="text-sm text-blue-700">
                Karyawan dianggap <strong>HADIR</strong> jika absen masuk sebelum <em>Jam Masuk + Toleransi</em>.<br />
                Contoh: Jam Masuk 07:00 dengan toleransi 15 menit → absen sebelum 07:15 = HADIR, setelahnya = TERLAMBAT.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Jenis Karyawan */}
      {showAddJenisModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Tambah Jenis Karyawan</h3>
              <button onClick={() => setShowAddJenisModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmitJenis} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Jenis *</label>
                <input
                  type="text"
                  value={formJenis.nama_jenis}
                  onChange={(e) => setFormJenis({ ...formJenis, nama_jenis: e.target.value })}
                  placeholder="Contoh: Supir, Kurir, Karyawan Tetap"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jam Masuk *</label>
                  <input
                    type="time"
                    value={formJenis.jam_masuk}
                    onChange={(e) => setFormJenis({ ...formJenis, jam_masuk: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jam Pulang *</label>
                  <input
                    type="time"
                    value={formJenis.jam_pulang}
                    onChange={(e) => setFormJenis({ ...formJenis, jam_pulang: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Toleransi Terlambat (menit)</label>
                <input
                  type="number"
                  value={formJenis.toleransi_terlambat}
                  onChange={(e) => setFormJenis({ ...formJenis, toleransi_terlambat: parseInt(e.target.value) || 0 })}
                  min="0"
                  max="60"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">Absen sebelum jam masuk + toleransi = HADIR</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddJenisModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {formLoading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Jenis Karyawan */}
      {showEditJenisModal && selectedJenis && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Pengaturan Jam Kerja</h3>
              <button onClick={() => setShowEditJenisModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleUpdateJenis} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Jenis</label>
                <input
                  type="text"
                  value={formJenis.nama_jenis}
                  onChange={(e) => setFormJenis({ ...formJenis, nama_jenis: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jam Masuk</label>
                  <input
                    type="time"
                    value={formJenis.jam_masuk}
                    onChange={(e) => setFormJenis({ ...formJenis, jam_masuk: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jam Pulang</label>
                  <input
                    type="time"
                    value={formJenis.jam_pulang}
                    onChange={(e) => setFormJenis({ ...formJenis, jam_pulang: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Toleransi Terlambat (menit)</label>
                <input
                  type="number"
                  value={formJenis.toleransi_terlambat}
                  onChange={(e) => setFormJenis({ ...formJenis, toleransi_terlambat: parseInt(e.target.value) || 0 })}
                  min="0"
                  max="60"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditJenisModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {formLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
