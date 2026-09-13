import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const accountType = formData.get('accountType') as string; // 'admin' or 'employee'
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string || 'User';

    if (!email || !password) {
      return NextResponse.redirect(new URL('/?error=missing_fields', request.url));
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.redirect(new URL('/?error=email_exists', request.url));
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    let newUser;

    if (accountType === 'admin') {
      const companyName = formData.get('companyName') as string;
      if (!companyName) {
        return NextResponse.redirect(new URL('/?error=missing_company', request.url));
      }
      
      // Create Organization and Admin User
      const organization = await prisma.organization.create({
        data: {
          name: companyName,
          members: {
            create: { email, passwordHash, name, role: 'ADMIN' }
          }
        },
        include: { members: true }
      });
      newUser = organization.members[0];
    } else {
      // Create independent Employee (Waiting for organization assignment)
      newUser = await prisma.user.create({
        data: { email, passwordHash, name, role: 'WAREHOUSE_STAFF' }
      });
    }

    const response = NextResponse.redirect(new URL('/dashboard', request.url), 303);
    response.cookies.set('session_user', newUser.id, { httpOnly: true });
    if (newUser.organizationId) {
      response.cookies.set('session_org', newUser.organizationId, { httpOnly: true });
    }
    return response;

  } catch (error) {
    console.error("Registration Error:", error);
    return NextResponse.redirect(new URL('/?error=server_error', request.url));
  }
}
