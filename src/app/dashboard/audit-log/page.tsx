import { Download, Search, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function AuditLogPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/');
  if (!user.organizationId) redirect('/dashboard');

  const dbLogs = await prisma.auditLog.findMany({
    where: { organizationId: user.organizationId },
    include: { user: true },
    orderBy: { createdAt: 'desc' }
  });

  const logs = dbLogs.map(log => {
    let actionColor = 'bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-400';
    if (log.actionType === 'APPROVAL') actionColor = 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400';
    if (log.actionType === 'REJECTION') actionColor = 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400';
    if (log.actionType === 'CREATION') actionColor = 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400';

    return {
      id: log.id,
      timestamp: new Date(log.createdAt).toLocaleString('en-US', { hour12: false }),
      user: log.user.name,
      initials: log.user.name.substring(0, 2).toUpperCase(),
      avatarColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      role: log.user.role,
      action: log.actionType,
      actionColor,
      requestId: log.requestId ? log.requestId.slice(0,8).toUpperCase() : '-',
      detailsTitle: log.description,
      detailsSub: '',
      ip: log.ipAddress || '192.168.1.1'
    };
  });

  return (
    <>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Audit Trail</h2>
          <p className="text-slate-500 font-medium mt-1 dark:text-slate-400">Complete history of all procurement actions and system events</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold transition-colors">
          <Download className="w-4 h-4" /> Export Report
        </button>
      </div>

      {/* Filters Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Date Range</label>
            <div className="relative">
              <select className="w-full pl-4 pr-10 py-2.5 appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer">
                <option>Sept 1 - Sept 7, 2026</option>
                <option>Last 30 Days</option>
                <option>This Year</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">User</label>
            <div className="relative">
              <select className="w-full pl-4 pr-10 py-2.5 appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer">
                <option>All Users</option>
                <option>Sarah Miller</option>
                <option>System Admin</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Action Type</label>
            <div className="relative">
              <select className="w-full pl-4 pr-10 py-2.5 appearance-none bg-blue-50 dark:bg-blue-900/10 border-2 border-blue-600 rounded-lg text-sm font-bold text-blue-700 dark:text-blue-400 outline-none cursor-pointer">
                <option>All Actions (Active)</option>
                <option>Approved</option>
                <option>Rejected</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600 dark:text-blue-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Search Log</label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search keyword, IP..." 
                className="w-full pl-4 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <th className="px-6 py-4 text-xs font-bold text-slate-900 dark:text-slate-100">Timestamp</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-900 dark:text-slate-100">User</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-900 dark:text-slate-100">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-900 dark:text-slate-100">Action</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-900 dark:text-slate-100">Request ID</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-900 dark:text-slate-100">Item / Details</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-900 dark:text-slate-100">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 bg-white dark:bg-slate-800">
              {logs.map((log, i) => (
                <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">{log.timestamp}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${log.avatarColor}`}>
                        {log.initials}
                      </div>
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">{log.user}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{log.role}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold ${log.actionColor}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-bold ${log.requestId !== '-' ? 'text-blue-600 dark:text-blue-400 cursor-pointer hover:underline' : 'text-slate-400 dark:text-slate-500'}`}>
                      {log.requestId}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{log.detailsTitle}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{log.detailsSub}</p>
                  </td>
                  <td className="px-6 py-4 text-[13px] text-slate-500 dark:text-slate-400">{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Showing {logs.length} events</p>
          <div className="flex gap-1">
            <a href="?page=1" className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </a>
            <a href="?page=1" className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 text-white font-bold transition-colors shadow-sm shadow-blue-500/20">1</a>
            <a href="?page=2" className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold transition-colors">2</a>
            <a href="?page=3" className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold transition-colors">3</a>
            <a href="?page=2" className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
