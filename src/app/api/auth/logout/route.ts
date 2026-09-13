import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  cookies().delete('session_user');
  cookies().delete('session_org');
  cookies().delete('next-auth.session-token');
  cookies().delete('next-auth.csrf-token');
  cookies().delete('next-auth.callback-url');
  return NextResponse.redirect(new URL('/', request.url), 303);
}
