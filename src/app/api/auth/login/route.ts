import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const rawEmail = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!rawEmail || !password) {
      return NextResponse.redirect(new URL('/?error=missing_fields', request.url));
    }

    const email = rawEmail.trim().toLowerCase();

    // Find User (case-insensitive email)
    const user = await prisma.user.findFirst({ 
      where: { 
        email: {
          equals: email
        } 
      } 
    });

    if (!user) {
      return NextResponse.redirect(new URL('/?error=invalid_credentials', request.url));
    }

    // Verify Password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.redirect(new URL('/?error=invalid_credentials', request.url));
    }

    // Redirect to dashboard on success with root-scoped cookies
    const response = NextResponse.redirect(new URL('/dashboard', request.url), 303);
    response.cookies.set('session_user', user.id, { 
      httpOnly: true, 
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });
    if (user.organizationId) {
      response.cookies.set('session_org', user.organizationId, { 
        httpOnly: true, 
        path: '/',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7
      });
    }
    return response;

  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.redirect(new URL('/?error=server_error', request.url));
  }
}
