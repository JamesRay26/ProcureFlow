import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { isLocalDeveloper, roles } from '@/lib/rbac';

export async function POST(request: Request) {
  const url = new URL(request.url);
  const user = await getCurrentUser();
  if (!isLocalDeveloper(user, url.host)) return new NextResponse('Not found', { status: 404 });
  if (request.headers.get('origin') !== url.origin) return new NextResponse('Forbidden', { status: 403 });
  const data = await request.formData();
  const role = data.get('role');
  if (!roles.some(option => option.value === role)) return new NextResponse('Invalid role', { status: 400 });
  const response = NextResponse.redirect(new URL('/dashboard', url), 303);
  response.cookies.set('development_role', role as string, { httpOnly: true, sameSite: 'lax', path: '/' });
  return response;
}
