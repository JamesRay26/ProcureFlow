'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { switchUserRole } from '@/app/actions';
import { 
  Bell, 
  ChevronDown, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Truck, 
  FileText, 
  Settings, 
  Users, 
  Package, 
  LogOut, 
  Check, 
  Trash2,
  Shield,
  UserCheck
} from 'lucide-react';

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'urgent' | 'warning' | 'info';
  link: string;
}

interface TopHeaderNavProps {
  user: {
    name: string;
    email?: string;
    role: string;
    orgName?: string;
  };
  notifications?: NotificationItem[];
}

export default function TopHeaderNav({ user, notifications: initialNotifications = [] }: TopHeaderNavProps) {
  const router = useRouter();
  const [isBellOpen, setIsBellOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState<number>(initialNotifications.length);

  const bellRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const handleSwitchRole = async (targetEmail: string) => {
    try {
      setSwitching(true);
      await switchUserRole(targetEmail);
      setIsProfileOpen(false);
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Failed to switch test account.');
    } finally {
      setSwitching(false);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setIsBellOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllAsRead = () => {
    setUnreadCount(0);
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return (
    <header className="h-20 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 shrink-0 transition-colors duration-300 z-30">
      {/* Search Input */}
      <div className="relative w-72 md:w-96">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input 
          type="text" 
          placeholder="Search requests, items, or IDs..." 
          className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
        />
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        {/* Notification Bell Dropdown */}
        <div className="relative" ref={bellRef}>
          <button 
            type="button"
            onClick={() => {
              setIsBellOpen(!isBellOpen);
              setIsProfileOpen(false);
            }}
            aria-label="Notifications"
            className="relative p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all hover:scale-105 active:scale-95"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-[10px] font-extrabold text-white rounded-full flex items-center justify-center border-2 border-white dark:border-slate-950 shadow-sm animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {isBellOpen && (
            <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/70 dark:bg-slate-900/70">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllAsRead} 
                      className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Mark read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button 
                      onClick={clearAllNotifications} 
                      className="text-slate-400 hover:text-red-500 transition-colors p-1"
                      title="Clear all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">
                    <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500/70 mb-2" />
                    No new notifications. Everything is up to date!
                  </div>
                ) : (
                  notifications.map((n) => (
                    <Link
                      key={n.id}
                      href={n.link}
                      onClick={() => setIsBellOpen(false)}
                      className="p-3.5 flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group block"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        n.type === 'urgent' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                        n.type === 'warning' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {n.type === 'urgent' ? <AlertTriangle className="w-4 h-4" /> :
                         n.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
                         <Truck className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                            {n.title}
                          </p>
                          <span className="text-[10px] text-slate-400 shrink-0 ml-2">{n.time}</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                          {n.description}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>

              <div className="p-2.5 bg-slate-50/70 dark:bg-slate-900/70 border-t border-slate-100 dark:border-slate-800 text-center">
                <Link 
                  href="/dashboard/inventory"
                  onClick={() => setIsBellOpen(false)}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View Inventory Alerts &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button 
            type="button"
            onClick={() => {
              setIsProfileOpen(!isProfileOpen);
              setIsBellOpen(false);
            }}
            className="flex items-center gap-3 pl-4 md:pl-6 border-l border-slate-200 dark:border-slate-800 text-left hover:opacity-85 transition-opacity"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20 text-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100 leading-tight flex items-center gap-1">
                {user.name}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold tracking-wide uppercase">
                {user.role.replace('_', ' ')}
              </p>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180 text-blue-600' : ''}`} />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Profile Header */}
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{user.name}</p>
                {user.email && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{user.email}</p>
                )}
                {user.orgName && (
                  <span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md">
                    🏢 {user.orgName}
                  </span>
                )}
              </div>

              {/* Navigation Links */}
              <div className="py-2">
                <Link 
                  href="/dashboard/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  Account Settings
                </Link>
                <Link 
                  href="/dashboard/team"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Users className="w-4 h-4 text-slate-400" />
                  Team Management
                </Link>
                <Link 
                  href="/dashboard/inventory"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Package className="w-4 h-4 text-slate-400" />
                  Inventory Items
                </Link>
                <Link 
                  href="/dashboard/requests"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <FileText className="w-4 h-4 text-slate-400" />
                  Procurement Requests
                </Link>
              </div>

              {/* RBAC Evaluation: Quick Test Account Switcher */}
              <div className="py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="px-4 mb-1.5 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Switch Test Account
                  </span>
                  {switching && (
                    <span className="text-[10px] text-blue-600 font-bold animate-pulse">Switching...</span>
                  )}
                </div>
                <div className="space-y-0.5 px-1">
                  <button
                    type="button"
                    onClick={() => handleSwitchRole('admin@procureflow.com')}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                      user.role === 'ADMIN' || user.role === 'SYSTEM_ADMIN'
                        ? 'text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40' 
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>👑 System Admin</span>
                    {(user.role === 'ADMIN' || user.role === 'SYSTEM_ADMIN') && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchRole('manager@procureflow.com')}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                      user.role === 'PROCUREMENT_MANAGER' 
                        ? 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40' 
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>💼 Procurement Manager</span>
                    {user.role === 'PROCUREMENT_MANAGER' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchRole('staff@procureflow.com')}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                      user.role === 'WAREHOUSE_STAFF' 
                        ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40' 
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>📦 Warehouse Staff</span>
                    {user.role === 'WAREHOUSE_STAFF' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchRole('auditor@procureflow.com')}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                      user.role === 'AUDITOR' 
                        ? 'text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40' 
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>🛡️ Auditor (Read-Only)</span>
                    {user.role === 'AUDITOR' && <Check className="w-3.5 h-3.5 text-purple-600" />}
                  </button>
                </div>
              </div>

              {/* Logout Form */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 px-2">
                <form action="/api/auth/logout" method="POST">
                  <button 
                    type="submit"
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
