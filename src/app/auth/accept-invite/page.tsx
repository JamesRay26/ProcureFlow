import prisma from '@/lib/prisma';
import { ShieldCheck, Lock, Building2 } from 'lucide-react';

export default async function AcceptInvitePage({ searchParams }: { searchParams: { token: string } }) {
  const token = searchParams.token;
  
  if (!token) {
    return <ErrorState message="No invitation token provided." />;
  }

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { organization: true }
  });

  if (!invitation) {
    return <ErrorState message="Invalid or expired invitation token." />;
  }

  if (new Date() > invitation.expiresAt) {
    return <ErrorState message="This invitation has expired." />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 lg:p-10 shadow-xl border border-slate-200">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold text-xs tracking-wider uppercase mb-6 shadow-sm">
            <ShieldCheck className="w-4 h-4" /> Secure Onboarding
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Join Workspace</h1>
          <p className="text-slate-500 font-medium mt-2">
            You've been invited to join <strong className="text-blue-600">{invitation.organization.name}</strong> as a <strong className="text-slate-900">{invitation.role}</strong>.
          </p>
        </div>

        <form action="/api/accept-invite" method="POST" className="space-y-5">
          <input type="hidden" name="token" value={token} />
          
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Your Email</label>
            <input type="email" value={invitation.email} disabled className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Full Name</label>
            <input type="text" name="name" required placeholder="John Doe" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm" />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Create Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input type="password" name="password" required placeholder="••••••••" className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm" />
            </div>
          </div>

          <button type="submit" className="w-full mt-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all outline-none">
            Accept Invitation & Sign In
          </button>
        </form>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
      <div>
        <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
        <p className="text-slate-600">{message}</p>
      </div>
    </div>
  )
}
