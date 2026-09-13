import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const companyName = formData.get('companyName') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!companyName || !email || !password) {
      return NextResponse.redirect(new URL('/?error=missing_fields', request.url));
    }

    // Check if user or company already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.redirect(new URL('/?error=email_exists', request.url));
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create Organization and Admin User in a transaction
    const organization = await prisma.organization.create({
      data: {
        name: companyName,
        members: {
          create: {
            email,
            passwordHash,
            name: 'System Admin',
            role: 'ADMIN',
          }
        }
      },
      include: {
        members: true
      }
    });

    const newAdmin = organization.members[0];

    // Simple session simulation via cookies (In production use NextAuth)
    cookies().set('session_user', newAdmin.id, { httpOnly: true, secure: true });
    cookies().set('session_org', organization.id, { httpOnly: true, secure: true });

    // Redirect to dashboard on success
    return NextResponse.redirect(new URL('/dashboard', request.url), 303);

  } catch (error) {
    console.error("Registration Error:", error);
    return NextResponse.redirect(new URL('/?error=server_error', request.url));
  }
}
