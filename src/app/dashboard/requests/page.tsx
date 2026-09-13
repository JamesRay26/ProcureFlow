import prisma from '@/lib/prisma';
import { Plus, Filter, Search, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function RequestsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/');
  if (!user.organizationId) redirect('/dashboard');

  const dbRequests = await prisma.request.findMany({
    where: { organizationId: user.organizationId },
    include: { item: true, requestedBy: true },
    orderBy: { createdAt: 'desc' }
  });

  const requests = dbRequests.map(req => ({
    id: req.id.slice(0, 8).toUpperCase(),
    name: req.item.name,
    qty: req.quantity,
    warehouse: req.item.warehouse,
    priority: req.priority,
    status: req.status === 'PENDING' ? (req.justification ? 'Pending' : 'Draft') : req.status === 'APPROVED' ? 'Approved' : 'Rejected',
    by: req.requestedBy.name,
    date: new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }));

  return (
    <>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Procurement Requests</h2>
          <p className="text-slate-500 font-medium mt-1 dark:text-slate-400">View and manage all active restocking requests.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold transition-colors">
            <Filter className="w-5 h-5" /> Filter
          </button>
          <a href="/dashboard/requests/new" className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition-colors">
            <Plus className="w-5 h-5" /> New Request
          </a>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden mb-8">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by ID, item name, or requester..." 
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-700 dark:text-slate-300">Request ID</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-700 dark:text-slate-300">Item Name</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-700 dark:text-slate-300">Qty</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-700 dark:text-slate-300">Warehouse</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-700 dark:text-slate-300">Priority</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-700 dark:text-slate-300">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-700 dark:text-slate-300">Requested By</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-700 dark:text-slate-300">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
              {requests.map((req, i) => (
                <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-blue-600 dark:text-blue-400">{req.id}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-slate-100">{req.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{req.qty}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{req.warehouse}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold ${
                      req.priority === 'High' ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' :
                      req.priority === 'Medium' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' :
                      'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                    }`}>
                      {req.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold ${
                      req.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' :
                      req.status === 'Rejected' ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' :
                      req.status === 'Draft' ? 'bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400' :
                      'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{req.by}</td>
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-500">{req.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Showing {requests.length} results</p>
          <div className="flex gap-1">
            <a href="?page=1" className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </a>
            <a href="?page=1" className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 text-white font-bold transition-colors">1</a>
            <a href="?page=1" className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
