import { Package, FileText, CheckCircle2, AlertTriangle, Plus, Search, Filter } from 'lucide-react';
import Link from 'next/link';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/');

  if (!user.organizationId) {
    return (
      <div className="max-w-md mx-auto mt-20 bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome to ProcureFlow!</h2>
        <p className="text-slate-500 mb-6">Your account has been created, but you are not yet assigned to an organization.</p>
        <p className="text-sm font-medium text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100">
          Please ask your administrator to invite you to their workspace, or contact support to set up a new company profile.
        </p>
        <div className="mt-8 pt-6 border-t border-slate-100">
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="text-blue-600 font-bold hover:underline">Sign out</button>
          </form>
        </div>
      </div>
    );
  }

  const pendingRequestsCount = await prisma.request.count({
    where: { organizationId: user.organizationId, status: 'PENDING' }
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const approvedTodayCount = await prisma.request.count({
    where: { organizationId: user.organizationId, status: 'APPROVED', createdAt: { gte: today } }
  });

  const allItems = await prisma.inventoryItem.findMany({
    where: { organizationId: user.organizationId }
  });
  const lowStockCount = allItems.filter(i => i.stock <= i.threshold).length;
  const totalInventoryCount = allItems.length;

  const recentRequests = await prisma.request.findMany({
    where: { organizationId: user.organizationId },
    include: { item: true, requestedBy: true },
    orderBy: { createdAt: 'desc' },
    take: 8
  });

  const requests = recentRequests.map(req => ({
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Restocking Requests</h2>
          <p className="text-slate-500 font-medium mt-1 dark:text-slate-400">Manage and track your procurement pipeline</p>
        </div>
        <Link href="/dashboard/requests/new" className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm shadow-blue-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0">
          <Plus className="w-5 h-5" /> New Request
        </Link>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* Pending Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">Pending Requests</p>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white">{pendingRequestsCount}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <FileText className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Approved Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">Approved Today</p>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white">{approvedTodayCount}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Alerts Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">Low Stock Alerts</p>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white">{lowStockCount}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-500 dark:text-amber-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Total Inv Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 border-l-4 border-l-slate-400 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">Total Inventory</p>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white">{totalInventoryCount}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
              <Package className="w-6 h-6" />
            </div>
          </div>
        </div>

      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden mb-8">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Recent Requests</h3>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>
        
        {requests.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium">
            No requests found. Create a new request to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400">Request ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400">Item Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400">Qty</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400">Warehouse</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400">Priority</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400">Requested By</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {requests.map((req, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
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
        )}
      </div>
    </>
  );
}
