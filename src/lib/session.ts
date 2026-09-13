import { cookies, headers } from 'next/headers';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from '@/lib/prisma';

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  const cookieStore = cookies();
  const manualUserId = cookieStore.get('session_user')?.value;

  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { organization: true }
    });
    return user;
  }

  if (manualUserId) {
    const user = await prisma.user.findUnique({
      where: { id: manualUserId },
      include: { organization: true }
    });
    return user;
  }

  return null;
}

export function getIpAddress() {
  const headersList = headers();
  const forwardedFor = headersList.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return headersList.get('x-real-ip') || '127.0.0.1';
}
