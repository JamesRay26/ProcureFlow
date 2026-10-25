'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, CheckCircle2, XCircle, Clock, AlertTriangle, RotateCcw, Shield, ShieldAlert, UserCheck } from 'lucide-react';
import { approveRequest, rejectRequest, returnRequest } from '@/app/actions';
import { useRouter } from 'next/navigation';

export interface ApprovalRequestItem {
  id: string;
  shortId: string;
  title: string;
  requester: string;
  time: string;
  priority: string;
  status: string; // PENDING, APPROVED, REJECTED, RETURNED
  reviewNotes?: string;
  price: string;
  desc: string;
  qty: number;
  date: string;
  category: string;
  requesterRole: string;
  email: string;
  justification: string;
  initials: string;
  bufferAlloc: string;
  bufferPct: string;
}

export default function ApprovalsClient({ 
  requests, 
  userRole = 'PROCUREMENT_MANAGER' 
}: { 
  requests: ApprovalRequestItem[];
  userRole?: string;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Returned'>('Pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  
  // Re-Throw State Pattern for Async Errors
  const [asyncError, setAsyncError] = useState<unknown>(null);
  if (asyncError) throw asyncError;

  // Role flags for RBAC compliance
  const isProcurementManager = userRole === 'PROCUREMENT_MANAGER';
  const isAuditor = userRole === 'AUDITOR';
  const isAdmin = userRole === 'ADMIN' || userRole === 'SYSTEM_ADMIN';

  // Tab counts
  const pendingCount = useMemo(() => requests.filter(r => r.status === 'PENDING').length, [requests]);
  const returnedCount = useMemo(() => requests.filter(r => r.status === 'RETURNED').length, [requests]);
  const allCount = requests.length;

  // Filter requests dynamically based on tab and search query
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      // Tab filter:
      if (activeTab === 'Pending' && req.status !== 'PENDING') return false;
      if (activeTab === 'Returned' && req.status !== 'RETURNED') return false;

      // Search filter:
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesTitle = req.title.toLowerCase().includes(query);
        const matchesId = req.shortId.toLowerCase().includes(query);
        const matchesRequester = req.requester.toLowerCase().includes(query);
        if (!matchesTitle && !matchesId && !matchesRequester) return false;
      }

      return true;
    });
  }, [requests, activeTab, searchQuery]);

  // Selected Request State
  const [selectedId, setSelectedId] = useState<string | null>(
    filteredRequests[0]?.id || requests[0]?.id || null
  );

  // Sync selectedId when switching tabs if previous selectedId is not in the filtered list
  useEffect(() => {
    if (filteredRequests.length > 0) {
      const exists = filteredRequests.some(r => r.id === selectedId);
      if (!exists) {
        setSelectedId(filteredRequests[0].id);
      }
    } else {
      setSelectedId(null);
    }
  }, [filteredRequests, selectedId]);

  const selectedReq = useMemo(() => {
    return requests.find(r => r.id === selectedId) || filteredRequests[0] || null;
  }, [requests, selectedId, filteredRequests]);

  const handleAction = async (action: 'approve' | 'reject' | 'return') => {
    if (!selectedId) return;
    
    // RBAC client-side guard (backed by server action assertions)
    if (!isProcurementManager) {
      if (isAuditor) {
        alert('TC-RBAC-02: Auditors have read-only access. You cannot modify, approve, or reject records.');
        return;
      }
      if (isAdmin) {
        alert('TC-RBAC-03: Administrators are restricted from approving requests without assigned Procurement Manager role.');
        return;
      }
      alert('Unauthorized: Only Procurement Managers can take action on requests.');
      return;
    }

    if (action === 'reject' && !notes.trim()) {
      alert('TC-RW-04 Requirement: Please enter a rejection reason in the comment box before rejecting.');
      return;
    }

    if (action === 'return' && !notes.trim()) {
      alert('TC-RW-05 Requirement: Please enter correction instructions in the comment box before returning.');
      return;
    }

    setLoading(true);
    setActionNotice(null);

    try {
      if (action === 'approve') {
        await approveRequest(selectedId, notes);
        setActionNotice('Request approved successfully. Parcel logistics dispatched to Digos City.');
      } else if (action === 'reject') {
        await rejectRequest(selectedId, notes);
        setActionNotice('Request rejected with reason recorded in Audit Trail.');
      } else if (action === 'return') {
        await returnRequest(selectedId, notes);
        setActionNotice('Request returned to requester for correction (TC-RW-05).');
      }

      setNotes('');
      
      // Select next item
      const currentIdx = filteredRequests.findIndex(r => r.id === selectedId);
      if (filteredRequests.length > 1) {
        setSelectedId(filteredRequests[(currentIdx + 1) % filteredRequests.length].id);
      } else {
        setSelectedId(null);
      }
      router.refresh();
    } catch (err: unknown) {
      console.error(err);
      setAsyncError(() => { throw err; });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-9rem)]">
      {/* Left Column: Master Approval Queue List */}
      <div className="w-full md:w-1/3 flex flex-col bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex-shrink-0">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Approval Queue</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold">
                {pendingCount} pending
              </span>
            </div>
            {isAuditor && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 rounded-full border border-purple-200">
                Auditor View
              </span>
            )}
          </div>

          {/* Filter Tabs: All | Pending | Returned */}
          <div className="flex bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl mb-4 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('All')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                activeTab === 'All'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All ({allCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('Pending')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                activeTab === 'Pending'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('Returned')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                activeTab === 'Returned'
                  ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Returned ({returnedCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search queue..." 
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Scrollable Request List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
          {filteredRequests.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No {activeTab.toLowerCase()} requests found.
            </div>
          ) : (
            filteredRequests.map((req) => {
              const isSelected = selectedId === req.id;
              return (
                <button
                  key={req.id}
                  type="button"
                  onClick={() => setSelectedId(req.id)}
                  className={`w-full text-left p-4 transition-colors ${
                    isSelected ? 'bg-blue-50/70 dark:bg-blue-900/20 border-l-4 border-l-blue-600' : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 border-l-4 border-l-transparent'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-xs font-bold font-mono ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>
                      #{req.shortId}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {/* Status indicator */}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
                        req.status === 'REJECTED' ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' :
                        req.status === 'RETURNED' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                      }`}>
                        {req.status === 'RETURNED' ? 'Returned' : req.status === 'REJECTED' ? 'Rejected' : req.status === 'APPROVED' ? 'Approved' : 'Pending'}
                      </span>
                      {/* Priority indicator */}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        req.priority === 'High' ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' :
                        req.priority === 'Medium' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' :
                        'bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400'
                      }`}>
                        {req.priority}
                      </span>
                    </div>
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mb-1 truncate">{req.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Requested by {req.requester} &bull; {req.time}</p>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Detailed Request Review & Decision Actions */}
      {selectedReq ? (
        <div className="w-full md:w-2/3 flex flex-col gap-4 overflow-y-auto pr-2 pb-2">
          
          {/* Action Feedback Banner */}
          {actionNotice && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {actionNotice}
            </div>
          )}

          {/* Top Summary Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-sm font-bold text-slate-400 mb-1 block">Request #{selectedReq.shortId}</span>
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${
                  selectedReq.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800' :
                  selectedReq.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800' :
                  selectedReq.status === 'RETURNED' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800' :
                  'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800'
                }`}>
                  {selectedReq.status === 'RETURNED' ? 'Returned for Requester Correction (TC-RW-05)' :
                   selectedReq.status === 'REJECTED' ? 'Rejected (TC-RW-04)' :
                   selectedReq.status === 'APPROVED' ? 'Approved & Dispatched (TC-RW-03)' : 'Pending Manager Approval'}
                </span>
              </div>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">{selectedReq.title}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{selectedReq.desc}</p>
          </div>

          {/* Review Notes Callout (If Returned or Rejected) */}
          {selectedReq.reviewNotes && (
            <div className={`p-4 rounded-2xl border ${
              selectedReq.status === 'RETURNED' 
                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-300'
                : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-900 dark:text-red-300'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span className="font-extrabold text-xs uppercase tracking-wider">
                  {selectedReq.status === 'RETURNED' ? 'Manager Correction Instructions' : 'Manager Rejection Reason'}
                </span>
              </div>
              <p className="text-sm font-medium mt-1 pl-6">
                &ldquo;{selectedReq.reviewNotes}&rdquo;
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Details & Justification Column */}
            <div className="flex flex-col gap-4">
              {/* Request Details Card */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-4">Request Details</h3>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div>
                    <span className="text-xs text-slate-400 block mb-1">Quantity</span>
                    <span className="text-lg font-extrabold text-slate-800 dark:text-slate-200">{selectedReq.qty} units</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block mb-1">Priority</span>
                    <span className="text-lg font-extrabold text-slate-800 dark:text-slate-200">{selectedReq.priority}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block mb-1">Est. Cost</span>
                    <span className="text-lg font-extrabold text-blue-600 dark:text-blue-400">{selectedReq.price}</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
                  <span className="text-xs text-slate-400 block mb-1 font-bold">Requester Justification</span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed">
                    {selectedReq.justification}
                  </p>
                </div>
              </div>

              {/* Requester Identity Card */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-3">Submitted By</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-extrabold flex items-center justify-center text-sm shadow-sm">
                    {selectedReq.initials}
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white">{selectedReq.requester}</p>
                    <p className="text-xs text-slate-400">{selectedReq.email} &bull; {selectedReq.requesterRole}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Decision Notes & Stock Buffer Column */}
            <div className="flex flex-col gap-4">
              {/* Inventory Safe Buffer Meter */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-2">Central Warehouse Buffer</h3>
                <p className="text-xs text-slate-400 mb-3">{selectedReq.bufferAlloc} in Digos City HQ</p>
                <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                    style={{ width: selectedReq.bufferPct }}
                  />
                </div>
              </div>

              {/* Manager Feedback Input (Only active when PENDING and user is Manager) */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 flex-1 flex flex-col">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-2">Manager Review Notes</h3>
                <p className="text-xs text-slate-400 mb-3">Required when rejecting or returning for correction.</p>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={!isProcurementManager || selectedReq.status !== 'PENDING' || loading}
                  placeholder={
                    !isProcurementManager 
                      ? `Read-only for ${userRole} role.`
                      : selectedReq.status !== 'PENDING'
                      ? 'Review notes locked for this finalized request.'
                      : 'Add approval notes, rejection reason, or required corrections...'
                  }
                  className="w-full flex-1 min-h-[100px] p-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-60 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons Footer with Strict RBAC States */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-2 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            {selectedReq.status === 'PENDING' ? (
              isProcurementManager ? (
                <>
                  <div className="text-xs font-bold text-slate-400">
                    Decision controls authorized for Procurement Manager
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                    {/* TC-RW-04: Reject with Reason */}
                    <button 
                      type="button"
                      onClick={() => handleAction('reject')}
                      disabled={loading}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 font-bold text-xs rounded-xl transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>

                    {/* TC-RW-05: Return for Correction */}
                    <button 
                      type="button"
                      onClick={() => handleAction('return')}
                      disabled={loading}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 font-bold text-xs rounded-xl transition-colors disabled:opacity-50"
                    >
                      <RotateCcw className="w-4 h-4" /> Return for Correction
                    </button>

                    {/* TC-RW-03: Approve */}
                    <button 
                      type="button"
                      onClick={() => handleAction('approve')}
                      disabled={loading}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 transition-all hover:-translate-y-0.5 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approve Request
                    </button>
                  </div>
                </>
              ) : isAuditor ? (
                /* TC-RBAC-02: Auditor Read-Only */
                <div className="w-full flex items-center justify-between text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/30 p-3 rounded-xl border border-purple-200">
                  <span className="flex items-center gap-2">
                    <Shield className="w-4 h-4" /> TC-RBAC-02 Compliance: Auditor role has strictly read-only inspection access. Decision controls are locked.
                  </span>
                  <span className="text-[10px] text-purple-600 uppercase font-mono">Read-Only</span>
                </div>
              ) : (
                /* TC-RBAC-03: Admin Separation of Duties */
                <div className="w-full flex items-center justify-between text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/30 p-3 rounded-xl border border-indigo-200">
                  <span className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4" /> TC-RBAC-03 Separation of Duties: Administrator accounts manage organization & team settings. Restocking approvals require Procurement Manager.
                  </span>
                  <span className="text-[10px] text-indigo-600 uppercase font-mono">Admin View</span>
                </div>
              )
            ) : (
              <div className="w-full flex items-center justify-between text-xs font-bold text-slate-500">
                <span className="flex items-center gap-1.5">
                  {selectedReq.status === 'APPROVED' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : selectedReq.status === 'RETURNED' ? (
                    <RotateCcw className="w-4 h-4 text-amber-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  This request was {selectedReq.status === 'APPROVED' ? 'Approved & Dispatched' : selectedReq.status === 'RETURNED' ? 'Returned for Correction' : 'Rejected'}
                </span>
                <span className="text-slate-400 font-normal">Audit record locked in database</span>
              </div>
            )}
          </div>

        </div>
      ) : (
        <div className="w-full md:w-2/3 flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-400 text-center">
          <Clock className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="font-bold text-slate-700 dark:text-slate-300">No Request Selected</h3>
          <p className="text-xs text-slate-400 mt-1">Select an item from the queue on the left to review its details.</p>
        </div>
      )}
    </div>
  );
}
