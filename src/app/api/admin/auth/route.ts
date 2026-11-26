import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  isAdminPasswordConfigured,
  isRequestAdminAuthenticated,
  verifyAdminPassword,
} from '../../../../lib/adminAuth';

export async function GET() {
  const authenticated = await isRequestAdminAuthenticated();
  return NextResponse.json({
    authenticated,
    configured: isAdminPasswordConfigured(),
  });
}

export async function POST(req: NextRequest) {
  if (!isAdminPasswordConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error: 'ADMIN_PASSWORD is not configured on the server.',
      },
      { status: 503 },
    );
  }

  let body: { password?: unknown } | null = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request payload.' }, { status: 400 });
  }

  const password = typeof body?.password === 'string' ? body.password : '';
  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ ok: false, error: 'Invalid admin password.' }, { status: 401 });
  }

  const token = createAdminSessionToken(60 * 60 * 12);
  if (!token) {
    return NextResponse.json({ ok: false, error: 'Failed to create session.' }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true, authenticated: true });
  res.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true, authenticated: false });
  res.cookies.set(ADMIN_SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return res;
}
