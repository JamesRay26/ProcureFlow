import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
      return NextResponse.redirect(new URL('/?error=missing_fields', request.url));
    }

    // Find User
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.redirect(new URL('/?error=invalid_credentials', request.url));
    }

    // Verify Password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.redirect(new URL('/?error=invalid_credentials', request.url));
    }

    // Redirect to dashboard on success
    const response = NextResponse.redirect(new URL('/dashboard', request.url), 303);
    response.cookies.set('session_user', user.id, { httpOnly: true });
    if (user.organizationId) {
      response.cookies.set('session_org', user.organizationId, { httpOnly: true });
    }
    return response;

  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.redirect(new URL('/?error=server_error', request.url));
  }
}
