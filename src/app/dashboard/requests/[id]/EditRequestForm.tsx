'use client';

import { useState } from 'react';
import { updateRequestDetails } from '@/app/actions';
import { Save, AlertCircle } from 'lucide-react';

export default function EditRequestForm({ 
  requestId, 
  initialQty, 
  initialPriority, 
  initialJustification 
}: { 
  requestId: string, 
  initialQty: number, 
  initialPriority: string, 
  initialJustification: string 
}) {
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
      <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">Edit Request</h4>
      
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}
      
      {success && (
        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg text-sm flex items-center gap-2">
          <Save className="w-4 h-4" /> Changes saved successfully!
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
            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
            required 
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Priority</label>
          <select 
            name="priority" 
            defaultValue={initialPriority}
            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
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
          className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
        ></textarea>
      </div>

      <div className="pt-2 flex justify-end">
        <button 
          type="submit" 
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
