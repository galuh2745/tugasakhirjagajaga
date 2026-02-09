'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { User, Lock, ArrowRight, Loader2, Info, ShieldCheck, BarChart3, Zap, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');

  const [nip, setNip] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotNip, setForgotNip] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nip, password }),
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Login berhasil! Mengalihkan...');
        if (redirect) {
          window.location.href = redirect;
        } else {
          const role = data.data.user.role;
          if (role === 'ADMIN' || role === 'OWNER') {
            window.location.href = '/dashboard/admin';
          } else {
            window.location.href = '/dashboard/user';
          }
        }
      } else {
        setError(data.message || 'NIP atau password salah');
        toast.error(data.message || 'NIP atau password salah');
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi. Silakan coba lagi.');
      toast.error('Gagal terhubung ke server');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotNip) {
      toast.error('NIP harus diisi');
      return;
    }

    setForgotLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nip: forgotNip }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Permintaan reset password berhasil dikirim ke admin!');
        setTimeout(() => {
          setShowForgotModal(false);
          setForgotNip('');
        }, 1500);
      } else {
        toast.error(data.error || 'Gagal mengirim permintaan');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ===== BRANDING (KIRI) ===== */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="lg:w-1/2 text-white p-8 lg:p-12 flex flex-col justify-center relative"
        style={{
          backgroundImage: 'url(/images/logo/logocv.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0 bg-black/60" />

        <div className="max-w-md mx-auto lg:mx-0 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mb-8"
          >
            <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
              <ShieldCheck className="w-12 h-12 text-white" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-4xl lg:text-5xl font-bold mb-3"
          >
            CV Aswi Sentosa Lampung
          </motion.h1>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-xl lg:text-2xl font-light text-gray-200 mb-6"
          >
            Sistem Enterprise Management
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-gray-300 leading-relaxed mb-8 text-sm lg:text-base"
          >
            Berinovasi Dengan Kualitas Terbaik.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="flex flex-wrap gap-4 text-sm"
          >
            {[
              { icon: ShieldCheck, label: 'Higienis' },
              { icon: BarChart3, label: 'Akurat' },
              { icon: Zap, label: 'Cepat' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </div>
            ))}
          </motion.div>

          <div className="hidden lg:block mt-12 pt-8 border-t border-white/20">
            <p className="text-gray-300 text-sm">
              © 2026 CV Aswi Sentosa. All rights reserved.
            </p>
          </div>
        </div>
      </motion.div>

      {/* ===== FORM LOGIN (KANAN) ===== */}
      <div className="lg:w-1/2 bg-background p-8 lg:p-12 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-foreground mb-2">Selamat Datang</h3>
            <p className="text-muted-foreground">Silakan masuk untuk melanjutkan</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="nip">NIP</Label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="nip"
                  type="text"
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  className="pl-10 h-11"
                  placeholder="Masukkan NIP"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg"
              >
                <Info className="h-4 w-4 text-destructive flex-shrink-0" />
                <span className="text-destructive text-sm">{error}</span>
              </motion.div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 text-base"
              style={{ backgroundColor: '#8B6B1F' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#A67C00')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#8B6B1F')}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  Masuk
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-sm font-medium transition-colors hover:underline"
                style={{ color: '#8B6B1F' }}
              >
                Lupa Password?
              </button>
            </div>
          </form>

          {/* Forgot Modal */}
          {showForgotModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="max-w-md w-full">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Lupa Password</CardTitle>
                        <CardDescription>
                          Masukkan NIP untuk mengirim permintaan reset password ke admin.
                        </CardDescription>
                      </div>
                      <button
                        onClick={() => { setShowForgotModal(false); setForgotNip(''); }}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>NIP</Label>
                      <Input
                        type="text"
                        value={forgotNip}
                        onChange={(e) => setForgotNip(e.target.value)}
                        placeholder="Masukkan NIP"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={handleForgotPassword}
                        disabled={forgotLoading}
                        className="flex-1"
                        style={{ backgroundColor: '#8B6B1F' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#A67C00')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#8B6B1F')}
                      >
                        {forgotLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Mengirim...
                          </>
                        ) : (
                          'Kirim Permintaan'
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => { setShowForgotModal(false); setForgotNip(''); }}
                        className="flex-1"
                      >
                        Batal
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}

          {/* Divider */}
          <div className="my-8 flex items-center">
            <div className="flex-1 border-t border-border" />
            <span className="px-4 text-sm text-muted-foreground">Informasi</span>
            <div className="flex-1 border-t border-border" />
          </div>

          {/* Info Card */}
          <Card>
            <CardContent className="flex items-start gap-3 pt-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-amber-100">
                <Info className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h4 className="font-medium text-foreground text-sm mb-1">Butuh bantuan?</h4>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Hubungi admin jika Anda mengalami masalah saat login atau lupa password.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="lg:hidden mt-8 text-center">
            <p className="text-muted-foreground text-sm">© 2026 CV Aswi Sentosa Lampung</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
