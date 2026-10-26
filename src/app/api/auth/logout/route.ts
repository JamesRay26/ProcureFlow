import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL('/', request.url), 303);
  response.cookies.set('session_user', '', { path: '/', maxAge: 0 });
  response.cookies.set('session_org', '', { path: '/', maxAge: 0 });
  response.cookies.set('next-auth.session-token', '', { path: '/', maxAge: 0 });
  response.cookies.set('next-auth.csrf-token', '', { path: '/', maxAge: 0 });
  response.cookies.set('next-auth.callback-url', '', { path: '/', maxAge: 0 });
  return response;
}
