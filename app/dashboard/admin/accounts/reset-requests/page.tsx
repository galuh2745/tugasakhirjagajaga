'use client';

import { useState, useEffect } from 'react';
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Clock,
  Mail,
  User,
} from 'lucide-react';

interface ResetRequest {
  id: string;
  name: string;
  email: string;
  role: string;
  reset_requested_at: string | null;
  karyawan: {
    nip: string;
    nama: string;
    jenis_karyawan: {
      nama_jenis: string;
    };
  } | null;
}

export default function ResetRequestsPage() {
  const [requests, setRequests] = useState<ResetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ResetRequest | null>(null);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/accounts/reset-requests', {
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal memuat permintaan');
      }

      setRequests(data.data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (user: ResetRequest) => {
    setSelectedUser(user);
    setShowResetModal(true);
    setNewPassword('');
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) return;

    if (newPassword.length < 6) {
      alert('Password minimal 6 karakter');
      return;
    }

    try {
      setProcessing(selectedUser.id);

      const response = await fetch('/api/accounts/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: selectedUser.id,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal mereset password');
      }

      alert('Password berhasil direset!');
      setShowResetModal(false);
      setSelectedUser(null);
      setNewPassword('');
      fetchRequests(); // Refresh list
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (userId: string) => {
    if (!confirm('Tolak permintaan reset password ini?')) return;

    try {
      setProcessing(userId);

      const response = await fetch('/api/accounts/reset-requests/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal menolak permintaan');
      }

      alert('Permintaan ditolak');
      fetchRequests(); // Refresh list
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <AlertCircle className="h-7 w-7 text-yellow-600" />
          Permintaan Reset Password
        </h1>
        <p className="text-gray-600 mt-1">
          Kelola permintaan reset password dari karyawan
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {requests.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Tidak Ada Permintaan Pending
          </h3>
          <p className="text-gray-600">
            Semua permintaan reset password telah diproses
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="bg-white rounded-lg shadow p-4 sm:p-6 border-l-4 border-yellow-500"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 sm:gap-3 mb-3">
                    <div className="flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                        {request.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
                        <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                        {request.email}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-medium mb-1">
                        Data Karyawan
                      </p>
                      {request.karyawan ? (
                        <div className="text-xs sm:text-sm">
                          <p className="font-medium text-gray-900">
                            {request.karyawan.nama}
                          </p>
                          <p className="text-gray-600">NIP: {request.karyawan.nip}</p>
                          <p className="text-gray-600">
                            {request.karyawan.jenis_karyawan.nama_jenis}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs sm:text-sm text-gray-400">-</p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 uppercase font-medium mb-1">
                        Waktu Permintaan
                      </p>
                      <p className="text-xs sm:text-sm text-gray-900 flex items-center gap-2">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                        {formatDate(request.reset_requested_at)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-row sm:flex-col gap-2 sm:ml-4">
                  <button
                    onClick={() => handleApprove(request)}
                    disabled={processing === request.id}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {processing === request.id ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    Reset
                  </button>

                  <button
                    onClick={() => handleReject(request.id)}
                    disabled={processing === request.id}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {processing === request.id ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    Tolak
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Reset Password
            </h2>
            <p className="text-gray-600 mb-4">
              Reset password untuk <strong>{selectedUser.name}</strong>
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password Baru
              </label>
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Password akan diubah menjadi value ini
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleResetPassword}
                disabled={!newPassword || processing === selectedUser.id}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {processing === selectedUser.id ? 'Memproses...' : 'Konfirmasi Reset'}
              </button>
              <button
                onClick={() => {
                  setShowResetModal(false);
                  setSelectedUser(null);
                  setNewPassword('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
