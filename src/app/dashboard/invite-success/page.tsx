import { CheckCircle2, Link as LinkIcon, ArrowLeft } from "lucide-react";

export default function InviteSuccessPage({ searchParams }: { searchParams: { token: string, email: string } }) {
  const token = searchParams.token;
  const email = searchParams.email;
  const inviteUrl = `http://localhost:3001/auth/accept-invite?token=${token}`;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-xl w-full bg-white rounded-3xl p-10 shadow-lg border border-slate-200 text-center">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Invitation Generated</h1>
        <p className="text-slate-500 font-medium mb-8">An invitation has been created for <strong className="text-slate-900">{email}</strong>.</p>
        
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-left mb-8">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Share this secure link</label>
          <div className="flex items-center gap-3">
            <LinkIcon className="w-5 h-5 text-slate-400" />
            <code className="text-sm font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded flex-1 overflow-hidden overflow-ellipsis">{inviteUrl}</code>
          </div>
        </div>

        <a href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </a>
      </div>
    </div>
  );
}
