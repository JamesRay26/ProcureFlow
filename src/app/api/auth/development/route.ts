import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  const url = new URL(request.url);
  const localHosts = ['localhost', '127.0.0.1', '[::1]'];
  if (process.env.NODE_ENV !== 'development' || !localHosts.includes(url.hostname)) {
    return new NextResponse('Not found', { status: 404 });
  }
  const origin = request.headers.get('origin');
  if (origin && origin !== url.origin) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  try {
    const passwordHash = await bcrypt.hash(randomBytes(32).toString('hex'), 10);
    const user = await prisma.$transaction(async (db) => {
      const organization = await db.organization.upsert({
        where: { name: 'Local Development Workspace' },
        update: {},
        create: { name: 'Local Development Workspace' },
      });
      return db.user.upsert({
        where: { email: 'local-developer@procureflow.invalid' },
        update: { role: 'ADMIN', organizationId: organization.id },
        create: {
          email: 'local-developer@procureflow.invalid',
          name: 'Local Developer',
          passwordHash,
          role: 'ADMIN',
          organizationId: organization.id,
        },
      });
    });
    const response = NextResponse.redirect(new URL('/dashboard', url), 303);
    const options = { httpOnly: true, sameSite: 'lax' as const, path: '/' };
    response.cookies.set('session_user', user.id, options);
    response.cookies.set('session_org', user.organizationId!, options);
    return response;
  } catch (error) {
    console.error('Local development access failed:', error);
    return new NextResponse('Unable to open the local development workspace. Please try again.', { status: 500 });
  }
}
