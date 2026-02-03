'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  karyawan: {
    nama: string;
    nip: string;
    no_hp: string;
    alamat: string;
    jenis_karyawan: {
      nama_jenis: string;
      jam_masuk: string;
      jam_pulang: string;
    };
  } | null;
}

export default function AkunPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        
        if (res.status === 401) {
          router.push('/login');
          return;
        }

        const data = await res.json();
        console.log('API Response:', data); // Debug
        if (data.success) {
          setProfile(data.user);
          console.log('Profile set:', data.user); // Debug
        }
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const formatTime = (time: string) => {
    return time.substring(0, 5);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Akun Saya</h1>
        <p className="text-gray-500 text-sm mt-1">Informasi akun dan pengaturan</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-100 to-red-50 flex items-center justify-center mx-auto ring-4 ring-white shadow-lg">
                <span className="text-red-600 font-bold text-2xl">
                  {profile?.karyawan?.nama?.charAt(0).toUpperCase() || profile?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-800">
                {profile?.karyawan?.nama || profile?.name}
              </h3>
              <p className="text-sm text-gray-500">{profile?.karyawan?.nip || '-'}</p>
              <span className="inline-flex items-center mt-2 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                {profile?.karyawan?.jenis_karyawan?.nama_jenis || 'Karyawan'}
              </span>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center">
                Untuk mengubah password, silakan hubungi Admin.
              </p>
            </div>
          </div>
        </div>

        {/* Info Details */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Informasi Akun</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Nama Lengkap</label>
                  <p className="text-gray-800 font-medium">{profile?.karyawan?.nama || profile?.name}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">NIP</label>
                  <p className="text-gray-800 font-medium">{profile?.karyawan?.nip || '-'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Email</label>
                  <p className="text-gray-800 font-medium">{profile?.email}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">No. HP</label>
                  <p className="text-gray-800 font-medium">{profile?.karyawan?.no_hp || '-'}</p>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Alamat</label>
                  <p className="text-gray-800 font-medium">{profile?.karyawan?.alamat || '-'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Jadwal Kerja */}
          {profile?.karyawan?.jenis_karyawan && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm mt-6">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800">Jadwal Kerja</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-green-600 font-medium">Jam Masuk</p>
                      <p className="text-lg font-bold text-green-700">{formatTime(profile.karyawan.jenis_karyawan.jam_masuk)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 font-medium">Jam Pulang</p>
                      <p className="text-lg font-bold text-blue-700">{formatTime(profile.karyawan.jenis_karyawan.jam_pulang)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
