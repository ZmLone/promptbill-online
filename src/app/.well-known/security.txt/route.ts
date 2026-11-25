import { NextResponse } from 'next/server';

const SECURITY_TXT = `Contact: mailto:security@promptbill.online
Expires: 2027-11-25T23:59:59.000Z
Preferred-Languages: en, ur
Canonical: https://promptbill.online/.well-known/security.txt
`;

export function GET() {
  return new NextResponse(SECURITY_TXT, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
