'use client';

import { useState } from 'react';
import { updateRequestDetails } from '@/app/actions';
import { Save, AlertCircle, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function EditRequestForm({ 
  requestId, 
  initialQty, 
  initialPriority, 
  initialJustification,
  isReturned = false,
}: { 
  requestId: string; 
  initialQty: number; 
  initialPriority: string; 
  initialJustification: string;
  isReturned?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const qty = parseInt(formData.get('quantity') as string);
    const priority = formData.get('priority') as string;
    const justification = formData.get('justification') as string;

    try {
      await updateRequestDetails(requestId, qty, priority, justification);
      setSuccess(true);
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
          {isReturned ? 'Correct & Resubmit Request' : 'Edit Request'}
        </h4>
        {isReturned && (
          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200">
            TC-RW-05 Resubmission
          </span>
        )}
      </div>
      
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}
      
      {success && (
        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg text-sm flex items-center gap-2">
          <Save className="w-4 h-4 shrink-0" />
          {isReturned 
            ? 'Request corrected and resubmitted to Pending Approval (TC-RW-05)!'
            : 'Changes saved successfully!'}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Quantity</label>
          <input 
            type="number" 
            name="quantity" 
            defaultValue={initialQty} 
            min="1"
            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-slate-100"
            required 
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Priority</label>
          <select 
            name="priority" 
            defaultValue={initialPriority}
            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-slate-100"
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Justification / Notes</label>
        <textarea 
          name="justification" 
          defaultValue={initialJustification}
          rows={3}
          className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-slate-100 text-sm"
        ></textarea>
      </div>

      <div className="pt-2 flex justify-end">
        <button 
          type="submit" 
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 text-sm shadow-md shadow-blue-500/20"
        >
          {loading ? (
            'Processing...'
          ) : isReturned ? (
            <>
              <Send className="w-4 h-4" /> Save & Resubmit (TC-RW-05)
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  );
}
