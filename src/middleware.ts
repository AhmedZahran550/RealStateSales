import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt, AUTH_COOKIE_NAME } from '@/lib/server/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. استثناء مسارات الملفات الثابتة والـ APIs العامة
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/upload') ||
    pathname === '/favicon.ico' ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.webp')
  ) {
    return NextResponse.next();
  }

  // 2. التحقق من التوكن المشفر في الكوكيز
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const user = token ? await verifyJwt(token) : null;

  const isLoginPage = pathname === '/login';

  // إذا لم يكن المستخدم مسجل دخوله ويحاول دخول صفحة محمية
  if (!user && !isLoginPage) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح، يرجى تسجيل الدخول أولاً' },
        { status: 401 }
      );
    }
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // إذا كان مسجل دخوله بالفعل ويحاول فتح صفحة تسجيل الدخول
  if (user && isLoginPage) {
    const targetUrl = user.role === 'super_admin' ? '/super-admin' : '/';
    return NextResponse.redirect(new URL(targetUrl, request.url));
  }

  // 3. التحقق من صلاحيات المسارات للصفحات بناء على الدور (Role-based Route Protection)
  if (user && !pathname.startsWith('/api/')) {
    const isSuper = user.role === 'super_admin';
    const isCompAdmin = user.role === 'company_admin' || user.role === 'admin';
    const isBroker = user.role === 'user';

    // مسارات Super Admin
    if (pathname.startsWith('/super-admin') && !isSuper) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // مسارات Admin
    if (pathname.startsWith('/admin') && isBroker) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // مسارات العملاء (CRM) مخصصة حصراً للوسطاء
    if (isSuper && (pathname.startsWith('/customers') || pathname === '/matching')) {
      return NextResponse.redirect(new URL('/super-admin', request.url));
    }
    if (isCompAdmin && (pathname.startsWith('/customers') || pathname === '/matching')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     */
    '/((?!_next/static|_next/image).*)',
  ],
};
