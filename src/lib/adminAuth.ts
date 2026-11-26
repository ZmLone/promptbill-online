import crypto from 'crypto';
import { cookies } from 'next/headers';

export const ADMIN_SESSION_COOKIE = 'pb_admin_session';

function getSessionSecret(): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;
  if (!secret || !secret.trim()) return null;
  return crypto.createHash('sha256').update(`promptbill-admin:${secret}`).digest('hex');
}

export function isAdminPasswordConfigured(): boolean {
  const pw = process.env.ADMIN_PASSWORD;
  return typeof pw === 'string' && pw.trim().length > 0;
}

export function verifyAdminPassword(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !expected.trim() || typeof candidate !== 'string') {
    return false;
  }
  const a = Buffer.from(candidate, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function createAdminSessionToken(maxAgeSeconds = 60 * 60 * 12): string | null {
  const secret = getSessionSecret();
  if (!secret) return null;
  const exp = Math.floor(Date.now() / 1000) + maxAgeSeconds;
  const payload = Buffer.from(JSON.stringify({ role: 'admin', exp }), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyAdminSessionToken(token: string | undefined | null): boolean {
  if (!token || typeof token !== 'string') return false;
  const secret = getSessionSecret();
  if (!secret) return false;

  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;

  const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  const a = Buffer.from(sig, 'utf8');
  const b = Buffer.from(expectedSig, 'utf8');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return false;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);
    return parsed?.role === 'admin' && typeof parsed?.exp === 'number' && parsed.exp > now;
  } catch {
    return false;
  }
}

export async function isRequestAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  return verifyAdminSessionToken(token);
}
