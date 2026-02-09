'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Phone, MapPin, Clock, LogIn, LogOut, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';

interface UserProfile {
  id: string;
  name: string;
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
        if (res.status === 401) { router.push('/login'); return; }
        const data = await res.json();
        if (data.success) setProfile(data.user);
      } catch (error) {
        console.error('Fetch error:', error);
      } finally { setLoading(false); }
    };
    fetchProfile();
  }, []);

  const formatTime = (time: string) => time.substring(0, 5);

  if (loading) return <LoadingSpinner text="Memuat data..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Akun Saya</h1>
        <p className="text-muted-foreground text-sm mt-1">Informasi akun dan pengaturan</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <FadeIn className="lg:col-span-1">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto ring-4 ring-background shadow-lg">
                <span className="text-primary font-bold text-2xl">
                  {profile?.karyawan?.nama?.charAt(0).toUpperCase() || profile?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                {profile?.karyawan?.nama || profile?.name}
              </h3>
              <p className="text-sm text-muted-foreground">{profile?.karyawan?.nip || '-'}</p>
              <span className="inline-flex items-center mt-2 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                <Briefcase className="w-3 h-3 mr-1" />
                {profile?.karyawan?.jenis_karyawan?.nama_jenis || 'Karyawan'}
              </span>
              <div className="mt-6 pt-6 border-t">
                <p className="text-xs text-muted-foreground">Untuk mengubah password, silakan hubungi Admin.</p>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Info Details */}
        <div className="lg:col-span-2 space-y-6">
          <FadeIn delay={0.1}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><User className="w-4 h-4" /> Informasi Akun</CardTitle>
              </CardHeader>
              <CardContent>
                <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { icon: User, label: 'Nama Lengkap', value: profile?.karyawan?.nama || profile?.name },
                    { icon: Briefcase, label: 'NIP', value: profile?.karyawan?.nip || '-' },
                    { icon: Phone, label: 'No. HP', value: profile?.karyawan?.no_hp || '-' },
                  ].map(item => (
                    <StaggerItem key={item.label}>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2 mb-1">
                          <item.icon className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{item.label}</span>
                        </div>
                        <p className="text-foreground font-medium">{item.value}</p>
                      </div>
                    </StaggerItem>
                  ))}
                  <StaggerItem className="sm:col-span-2">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Alamat</span>
                      </div>
                      <p className="text-foreground font-medium">{profile?.karyawan?.alamat || '-'}</p>
                    </div>
                  </StaggerItem>
                </StaggerContainer>
              </CardContent>
            </Card>
          </FadeIn>

          {/* Jadwal Kerja */}
          {profile?.karyawan?.jenis_karyawan && (
            <FadeIn delay={0.2}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><Clock className="w-4 h-4" /> Jadwal Kerja</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg dark:bg-emerald-950/20">
                      <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                        <LogIn className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs text-emerald-600 font-medium">Jam Masuk</p>
                        <p className="text-lg font-bold text-emerald-700">{formatTime(profile.karyawan.jenis_karyawan.jam_masuk)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg dark:bg-blue-950/20">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <LogOut className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-blue-600 font-medium">Jam Pulang</p>
                        <p className="text-lg font-bold text-blue-700">{formatTime(profile.karyawan.jenis_karyawan.jam_pulang)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          )}
        </div>
      </div>
    </div>
  );
}
