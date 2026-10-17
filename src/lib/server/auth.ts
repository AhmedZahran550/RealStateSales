import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJwt, AUTH_COOKIE_NAME, AuthTokenPayload } from './jwt';
import { UserRole } from '@/lib/types';

/**
 * Hash a plain password using bcrypt (10 rounds)
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, 10);
}

/**
 * Verify a plain password against a bcrypt hash or legacy string
 */
export async function verifyPassword(
  plainPassword: string,
  storedPasswordHash: string
): Promise<boolean> {
  if (!plainPassword || !storedPasswordHash) return false;

  // If it's a bcrypt hash
  if (
    storedPasswordHash.startsWith('$2a$') ||
    storedPasswordHash.startsWith('$2b$') ||
    storedPasswordHash.startsWith('$2y$')
  ) {
    return bcrypt.compare(plainPassword, storedPasswordHash);
  }

  // Fallback for plain text comparison during migration
  return plainPassword === storedPasswordHash;
}

/**
 * Extract authenticated user payload from the request cookies or Authorization header
 */
export async function getAuthenticatedUser(
  request?: NextRequest
): Promise<AuthTokenPayload | null> {
  let token: string | undefined;

  // 1. Try reading from request cookies if request passed
  if (request) {
    token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

    // 2. Or from Bearer Authorization header
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
  }

  // 3. Fallback to next/headers cookies()
  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    } catch {}
  }

  if (!token) return null;

  return verifyJwt(token);
}

/**
 * Require authentication in API route handler. Throws an error response if unauthenticated or unauthorized.
 */
export async function requireAuth(
  request?: NextRequest,
  allowedRoles?: UserRole[]
): Promise<AuthTokenPayload> {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    throw new Error('UNAUTHORIZED');
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasRole =
      allowedRoles.includes(user.role) ||
      (allowedRoles.includes('company_admin') && user.role === 'admin') ||
      user.role === 'super_admin'; // super_admin has access to everything

    if (!hasRole) {
      throw new Error('FORBIDDEN');
    }
  }

  return user;
}

/**
 * Standard API error response helper
 */
export function handleApiError(err: any): NextResponse {
  // If it's a Next.js internal prerender or redirect signal, rethrow it
  if (err?.digest?.startsWith('NEXT_')) {
    throw err;
  }

  console.error('API Error:', err);

  if (err?.message === 'UNAUTHORIZED') {
    return NextResponse.json(
      { success: false, error: 'غير مصرح، يرجى تسجيل الدخول أولاً' },
      { status: 401 }
    );
  }

  if (err?.message === 'FORBIDDEN') {
    return NextResponse.json(
      { success: false, error: 'ليس لديك الصلاحية الكافية لتنفيذ هذا الإجراء' },
      { status: 403 }
    );
  }

  return NextResponse.json(
    { success: false, error: err?.message || 'حدث خطأ غير متوقع في الخادم' },
    { status: 500 }
  );
}
