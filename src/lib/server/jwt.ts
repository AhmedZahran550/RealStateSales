import { SignJWT, jwtVerify } from 'jose';
import { UserRole } from '@/lib/types';

export interface AuthTokenPayload {
  sub: string;
  username: string;
  fullName: string;
  role: UserRole;
  companyId?: string | null;
}

const JWT_SECRET_STRING =
  process.env.JWT_SECRET || 'el-waha-jwt-super-secret-key-badr-city-2026';
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

export const AUTH_COOKIE_NAME = 'auth_token';
export const TOKEN_EXPIRY_DAYS = 7;

/**
 * Sign a JWT token containing user identity and role
 */
export async function signJwt(payload: AuthTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_EXPIRY_DAYS}d`)
    .sign(JWT_SECRET);
}

/**
 * Verify and decode a JWT token
 */
export async function verifyJwt(token: string): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      sub: payload.sub as string,
      username: payload.username as string,
      fullName: payload.fullName as string,
      role: payload.role as UserRole,
      companyId: (payload.companyId as string | null) || undefined,
    };
  } catch {
    return null;
  }
}
