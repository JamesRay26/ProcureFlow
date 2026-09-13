import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const token = formData.get('token') as string;
    const name = formData.get('name') as string;
    const password = formData.get('password') as string;

    if (!token || !name || !password) {
      return NextResponse.redirect(new URL('/?error=missing_fields', request.url));
    }

    // Find and validate invitation
    const invitation = await prisma.invitation.findUnique({ where: { token } });
    if (!invitation || new Date() > invitation.expiresAt) {
      return NextResponse.redirect(new URL('/?error=invalid_token', request.url));
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Run transaction: Create User, Delete Invitation
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: invitation.email,
          name,
          passwordHash,
          role: invitation.role,
          organizationId: invitation.organizationId
        }
      });
      
      await tx.invitation.delete({ where: { id: invitation.id } });
      
      return newUser;
    });

    // Sign them in
    cookies().set('session_user', user.id, { httpOnly: true });
    cookies().set('session_org', user.organizationId!, { httpOnly: true });

    return NextResponse.redirect(new URL('/dashboard', request.url), 303);

  } catch (error) {
    console.error("Accept Invite Error:", error);
    return NextResponse.redirect(new URL('/?error=server_error', request.url));
  }
}
