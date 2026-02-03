import { redirect } from 'next/navigation';

/**
 * Halaman Root - Redirect langsung ke halaman login
 */
export default function Home() {
  redirect('/login');
}
