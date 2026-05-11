import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'crypto';
import { prisma } from './prisma';

const SESSION_COOKIE = 'imf_session';
const LEGACY_COOKIE = 'imf_user_id';
const DEFAULT_SESSION_MAX_AGE = 60 * 60 * 2;
type CookieOptions = {
  httpOnly?: boolean;
  sameSite?: 'lax' | 'strict' | 'none';
  secure?: boolean;
  path?: string;
  maxAge?: number;
};
type CookieResponse = Response & {
  cookies: {
    set: (name: string, value: string, options?: CookieOptions) => void;
  };
};

function getSessionSecret() {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || process.env.TOSS_SECRET_KEY || 'iamnongbu-local-dev-secret';
}

function getSessionMaxAge() {
  const value = Number(process.env.AUTH_SESSION_MAX_AGE_SECONDS || DEFAULT_SESSION_MAX_AGE);
  return Number.isInteger(value) && value > 0 ? value : DEFAULT_SESSION_MAX_AGE;
}

function sign(value: string) {
  return createHmac('sha256', getSessionSecret()).update(value).digest('base64url');
}

function verifySignedValue(value?: string) {
  if (!value) return null;
  const [payload, signature] = value.split('.');
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { userId?: string; exp?: number };
    if (!data.userId || !data.exp || data.exp < Date.now()) return null;
    return data.userId;
  } catch {
    return null;
  }
}

export function createSessionCookieValue(userId: string) {
  const payload = Buffer.from(JSON.stringify({ userId, exp: Date.now() + getSessionMaxAge() * 1000 })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function setAuthCookies(res: CookieResponse, userId: string) {
  const options = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: getSessionMaxAge(),
  };

  res.cookies.set(SESSION_COOKIE, createSessionCookieValue(userId), options);
  res.cookies.set(LEGACY_COOKIE, '', { path: '/', maxAge: 0 });
}

export function clearAuthCookies(res: CookieResponse) {
  res.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
  res.cookies.set(LEGACY_COOKIE, '', { path: '/', maxAge: 0 });
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = verifySignedValue(cookieStore.get(SESSION_COOKIE)?.value);
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) return null;
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') return null;
  return user;
}
