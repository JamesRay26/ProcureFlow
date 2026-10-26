/* 
 * CS 490 SENIOR CAPSTONE - ROLE-BASED SIDEBAR NAVIGATION
 * Dynamic RBAC navigation reflecting assigned role permissions:
 * - WAREHOUSE_STAFF: Restricted from Approval Queue (TC-RBAC-01 / TC-RBAC-04)
 * - AUDITOR: Read-Only overview across all modules (TC-RBAC-02)
 * - ADMIN: Administrative tools & organization management (TC-RBAC-03)
 * - PROCUREMENT_MANAGER: Restocking approvals & logistics queue (TC-RW-03)
 */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, FileText, CheckCircle, ScrollText, Users, Settings, Shield, UserCheck, ScanBarcode, Truck } from 'lucide-react';

export default function SidebarNav({ 
  role = 'WAREHOUSE_STAFF', 
  pendingApprovalsCount = 0,
  isAdmin: legacyIsAdmin,
  isManager: legacyIsManager,
}: { 
  role?: string;
  pendingApprovalsCount?: number;
  isAdmin?: boolean;
  isManager?: boolean;
}) {
  const pathname = usePathname();

  const isAdmin = role === 'ADMIN' || role === 'SYSTEM_ADMIN' || Boolean(legacyIsAdmin);
  const isManager = role === 'PROCUREMENT_MANAGER' || Boolean(legacyIsManager);
  const isAuditor = role === 'AUDITOR';
  const isStaff = role === 'WAREHOUSE_STAFF';

  const navItems: Array<{ name: string; href: string; icon: React.ElementType; exact?: boolean; badge?: number }> = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, exact: true },
    { name: 'Inventory', href: '/dashboard/inventory', icon: Package },
    { name: 'Requests', href: '/dashboard/requests', icon: FileText },
  ];

  // TC-RBAC-04: Warehouse Staff are blocked from the Approval Queue
  // Managers, Admins, and Auditors (read-only) can access Approvals
  if (!isStaff) {
    navItems.push({ 
      name: 'Approvals', 
      href: '/dashboard/approvals', 
      icon: CheckCircle, 
      badge: isManager && pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined 
    });
  }

  navItems.push({ name: 'Tracking & Scanner', href: '/dashboard/tracking', icon: Truck });
  navItems.push({ name: 'Audit Log', href: '/dashboard/audit-log', icon: ScrollText });

  const isActive = (href: string, exact: boolean = false) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  // Role display config — no emojis, bold text with color-coded dot
  const roleConfig: Record<string, { label: string; color: string; dotColor: string }> = {
    ADMIN: { label: 'System Administrator', color: 'text-slate-700 dark:text-slate-200', dotColor: 'bg-indigo-500' },
    SYSTEM_ADMIN: { label: 'System Administrator', color: 'text-slate-700 dark:text-slate-200', dotColor: 'bg-indigo-500' },
    PROCUREMENT_MANAGER: { label: 'Procurement Manager', color: 'text-slate-700 dark:text-slate-200', dotColor: 'bg-blue-500' },
    WAREHOUSE_STAFF: { label: 'Warehouse Staff', color: 'text-slate-700 dark:text-slate-200', dotColor: 'bg-emerald-500' },
    AUDITOR: { label: 'Auditor (Read-Only)', color: 'text-slate-700 dark:text-slate-200', dotColor: 'bg-purple-500' },
  };

  const currentRole = roleConfig[role] || roleConfig['WAREHOUSE_STAFF'];

  return (
    <>
      {/* Current Active Role Badge */}
      <div className="mb-6 px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
          Active Role
        </span>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${currentRole.dotColor} shrink-0`}></span>
          <span className={`font-bold text-xs ${currentRole.color}`}>{currentRole.label}</span>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map((item: { name: string; href: string; icon: React.ElementType; exact?: boolean; badge?: number }) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link 
              key={item.name}
              href={item.href} 
              className={`flex items-center justify-between px-3.5 py-2.5 font-medium transition-colors rounded-lg text-sm ${
                active 
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-[18px] h-[18px]" /> {item.name}
              </div>
              {item.badge && (
                <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-500 text-[10px] text-white rounded-full font-bold">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {isAdmin && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <p className="px-3.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Administration</p>
          <Link 
            href="/dashboard/team" 
            className={`flex items-center gap-3 px-3.5 py-2.5 font-medium text-sm transition-colors rounded-lg ${
              pathname.startsWith('/dashboard/team')
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Users className="w-[18px] h-[18px]" /> Manage Team
          </Link>
          <Link 
            href="/dashboard/settings" 
            className={`flex items-center gap-3 px-3.5 py-2.5 font-medium text-sm transition-colors rounded-lg ${
              pathname.startsWith('/dashboard/settings')
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Settings className="w-[18px] h-[18px]" /> Settings
          </Link>
        </div>
      )}
    </>
  );
}
