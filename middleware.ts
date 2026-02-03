import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'
);

// Daftar path yang memerlukan autentikasi
const protectedPaths = ['/dashboard', '/api/protected'];

// Daftar path yang hanya bisa diakses oleh role tertentu
const roleBasedPaths: Record<string, string[]> = {
  '/admin': ['ADMIN'],
  '/api/admin': ['ADMIN'],
  '/owner': ['OWNER', 'ADMIN'],
  '/api/owner': ['OWNER', 'ADMIN'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Cek apakah path memerlukan autentikasi
  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path));
  const roleBasedPath = Object.keys(roleBasedPaths).find((path) =>
    pathname.startsWith(path)
  );

  if (isProtectedPath || roleBasedPath) {
    // Ambil token dari cookie
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      // Redirect ke halaman login jika tidak ada token
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verifikasi token dengan jose (edge-compatible)
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const decoded = payload as { userId: string; role: string };

      // Cek role-based access
      if (roleBasedPath) {
        const allowedRoles = roleBasedPaths[roleBasedPath];
        if (!allowedRoles.includes(decoded.role)) {
          // Redirect ke unauthorized page atau home
          return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
      }
    } catch (error) {
      // Token tidak valid, redirect ke login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

// Konfigurasi matcher untuk middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
