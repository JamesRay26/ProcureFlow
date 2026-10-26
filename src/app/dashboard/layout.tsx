import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Boxes, LogOut } from 'lucide-react';
import SidebarNav from '@/app/_components/SidebarNav';
import TopHeaderNav, { NotificationItem } from '@/app/_components/TopHeaderNav';

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

  // Fetch real alerts for the notification bell
  const notifications: NotificationItem[] = [];

  const urgentStockItems = await prisma.inventoryItem.findMany({
    where: {
      organizationId: user.organizationId as string,
      stock: { lte: 10 }
    },
    take: 4
  });

  urgentStockItems.forEach((item) => {
    if (item.stock === 0) {
      notifications.push({
        id: `stock-zero-${item.id}`,
        title: `Out of Stock: ${item.name}`,
        description: `Immediate restocking required. SKU ${item.sku} is at 0 units.`,
        time: 'Critical',
        type: 'urgent',
        link: '/dashboard/inventory'
      });
    } else {
      notifications.push({
        id: `stock-low-${item.id}`,
        title: `Low Stock: ${item.name}`,
        description: `Current stock (${item.stock}) is at or below threshold (${item.threshold}).`,
        time: 'Warning',
        type: 'warning',
        link: '/dashboard/inventory'
      });
    }
  });

  if (pendingApprovalsCount > 0) {
    notifications.push({
      id: 'pending-approvals',
      title: `${pendingApprovalsCount} Pending Approval${pendingApprovalsCount > 1 ? 's' : ''}`,
      description: 'Restocking requests are awaiting manager review.',
      time: 'Action',
      type: 'info',
      link: '/dashboard/approvals'
    });
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex font-sans transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-60 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 p-5 flex flex-col shrink-0 transition-colors duration-300">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 bg-slate-900 dark:bg-slate-700 rounded-lg flex items-center justify-center text-white">
            <Boxes className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">ProcureFlow</h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{user.organization.name}</p>
          </div>
        </div>

        <SidebarNav role={user.role} isAdmin={isAdmin} isManager={isManager} pendingApprovalsCount={pendingApprovalsCount} />

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-auto">
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-medium transition-colors">
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Interactive Top Header with Notifications and User Profile Dropdown */}
        <TopHeaderNav 
          user={{
            name: user.name,
            email: user.email,
            role: user.role,
            orgName: user.organization.name
          }}
          notifications={notifications}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
