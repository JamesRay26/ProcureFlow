import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import { ChevronLeft, Truck, Package, CheckCircle2, AlertTriangle, Shield, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import EditRequestForm from './EditRequestForm';

// Dynamically import the tracking map client component to avoid SSR window errors
const TrackingMapClient = dynamic(() => import('@/app/_components/TrackingMapClient'), { 
  ssr: false, 
  loading: () => (
    <div className="h-96 w-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl flex items-center justify-center text-slate-400 text-sm font-bold">
      Loading interactive logistics route...
    </div>
  )
});

export default async function RequestDetailsPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || !user.organizationId) redirect('/');

  const req = await prisma.request.findUnique({
    where: { id: params.id, organizationId: user.organizationId },
    include: { item: true, requestedBy: true }
  });

  if (!req) {
    return (
      <div className="p-12 text-center text-slate-500">
        <Package className="w-12 h-12 mx-auto text-slate-300 mb-3" />
        <h3 className="text-lg font-bold text-slate-700">Request Not Found</h3>
        <Link href="/dashboard/requests" className="text-sm font-bold text-blue-600 hover:underline mt-2 inline-block">
          Return to requests list
        </Link>
      </div>
    );
  }

  // Determine if it can be edited:
  // User Story / Requirements: "when the request is not yet approved the requestor should be able to edit the order, but once accepted it will automatically cannot be altered."
  // TC-RW-05: When returned for correction, requester can correct and resubmit
  // TC-RBAC-02: Auditor has read-only access (cannot edit)
  const isAuditor = user.role === 'AUDITOR';
  const isReturned = req.status === 'RETURNED';
  const isPending = req.status === 'PENDING';
  const canEdit = (isPending || isReturned) && !isAuditor;
  const isApproved = req.status === 'APPROVED';

  return (
    <>
      {/* Back button */}
      <div className="mb-6">
        <Link href="/dashboard/requests" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to All Requests
        </Link>
      </div>

      {/* Header with Request ID & Status Badge */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-md">
              #{req.id.slice(0, 8).toUpperCase()}
            </span>
            <span className="text-xs font-bold text-slate-400">
              Submitted {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Restocking Request Details
          </h2>
        </div>

        <span className={`inline-flex px-4 py-2 rounded-xl text-sm font-extrabold shadow-sm border ${
          req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800' :
          req.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800' :
          req.status === 'RETURNED' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800' :
          'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800'
        }`}>
          Status: {req.status === 'RETURNED' ? 'RETURNED FOR CORRECTION' : req.status}
        </span>
      </div>

      {/* Manager Feedback Notice (If Returned or Rejected) */}
      {req.reviewNotes && (
        <div className={`mb-8 p-5 rounded-2xl border ${
          isReturned 
            ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-300'
            : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-900 dark:text-red-300'
        }`}>
          <div className="flex items-center gap-2 mb-1.5 font-extrabold text-sm">
            {isReturned ? <RotateCcw className="w-5 h-5 text-amber-600" /> : <AlertTriangle className="w-5 h-5 text-red-600" />}
            <span>{isReturned ? 'Manager Revision Instructions (TC-RW-05):' : 'Rejection Reason (TC-RW-04):'}</span>
          </div>
          <p className="text-sm font-medium pl-7">
            &ldquo;{req.reviewNotes}&rdquo;
          </p>
        </div>
      )}

      {/* Auditor Read-Only Notice */}
      {isAuditor && (
        <div className="mb-8 p-4 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 rounded-2xl flex items-center gap-3 text-purple-800 dark:text-purple-300 text-xs font-bold shadow-sm">
          <Shield className="w-5 h-5 shrink-0" />
          <span>TC-RBAC-02 Compliance: Auditor logged in with read-only privileges. Creation and editing controls are disabled.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Item Specifications & Edit / Locked Form (5 cols on desktop) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Item Information
            </h3>
            
            <div className="p-4 bg-slate-50 dark:bg-slate-900/70 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Item Name</p>
                <p className="font-extrabold text-base text-slate-900 dark:text-slate-100">{req.item.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">SKU</p>
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-200 font-mono">{req.item.sku}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Category</p>
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{req.item.category}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Target Warehouse</p>
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{req.item.warehouse}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Requested By</p>
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{req.requestedBy.name}</p>
                </div>
              </div>
            </div>

            {/* Editable Form (when PENDING or RETURNED) OR Locked Read-Only State (when APPROVED / REJECTED) */}
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
              {canEdit ? (
                <>
                  <div className="mb-4">
                    <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-lg ${
                      isReturned
                        ? 'text-amber-800 bg-amber-50 dark:bg-amber-900/40 dark:text-amber-300'
                        : 'text-blue-700 bg-blue-50 dark:bg-blue-900/40 dark:text-blue-300'
                    }`}>
                      {isReturned ? '⚠️ Returned: Requester can correct and resubmit (TC-RW-05)' : '✏️ Order Pending: Editable by Requester'}
                    </span>
                  </div>
                  <EditRequestForm 
                    requestId={req.id} 
                    initialQty={req.quantity} 
                    initialPriority={req.priority} 
                    initialJustification={req.justification || ''} 
                    isReturned={isReturned}
                  />
                </>
              ) : (
                <div className="space-y-4">
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500 font-bold">
                        {isApproved ? 'Approved Quantity' : 'Requested Quantity'}
                      </p>
                      <p className="text-xl font-extrabold text-slate-900 dark:text-white">{req.quantity} units</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-bold">Priority Level</p>
                      <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold ${
                        req.priority === 'High' ? 'bg-red-50 text-red-600' :
                        req.priority === 'Medium' ? 'bg-amber-50 text-amber-600' :
                        'bg-emerald-50 text-emerald-600'
                      }`}>
                        {req.priority}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 font-bold mb-1">Justification / Request Notes</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      {req.justification || "No justification provided."}
                    </p>
                  </div>

                  {/* Permanently Locked Notice */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 rounded-xl text-xs font-bold border border-blue-200 dark:border-blue-900 flex items-center gap-2.5 shadow-sm">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                    <span>
                      {isApproved 
                        ? 'Order is locked. Once accepted by management, order specifications cannot be altered to preserve audit compliance.'
                        : req.status === 'REJECTED'
                        ? 'Order is finalized and rejected. Locked against modifications.'
                        : 'Read-only access. You do not have permission to edit this request.'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive E-Commerce Parcel Tracking & Stock Anticipation (7 cols) */}
        <div className="lg:col-span-7">
          {isApproved ? (
            <TrackingMapClient 
              requestId={req.id}
              itemName={req.item.name}
              itemSku={req.item.sku}
              incomingQty={req.quantity}
              currentStock={req.item.stock}
              threshold={req.item.threshold}
              warehouseName={req.item.warehouse}
              isApproved={isApproved}
            />
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                {isReturned ? 'Logistics Route Paused (Returned for Revision)' : 'Tracking En Route Pending'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-2">
                This restocking request is currently <strong className="text-slate-800 dark:text-slate-200">{req.status}</strong>. 
                {isReturned 
                  ? ' The requester must correct the request and resubmit it before the procurement manager can approve dispatch.' 
                  : ' Once approved by the procurement manager, the automated logistics carrier will dispatch and generate live route tracking with checkpoints, vehicle coordinates, and ETA anticipation.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
