import { cookies } from 'next/headers';
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

// Server-side JWT helpers (jose, edge-compatible).
// The middleware runs on the edge runtime so Prisma cannot be used
// directly: session verification only validates the signature
// and reads the claims (userId, email). Any DB lookup happens in
// server components / API routes (Node runtime).

export const SESSION_COOKIE = 'gymcoach-session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

// Tofu: when JWT_SECRET is unset, the signing key is derived from DATABASE_URL
// (see TOFU.md), so a copy that only has its database's settings still signs
// sessions with a key nobody else knows. The derivation uses Web Crypto, which
// the Edge runtime (this file runs in middleware) and Node share, so both give
// the same key. A JWT_SECRET that is set is used as before.
const DERIVED_SECRET_LABEL = 'gymcoach session signing key v1';
let derivedSecret: { from: string; key: Promise<Uint8Array> } | undefined;

async function deriveSecret(databaseUrl: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const key = await globalThis.crypto.subtle.importKey(
    'raw',
    encoder.encode(databaseUrl),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = await globalThis.crypto.subtle.sign('HMAC', key, encoder.encode(DERIVED_SECRET_LABEL));
  return new Uint8Array(mac);
}

async function getSecret(): Promise<Uint8Array> {
  const secret = process.env.JWT_SECRET;
  if (secret) {
    if (secret.length < 32) {
      throw new Error('JWT_SECRET missing or too short (min 32 chars).');
    }
    return new TextEncoder().encode(secret);
  }
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error('JWT_SECRET missing or too short (min 32 chars).');
  }
  if (derivedSecret?.from !== databaseUrl) {
    derivedSecret = { from: databaseUrl, key: deriveSecret(databaseUrl) };
  }
  return derivedSecret.key;
}

export interface SessionClaims extends JWTPayload {
  userId: string;
  email: string;
}

export async function signSession(claims: { userId: string; email: string }): Promise<string> {
  return new SignJWT({ userId: claims.userId, email: claims.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(await getSecret());
}

export async function verifySession(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, await getSecret());
    if (typeof payload.userId !== 'string' || typeof payload.email !== 'string') {
      return null;
    }
    return payload as SessionClaims;
  } catch {
    return null;
  }
}

// To be called in server components / API routes (Node runtime).
export async function getCurrentSession(): Promise<SessionClaims | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function requireSession(): Promise<SessionClaims> {
  const session = await getCurrentSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

// Handy shortcut in the API routes: returns the userId or null.
// The middleware already blocks protected routes with a 401 JSON,
// but we keep this handler-side guard for edge cases (token expired
// between the middleware check and arriving here, or a route missing
// from the matcher).
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getCurrentSession();
  return session?.userId ?? null;
}

// Secure by default in production. Self-hosters serving plain HTTP on a
// trusted LAN must opt out explicitly with SESSION_COOKIE_SECURE=false;
// deriving the default from NEXTAUTH_URL would silently drop the flag when
// that variable is left at its example value. The same decision applies to
// every cookie the app sets (the locale cookie reuses it): the flag is never
// derived from ambient request data such as X-Forwarded-Proto, which a client
// can send itself.
export function cookieSecureFlag(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.SESSION_COOKIE_SECURE
    ? env.SESSION_COOKIE_SECURE === 'true'
    : env.NODE_ENV === 'production';
}

const sessionCookieSecure = cookieSecureFlag();

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SESSION_TTL_SECONDS,
  secure: sessionCookieSecure,
};
