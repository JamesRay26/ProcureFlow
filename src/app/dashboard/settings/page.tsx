import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import SettingsClient from './SettingsClient';

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const cookieStore = cookies();
  const manualUserId = cookieStore.get('session_user')?.value;

  if (!session && !manualUserId) {
    redirect('/');
  }

  let user = null;
  if (session?.user?.email) {
    user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { organization: { include: { members: true } } }
    });
  } else if (manualUserId) {
    user = await prisma.user.findUnique({
      where: { id: manualUserId },
      include: { organization: { include: { members: true } } }
    });
  }

  if (!user || !user.organization) redirect('/dashboard');

  const isAdmin = user.role === 'ADMIN' || user.role === 'SYSTEM_ADMIN';

  const members = user.organization.members.map(m => ({
    id: m.id,
    name: m.name,
    email: m.email,
    role: m.role,
    isSelf: m.id === user!.id,
  }));

  return (
    <SettingsClient 
      isAdmin={isAdmin} 
      orgName={user.organization.name}
      orgId={user.organization.id}
      members={members}
      currentUserRole={user.role}
    />
  );
}
