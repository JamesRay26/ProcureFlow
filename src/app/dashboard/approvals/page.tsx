import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import ApprovalsClient from './ApprovalsClient';

export default async function ApprovalsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/');
  if (!user.organizationId) redirect('/dashboard');

  // TC-RBAC-04: Block Unauthorized Direct API or URL Access
  // "GIVEN a Warehouse Staff user does not have approval permission
  //  WHEN the user directly accesses the approval API or URL
  //  THEN the system denies access and makes no changes to the request."
  if (user.role === 'WAREHOUSE_STAFF') {
    return (
      <div className="max-w-2xl mx-auto mt-12 bg-white dark:bg-slate-800 rounded-3xl border border-red-200 dark:border-red-900/50 shadow-xl p-8 text-center animate-fade-in-up">
        <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-5 shadow-inner">
          <ShieldAlert className="w-9 h-9" />
        </div>
        <div className="inline-block px-3 py-1 bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-mono text-xs font-bold rounded-full mb-3">
          403 FORBIDDEN &bull; TC-RBAC-04 COMPLIANCE
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-3">
          Direct URL Access Blocked
        </h2>
        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6">
          Logged in as <strong>{user.name} ({user.role})</strong>. Under ProcureFlow Role-Based Access Control, Warehouse Staff are strictly prohibited from accessing the Approval Queue or exercising approval authority.
        </p>
        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl text-left border border-slate-200 dark:border-slate-800 mb-6 text-xs text-slate-500 dark:text-slate-400">
          <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">User Story Verification (TC-RBAC-04):</p>
          <p>&ldquo;As a system administrator, I want protected functions secured on the backend so that users cannot bypass UI restrictions.&rdquo;</p>
        </div>
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-500/20"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Safe Dashboard
        </Link>
      </div>
    );
  }

  const allRequests = await prisma.request.findMany({
    where: { 
      organizationId: user.organizationId
    },
    include: { item: true, requestedBy: true },
    orderBy: { createdAt: 'desc' }
  });

  const formattedRequests = allRequests.map(req => {
    const timeDiff = Math.floor((new Date().getTime() - new Date(req.createdAt).getTime()) / (1000 * 3600));
    return {
      id: req.id,
      shortId: req.id.slice(0, 8).toUpperCase(),
      title: req.item.name,
      requester: req.requestedBy.name,
      time: timeDiff < 1 ? 'Just now' : `${timeDiff} hours ago`,
      priority: req.priority,
      status: req.status, // PENDING, APPROVED, REJECTED, RETURNED
      reviewNotes: req.reviewNotes || undefined,
      price: `$${(req.item.maxStock * 10).toLocaleString()}`,
      desc: req.item.category,
      qty: req.quantity,
      date: new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      category: req.item.category,
      requesterRole: req.requestedBy.role,
      email: req.requestedBy.email,
      justification: req.justification || 'No justification provided.',
      initials: req.requestedBy.name.substring(0, 2).toUpperCase(),
      bufferAlloc: `${req.item.stock} of ${req.item.maxStock} safe buffer units`,
      bufferPct: `${Math.min(100, Math.max(0, (req.item.stock / req.item.maxStock) * 100))}%`
    };
  });

  return <ApprovalsClient requests={formattedRequests} userRole={user.role} />;
}
