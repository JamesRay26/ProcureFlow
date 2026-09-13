'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, FileText, CheckCircle, ScrollText, Users, Settings } from 'lucide-react';

export default function SidebarNav({ isAdmin, isManager, pendingApprovalsCount = 0 }: { isAdmin: boolean, isManager: boolean, pendingApprovalsCount?: number }) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, exact: true },
    { name: 'Inventory', href: '/dashboard/inventory', icon: Package },
    { name: 'Requests', href: '/dashboard/requests', icon: FileText },
  ];

  if (isAdmin || isManager) {
    navItems.push({ 
      name: 'Approvals', 
      href: '/dashboard/approvals', 
      icon: CheckCircle, 
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined 
    } as any);
  }

  navItems.push({ name: 'Audit Log', href: '/dashboard/audit-log', icon: ScrollText });

  const isActive = (href: string, exact: boolean = false) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      <nav className="flex-1 flex flex-col gap-2">
        {navItems.map((item: any) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link 
              key={item.name}
              href={item.href} 
              className={`flex items-center justify-between px-4 py-3 font-bold transition-colors ${
                active 
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-l-4 border-blue-600 rounded-r-xl' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-400 rounded-xl'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5" /> {item.name}
              </div>
              {item.badge && (
                <span className="flex items-center justify-center w-5 h-5 bg-red-500 text-[10px] text-white rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {isAdmin && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <p className="px-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Admin Tools</p>
          <Link 
            href="/dashboard/team" 
            className={`flex items-center gap-3 px-4 py-3 font-bold transition-colors ${
              pathname.startsWith('/dashboard/team')
                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-l-4 border-indigo-600 rounded-r-xl' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-700 dark:hover:text-indigo-400 rounded-xl'
            }`}
          >
            <Users className="w-5 h-5" /> Manage Team
          </Link>
          <Link 
            href="/dashboard/settings" 
            className={`flex items-center gap-3 px-4 py-3 font-bold transition-colors ${
              pathname.startsWith('/dashboard/settings')
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-200 border-l-4 border-slate-500 rounded-r-xl' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 rounded-xl'
            }`}
          >
            <Settings className="w-5 h-5" /> Settings
          </Link>
        </div>
      )}
    </>
  );
}
