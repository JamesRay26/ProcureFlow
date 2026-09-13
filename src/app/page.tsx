"use client";

import { useState, Suspense } from "react";
import { ShieldCheck, Mail, Lock, Building2, Shield, ArrowRight, AlertCircle, User as UserIcon } from "lucide-react";
import { useSearchParams } from 'next/navigation';
import { signIn } from "next-auth/react";

function AuthContent() {
  const [view, setView] = useState<"login" | "register">("login");
  const [regType, setRegType] = useState<"employee" | "admin">("employee");
  
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="w-full max-w-md animate-fade-in-up stagger-2">
      <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-8 lg:p-10 shadow-[0_20px_60px_rgb(0,0,0,0.05)] border border-white/60 relative overflow-hidden transition-all duration-500">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

        {error === 'email_exists' && (
          <div className="mb-6 bg-red-50 text-red-600 p-3 rounded-xl flex items-center gap-2 text-sm font-bold border border-red-100">
            <AlertCircle className="w-4 h-4" /> This account already exists. Please log in.
          </div>
        )}
        {error === 'invalid_credentials' && (
          <div className="mb-6 bg-red-50 text-red-600 p-3 rounded-xl flex items-center gap-2 text-sm font-bold border border-red-100">
            <AlertCircle className="w-4 h-4" /> Invalid email or password.
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-slate-100/50 p-1 rounded-xl border border-slate-200/50">
          <button 
            onClick={() => setView("login")} 
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${view === "login" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Sign In
          </button>
          <button 
            onClick={() => setView("register")} 
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${view === "register" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Create Account
          </button>
        </div>

        {view === "login" ? (
          <form action="/api/auth/login" method="POST" className="space-y-5 animate-fade-in-up">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Welcome back</h2>
              <p className="text-sm text-slate-500 font-medium mt-1">Sign in to your workspace.</p>
            </div>
            
            <button type="button" onClick={() => signIn('google', { callbackUrl: '/dashboard' })} className="w-full flex items-center justify-center gap-3 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm mt-6">
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /><path fill="none" d="M1 1h22v22H1z" /></svg>
              Sign in with Google
            </button>

            <div className="flex items-center gap-4 my-4">
              <div className="flex-1 h-px bg-slate-200"></div>
              <span className="text-xs font-bold text-slate-400 uppercase">or</span>
              <div className="flex-1 h-px bg-slate-200"></div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input type="email" name="email" required placeholder="name@company.com" className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm" />
              </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Password</label>
                  <a href="#" className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors">Forgot password?</a>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input type="password" name="password" required placeholder="••••••••" className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm" />
                </div>
              </div>
            </div>
            <button type="submit" className="w-full mt-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Secure Sign In
            </button>
          </form>
        ) : (
          <form action="/api/auth/register" method="POST" className="space-y-5 animate-fade-in-up">
            <input type="hidden" name="accountType" value={regType} />
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create Account</h2>
              <p className="text-sm text-slate-500 font-medium mt-1">Get started with ProcureFlow.</p>
            </div>

            <div className="flex gap-2 mb-2 bg-slate-50 p-1 rounded-xl border border-slate-200 mt-4">
              <button type="button" onClick={() => setRegType("employee")} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${regType === "employee" ? "bg-white text-blue-700 shadow-sm border border-blue-100" : "text-slate-500 hover:text-slate-700"}`}>
                <UserIcon className="w-4 h-4 inline-block mr-1" /> Employee
              </button>
              <button type="button" onClick={() => setRegType("admin")} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${regType === "admin" ? "bg-white text-indigo-700 shadow-sm border border-indigo-100" : "text-slate-500 hover:text-slate-700"}`}>
                <Shield className="w-4 h-4 inline-block mr-1" /> Admin (New Company)
              </button>
            </div>

            <button type="button" onClick={() => signIn('google', { callbackUrl: '/dashboard' })} className="w-full flex items-center justify-center gap-3 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /><path fill="none" d="M1 1h22v22H1z" /></svg>
              Sign up with Google
            </button>
            <div className="flex items-center gap-4 my-2">
              <div className="flex-1 h-px bg-slate-200"></div><span className="text-xs font-bold text-slate-400 uppercase">or</span><div className="flex-1 h-px bg-slate-200"></div>
            </div>

            <div className="space-y-4">
              {regType === 'admin' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Company Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input type="text" name="companyName" required placeholder="Acme Corp" className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm" />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input type="text" name="name" required placeholder="John Doe" className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input type="email" name="email" required placeholder="name@company.com" className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Password</label>
                <div className="relative">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input type="password" name="password" required placeholder="Create a strong password" className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm" />
                </div>
              </div>
            </div>

            <button type="submit" className="w-full mt-6 py-3.5 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-xl font-bold shadow-md shadow-slate-900/20 hover:shadow-lg hover:shadow-slate-900/40 hover:-translate-y-0.5 transition-all outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-800 flex justify-center items-center gap-2">
              {regType === 'admin' ? "Create Company Account" : "Create Employee Account"} <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function AuthPortal() {
  return (
    <div className="relative min-h-screen bg-[#FDFDFE] text-slate-800 font-sans overflow-x-hidden selection:bg-blue-200 selection:text-blue-900 flex items-center justify-center">
      {/* Ambient Secure Background */}
      <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden bg-slate-50">
        <div className="absolute top-[-20%] left-[-10%] w-[50rem] h-[50rem] bg-blue-500/10 rounded-full mix-blend-multiply filter blur-[120px] animate-blob"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[45rem] h-[45rem] bg-indigo-500/10 rounded-full mix-blend-multiply filter blur-[120px] animate-blob" style={{ animationDelay: "-5s" }}></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMCwgMCwgMCwgMC4wNSkiLz48L3N2Zz4=')] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]"></div>
      </div>

      <main className="relative z-10 w-full max-w-5xl mx-auto px-6 py-12 flex flex-col md:flex-row gap-12 lg:gap-24 items-center justify-center">
        {/* Left Side: Branding & Trust */}
        <div className="flex-1 text-center md:text-left max-w-md animate-fade-in-up stagger-1">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 font-bold text-xs tracking-wider uppercase mb-6 shadow-sm">
            <ShieldCheck className="w-4 h-4" /> B2B Enterprise Grade
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-800 pb-1">
            ProcureFlow.
          </h1>
          <p className="text-lg text-slate-500 font-medium leading-relaxed mb-8">
            The secure, multi-tenant inventory operating system. Centralize your warehouses, enforce role-based access, and eliminate race conditions.
          </p>
          <div className="hidden md:flex flex-col gap-4">
            <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              Isolated Company Workspaces
            </div>
            <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              Invite-Only Role Assignments
            </div>
            <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              End-to-End Audit Logs
            </div>
          </div>
        </div>

        {/* Right Side: Auth Card (Wrapped in Suspense for useSearchParams) */}
        <Suspense fallback={<div className="w-full max-w-md bg-white/50 backdrop-blur-xl h-96 rounded-3xl"></div>}>
          <AuthContent />
        </Suspense>
      </main>
    </div>
  );
}
