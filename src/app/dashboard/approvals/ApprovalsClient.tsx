'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { approveRequest, rejectRequest } from '@/app/actions';
import { useRouter } from 'next/navigation';

export default function ApprovalsClient({ requests }: { requests: any[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(requests[0]?.id || null);
  const [activeTab, setActiveTab] = useState('Pending');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedReq = requests.find(r => r.id === selectedId) || requests[0];

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!selectedId) return;
    setLoading(true);
    try {
      if (action === 'approve') await approveRequest(selectedId, notes);
      if (action === 'reject') await rejectRequest(selectedId, notes);
      setNotes('');
      // automatically select next request
      const currentIdx = requests.findIndex(r => r.id === selectedId);
      if (requests.length > 1) {
        setSelectedId(requests[(currentIdx + 1) % requests.length].id);
      } else {
        setSelectedId(null);
      }
      router.refresh();
    } catch (e) {
      console.error(e);
      alert('Failed to process request');
    } finally {
      setLoading(false);
    }
  };

  if (!requests.length) {
    return (
      <div className="flex flex-col gap-6 h-[calc(100vh-9rem)] items-center justify-center text-slate-500 font-bold bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <p>No pending approvals. You're all caught up!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-9rem)]">
      {/* Left Column: Master List */}
      <div className="w-full md:w-1/3 flex flex-col bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex-shrink-0">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Approval Queue</h2>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold">{requests.length} pending</span>
            </div>
            <button className="text-sm font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400">Mark all read</button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-6 text-sm font-bold border-b border-slate-100 dark:border-slate-700 pb-3">
            <button 
              onClick={() => setActiveTab('All')}
              className={`${activeTab === 'All' ? 'text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600'}`}
            >All</button>
            <button 
              onClick={() => setActiveTab('Pending')}
              className={`relative flex items-center gap-2 ${activeTab === 'Pending' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Pending
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] flex items-center justify-center">{requests.length}</span>
              {activeTab === 'Pending' && <div className="absolute -bottom-3.5 left-0 w-full h-0.5 bg-blue-600"></div>}
            </button>
            <button 
              onClick={() => setActiveTab('Returned')}
              className={`${activeTab === 'Returned' ? 'text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600'}`}
            >Returned</button>
          </div>
        </div>

        {/* Filter Input */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Filter queue..." 
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {requests.map(req => {
            const isSelected = selectedId === req.id;
            return (
              <button
                key={req.id}
                onClick={() => setSelectedId(req.id)}
                className={`w-full text-left p-4 border-b border-slate-100 dark:border-slate-700/50 transition-colors ${
                  isSelected ? 'bg-blue-50/50 dark:bg-blue-900/10 border-l-4 border-l-blue-600' : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 border-l-4 border-l-transparent'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-xs font-bold ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>{req.shortId}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    req.priority === 'High' ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' :
                    req.priority === 'Medium' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' :
                    'bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400'
                  }`}>{req.priority}</span>
                </div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mb-1">{req.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Requested by {req.requester} &bull; {req.time}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Column: Detail View */}
      {selectedReq && (
      <div className="w-full md:w-2/3 flex flex-col gap-4 overflow-y-auto pr-2 pb-2">
        {/* Top Summary Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-sm font-bold text-slate-400 mb-1 block">Request {selectedReq.shortId}</span>
              <span className="inline-flex px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold border border-blue-100 dark:border-blue-800">
                Pending Approval
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
                  <span className="text-slate-500">Warehouse Allocation: Manila HQ</span>
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

            {/* Reviewer Decision Notes Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-4">Reviewer Decision Notes</h3>
              <textarea 
                rows={3} 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Type a comment or decision justification here..."
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
              ></textarea>
            </div>
          </div>

          {/* Requester & History Column */}
          <div className="flex flex-col gap-4">
            {/* Requester Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-4">Requester</h3>
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
                <a href={`mailto:${selectedReq.email}`} className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">{selectedReq.email}</a>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="flex flex-col sm:flex-row justify-end items-center gap-3 mt-2 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <button 
            onClick={() => handleAction('reject')}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 font-bold rounded-xl transition-colors disabled:opacity-50">
            Reject Request
          </button>
          <button 
            onClick={() => handleAction('approve')}
            disabled={loading}
            className="w-full sm:w-auto px-8 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md shadow-emerald-500/20 transition-all hover:-translate-y-0.5 disabled:opacity-50">
            Approve Request
          </button>
        </div>

      </div>
      )}
    </div>
  );
}
