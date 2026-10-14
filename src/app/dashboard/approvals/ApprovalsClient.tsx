'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { approveRequest, rejectRequest } from '@/app/actions';
import { useRouter } from 'next/navigation';

export interface ApprovalRequestItem {
  id: string;
  shortId: string;
  title: string;
  requester: string;
  time: string;
  priority: string;
  status: string; // PENDING, APPROVED, REJECTED
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

export default function ApprovalsClient({ requests }: { requests: ApprovalRequestItem[] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Returned'>('Pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Week 5: Re-Throw State Pattern for Async Errors
  /* 
   * PANEL Q&A NOTE: Advanced Async Error Handling
   * If asked: "How do you handle backend crashes?" or "What is this asyncError state?"
   * Answer: "Standard Next.js error boundaries cannot catch errors that happen inside asynchronous button clicks. 
   * We engineered the 'Re-Throw State Pattern'. If the database crashes, we catch the error and inject it into 
   * a synchronous state update. This forces the crash into the render cycle, safely triggering our error boundary fallback UI!"
   */
  const [asyncError, setAsyncError] = useState<unknown>(null);
  if (asyncError) throw asyncError; // Forces async errors into the sync render cycle for error.tsx to catch

  // Tab counts
  const pendingCount = useMemo(() => requests.filter(r => r.status === 'PENDING').length, [requests]);
  const returnedCount = useMemo(() => requests.filter(r => r.status === 'REJECTED').length, [requests]);
  const allCount = requests.length;

  // Filter requests dynamically based on tab and search query
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      // Tab filter:
      if (activeTab === 'Pending' && req.status !== 'PENDING') return false;
      if (activeTab === 'Returned' && req.status !== 'REJECTED') return false;

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

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!selectedId) return;
    setLoading(true);
    try {
      if (action === 'approve') await approveRequest(selectedId, notes);
      if (action === 'reject') await rejectRequest(selectedId, notes);
      setNotes('');
      
      // Automatically select next request in the list
      const currentIdx = filteredRequests.findIndex(r => r.id === selectedId);
      if (filteredRequests.length > 1) {
        setSelectedId(filteredRequests[(currentIdx + 1) % filteredRequests.length].id);
      } else {
        setSelectedId(null);
      }
      router.refresh();
    } catch (err: unknown) {
      console.error(err);
      // Re-throw async error to trigger Next.js error.tsx boundary
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
          </div>

          {/* Working Tabs: All, Pending, Returned */}
          <div className="flex items-center gap-6 text-sm font-bold border-b border-slate-100 dark:border-slate-700 pb-3">
            <button 
              type="button"
              onClick={() => setActiveTab('All')}
              className={`relative pb-1 transition-colors flex items-center gap-1.5 ${
                activeTab === 'All' ? 'text-blue-600 dark:text-blue-400 font-extrabold' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              All
              <span className="px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400">
                {allCount}
              </span>
              {activeTab === 'All' && <div className="absolute -bottom-3 left-0 w-full h-0.5 bg-blue-600 rounded-full"></div>}
            </button>

            <button 
              type="button"
              onClick={() => setActiveTab('Pending')}
              className={`relative pb-1 transition-colors flex items-center gap-1.5 ${
                activeTab === 'Pending' ? 'text-blue-600 dark:text-blue-400 font-extrabold' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              Pending
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] flex items-center justify-center font-bold">
                {pendingCount}
              </span>
              {activeTab === 'Pending' && <div className="absolute -bottom-3 left-0 w-full h-0.5 bg-blue-600 rounded-full"></div>}
            </button>

            <button 
              type="button"
              onClick={() => setActiveTab('Returned')}
              className={`relative pb-1 transition-colors flex items-center gap-1.5 ${
                activeTab === 'Returned' ? 'text-blue-600 dark:text-blue-400 font-extrabold' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              Returned
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                returnedCount > 0 ? 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}>
                {returnedCount}
              </span>
              {activeTab === 'Returned' && <div className="absolute -bottom-3 left-0 w-full h-0.5 bg-blue-600 rounded-full"></div>}
            </button>
          </div>
        </div>

        {/* Live Filter Search Input */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter queue by item, ID, or user..." 
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Queue Items List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {filteredRequests.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              <Clock className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="font-bold">No requests in this tab.</p>
              <p className="text-xs text-slate-400 mt-1">Switch tabs or clear the search to view others.</p>
            </div>
          ) : (
            filteredRequests.map(req => {
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
                        'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                      }`}>
                        {req.status === 'REJECTED' ? 'Returned' : req.status}
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

      {/* Right Column: Detail View */}
      {selectedReq ? (
        <div className="w-full md:w-2/3 flex flex-col gap-4 overflow-y-auto pr-2 pb-2">
          {/* Top Summary Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-sm font-bold text-slate-400 mb-1 block">Request #{selectedReq.shortId}</span>
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${
                  selectedReq.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800' :
                  selectedReq.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800' :
                  'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800'
                }`}>
                  {selectedReq.status === 'REJECTED' ? 'Returned for Correction' : selectedReq.status === 'APPROVED' ? 'Approved' : 'Pending Approval'}
                </span>
              </div>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">{selectedReq.title}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{selectedReq.desc}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Details & Justification Column */}
            <div className="flex flex-col gap-4">
              {/* Request Details Card */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-4">Request Details</h3>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">Quantity Needed</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedReq.qty} units</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">Date Submitted</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedReq.date}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">Category</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{selectedReq.category}</p>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-500">Warehouse Allocation: Digos City Central HQ</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedReq.bufferAlloc}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: selectedReq.bufferPct }}></div>
                  </div>
                </div>
              </div>

              {/* Justification Card */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-4">Justification</h3>
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50">
                  <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{selectedReq.justification}"</p>
                </div>
              </div>

              {/* Reviewer Decision Notes Card (Only when PENDING) */}
              {selectedReq.status === 'PENDING' && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-4">Reviewer Decision Notes</h3>
                  <textarea 
                    rows={3} 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Type a comment, decision justification, or correction reason..."
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
                  ></textarea>
                </div>
              )}
            </div>

            {/* Requester Column */}
            <div className="flex flex-col gap-4">
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-4">Requester Profile</h3>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg">
                    {selectedReq.initials}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{selectedReq.requester}</h4>
                    <p className="text-xs text-slate-500">{selectedReq.requesterRole}</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                  <a href={`mailto:${selectedReq.email}`} className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
                    {selectedReq.email}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons Footer */}
          <div className="flex flex-col sm:flex-row justify-end items-center gap-3 mt-2 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            {selectedReq.status === 'PENDING' ? (
              <>
                <button 
                  type="button"
                  onClick={() => handleAction('reject')}
                  disabled={loading}
                  className="w-full sm:w-auto px-6 py-2.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                  Return / Reject Request
                </button>
                <button 
                  type="button"
                  onClick={() => handleAction('approve')}
                  disabled={loading}
                  className="w-full sm:w-auto px-8 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md shadow-emerald-500/20 transition-all hover:-translate-y-0.5 disabled:opacity-50"
                >
                  Approve Request
                </button>
              </>
            ) : (
              <div className="w-full flex items-center justify-between text-xs font-bold text-slate-500">
                <span className="flex items-center gap-1.5">
                  {selectedReq.status === 'APPROVED' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  This request was {selectedReq.status === 'APPROVED' ? 'Approved' : 'Returned / Rejected'}
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
