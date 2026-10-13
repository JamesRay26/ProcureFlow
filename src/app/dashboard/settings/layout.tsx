import { getCurrentUser } from '@/lib/session';
import { can } from '@/lib/rbac';
import { redirect } from 'next/navigation';
export default async function AccessLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/');
  if (!can(user.role, 'team:manage')) redirect('/dashboard');
  return children;
}
