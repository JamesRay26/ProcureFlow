import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { UserPlus } from 'lucide-react';

export default async function TeamPage({ searchParams }: { searchParams: { invite?: string, email?: string, error?: string } }) {
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

  if (!user || (user.role !== 'SYSTEM_ADMIN' && user.role !== 'ADMIN')) {
    redirect('/dashboard');
  }

  return (
    <>
      <header className="mb-8">
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Manage Team</h2>
        <p className="text-slate-500 font-medium mt-1 dark:text-slate-400">Invite new employees and manage permissions.</p>
      </header>

      {searchParams.error === 'server_error' && (
        <div className="mb-8 bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 flex items-center gap-3 shadow-sm animate-fade-in-up">
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <div>
            <p className="font-bold">Email Failed to Send</p>
            <p className="text-sm">Google rejected the App Password credentials. Please check your Gmail security alerts.</p>
          </div>
        </div>
      )}

      {searchParams.invite === 'success' && (
        <div className="mb-8 bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-200 flex items-center gap-3 shadow-sm animate-fade-in-up">
          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <div>
            <p className="font-bold">Invitation Email Sent!</p>
            <p className="text-sm">An official invite link has been emailed to {searchParams.email}.</p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Invite Team Members</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Generate an invite link to onboard a new employee to this workspace.</p>
          </div>
        </div>
        
        <form action="/api/invite-user" method="POST" className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Employee Email</label>
            <input type="email" name="email" required placeholder="worker@company.com" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
          </div>
          <div className="w-64">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Assign Role</label>
            <select name="role" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none">
              <option value="WAREHOUSE_STAFF">Warehouse Staff</option>
              <option value="PROCUREMENT_MANAGER">Procurement Manager</option>
              <option value="AUDITOR">Auditor</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <button type="submit" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> Generate Invite
          </button>
        </form>
      </div>
    </>
  );
}
