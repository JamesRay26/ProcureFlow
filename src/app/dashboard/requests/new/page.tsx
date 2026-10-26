import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import NewRequestClient from './NewRequestClient';

export default async function NewRequestPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/');
  if (!user.organizationId) redirect('/dashboard');

  // TC-RBAC-02: Compliance Auditor Read-Only Enforcement
  // Auditors cannot create or submit restocking requests
  if (user.role === 'AUDITOR') {
    return (
      <div className="max-w-2xl mx-auto mt-12 bg-white dark:bg-slate-800 rounded-2xl border border-red-200 dark:border-red-900/50 shadow-sm p-8 text-center animate-fade-in-up">
        <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-5 shadow-inner">
          <ShieldAlert className="w-9 h-9" />
        </div>
        <div className="inline-block px-3 py-1 bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-mono text-xs font-bold rounded-full mb-3">
          403 FORBIDDEN &bull; TC-RBAC-02 COMPLIANCE
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
          Creation Restricted: Auditor Read-Only
        </h2>
        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6">
          Logged in as <strong>{user.name} (Auditor)</strong>. Compliance Auditors have strictly read-only inspection access across all modules in ProcureFlow. You are restricted from creating or submitting restocking requests.
        </p>
        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl text-left border border-slate-200 dark:border-slate-800 mb-6 text-xs text-slate-500 dark:text-slate-400">
          <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">User Story Verification (TC-RBAC-02):</p>
          <p>&ldquo;As a compliance auditor, I want read-only access to all requests and audit records so that I can inspect the system without altering data.&rdquo;</p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Link 
            href="/dashboard/requests" 
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> View Requests
          </Link>
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-sm transition-colors shadow-sm"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return <NewRequestClient />;
}
