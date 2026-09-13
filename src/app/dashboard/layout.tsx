import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Boxes, LogOut } from 'lucide-react';
import SidebarNav from '@/components/SidebarNav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  let userId = cookieStore.get('session_user')?.value;
  
  if (!userId) {
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      let dbUser = await prisma.user.findUnique({ where: { email: session.user.email } });
      if (dbUser) userId = dbUser.id;
    }
  }

  if (!userId) redirect('/');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { organization: true }
  });

  if (!user || !user.organization) {
    return <div className="min-h-screen flex items-center justify-center p-6 text-center bg-slate-50">{children}</div>;
  }

  const isAdmin = user.role === 'ADMIN';
  const isManager = user.role === 'PROCUREMENT_MANAGER';

  let pendingApprovalsCount = 0;
  if (isAdmin || isManager) {
    pendingApprovalsCount = await prisma.request.count({
      where: {
        organizationId: user.organizationId as string,
        status: 'PENDING'
      }
    });
  }

  return (
    <div className="min-h-screen bg-[#FDFDFE] dark:bg-slate-900 flex font-sans transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 p-6 flex flex-col shadow-sm shrink-0 transition-colors duration-300">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-slate-900 dark:text-white tracking-tight">ProcureFlow</h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">{user.organization.name}</p>
          </div>
        </div>

        <SidebarNav isAdmin={isAdmin} isManager={isManager} pendingApprovalsCount={pendingApprovalsCount} />

        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-auto">
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-bold transition-colors">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-20 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 shrink-0 transition-colors duration-300">
          <div className="relative w-96">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder="Search requests, items, or IDs..." 
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-6">
            {/* Notification Bell */}
            <button className="relative p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-[9px] font-bold text-white rounded-full flex items-center justify-center border-2 border-white dark:border-slate-950">3</span>
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-3 pl-6 border-l border-slate-200 dark:border-slate-800">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">
                {user.name.charAt(0)}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">{user.name}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{user.role}</p>
              </div>
              <svg className="w-4 h-4 text-slate-400 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
