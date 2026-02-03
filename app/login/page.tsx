'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * Halaman Login - Sistem Absensi Karyawan CV Aswi Sentosa
 * 
 * Desain:
 * - Split layout: Branding (kiri) + Form (kanan)
 * - Tema: Merah tua/maroon (industri pemotongan ayam)
 * - Responsive untuk karyawan lapangan (mobile-friendly)
 */
export default function LoginPage() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');

  /**
   * Handle form submission
   * - Validasi input
   * - Kirim request ke API
   * - Redirect berdasarkan role user
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        // Redirect berdasarkan role atau ke halaman yang diminta
        if (redirect) {
          window.location.href = redirect;
        } else {
          // Redirect berdasarkan role user
          const role = data.data.user.role;
          if (role === 'ADMIN' || role === 'OWNER') {
            window.location.href = '/dashboard/admin';
          } else {
            window.location.href = '/dashboard/user';
          }
        }
      } else {
        setError(data.message || 'Email atau password salah');
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle forgot password request
   */
  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      setForgotMessage('Email harus diisi');
      return;
    }

    setForgotLoading(true);
    setForgotMessage('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await response.json();

      if (data.success) {
        setForgotMessage('Permintaan reset password berhasil dikirim ke admin!');
        setTimeout(() => {
          setShowForgotModal(false);
          setForgotEmail('');
          setForgotMessage('');
        }, 2000);
      } else {
        setForgotMessage(data.error || 'Gagal mengirim permintaan');
      }
    } catch (err) {
      setForgotMessage('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ================================================
          BAGIAN BRANDING (KIRI)
          - Background gradasi merah tua
          - Logo dan informasi perusahaan
          ================================================ */}
      <div className="lg:w-1/2 bg-gradient-to-br from-red-900 via-red-800 to-red-900 text-white p-8 lg:p-12 flex flex-col justify-center">
        <div className="max-w-md mx-auto lg:mx-0">
          {/* Logo Icon */}
          <div className="mb-8">
            <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
              <svg 
                className="w-12 h-12 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" 
                />
              </svg>
            </div>
          </div>

          {/* Judul Perusahaan */}
          <h1 className="text-4xl lg:text-5xl font-bold mb-3">
            CV Aswi Sentosa
          </h1>
          
          {/* Subjudul */}
          <h2 className="text-xl lg:text-2xl font-light text-red-200 mb-6">
            Sistem Absensi Karyawan
          </h2>

          {/* Deskripsi */}
          <p className="text-red-100 leading-relaxed mb-8 text-sm lg:text-base">
            Mendukung operasional usaha pemotongan dan distribusi ayam 
            yang higienis, tertib, dan terkontrol secara digital.
          </p>

          {/* Tagline dengan ikon */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Higienis</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Akurat</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Cepat</span>
            </div>
          </div>

          {/* Decorative Line */}
          <div className="hidden lg:block mt-12 pt-8 border-t border-white/20">
            <p className="text-red-200 text-sm">
              © 2026 CV Aswi Sentosa. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* ================================================
          BAGIAN FORM LOGIN (KANAN)
          - Background putih bersih
          - Form login dengan validasi
          ================================================ */}
      <div className="lg:w-1/2 bg-gray-50 p-8 lg:p-12 flex items-center justify-center">
        <div className="w-full max-w-md">
          {/* Header Form */}
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Selamat Datang
            </h3>
            <p className="text-gray-600">
              Silakan masuk untuk melanjutkan
            </p>
          </div>

          {/* Form Login */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Input Email */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg 
                    className="w-5 h-5 text-gray-400" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" 
                    />
                  </svg>
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-white text-gray-900 placeholder-gray-400"
                  placeholder="nama@email.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Input Password */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg 
                    className="w-5 h-5 text-gray-400" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
                    />
                  </svg>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-white text-gray-900 placeholder-gray-400"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Pesan Error */}
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <svg 
                  className="w-5 h-5 text-red-500 flex-shrink-0" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}

            {/* Tombol Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-red-800 to-red-700 text-white font-semibold rounded-xl hover:from-red-900 hover:to-red-800 focus:ring-4 focus:ring-red-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg 
                    className="animate-spin w-5 h-5" 
                    fill="none" 
                    viewBox="0 0 24 24"
                  >
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                    />
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <span>Masuk</span>
                  <svg 
                    className="w-5 h-5" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M14 5l7 7m0 0l-7 7m7-7H3" 
                    />
                  </svg>
                </>
              )}
            </button>

            {/* Lupa Password Button */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-sm text-red-700 hover:text-red-800 font-medium hover:underline"
              >
                Lupa Password?
              </button>
            </div>
          </form>

          {/* Forgot Password Modal */}
          {showForgotModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Lupa Password
                </h2>
                <p className="text-gray-600 mb-4 text-sm">
                  Masukkan email Anda untuk mengirim permintaan reset password ke admin.
                </p>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                {forgotMessage && (
                  <div className={`mb-4 p-3 rounded-lg text-sm ${
                    forgotMessage.includes('berhasil') 
                      ? 'bg-green-50 text-green-700' 
                      : 'bg-red-50 text-red-700'
                  }`}>
                    {forgotMessage}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleForgotPassword}
                    disabled={forgotLoading}
                    className="flex-1 px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {forgotLoading ? 'Mengirim...' : 'Kirim Permintaan'}
                  </button>
                  <button
                    onClick={() => {
                      setShowForgotModal(false);
                      setForgotEmail('');
                      setForgotMessage('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="my-8 flex items-center">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-4 text-sm text-gray-500">Informasi</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          {/* Info Box */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg 
                  className="w-5 h-5 text-red-600" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 text-sm mb-1">
                  Butuh bantuan?
                </h4>
                <p className="text-gray-600 text-xs leading-relaxed">
                  Hubungi admin jika Anda mengalami masalah saat login 
                  atau lupa password.
                </p>
              </div>
            </div>
          </div>

          {/* Footer Mobile */}
          <div className="lg:hidden mt-8 text-center">
            <p className="text-gray-500 text-sm">
              © 2026 CV Aswi Sentosa
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}