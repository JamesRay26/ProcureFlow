import { roles } from '@/lib/rbac';

export default function DeveloperRoleMenu({ name, role }: { name: string; role: string }) {
  return (
    <details className="relative">
      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-lg p-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-bold text-white">{name.charAt(0)}</span>
        <span><span className="block text-sm font-bold text-slate-900 dark:text-slate-100">{name}</span><span className="block text-xs text-slate-500">{roles.find(option => option.value === role)?.label ?? role}</span></span>
        <span aria-hidden="true" className="text-slate-400">?</span>
      </summary>
      <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
        <p className="px-3 py-2 text-xs text-slate-500">Local developer role</p>
        <form action="/api/auth/development/role" method="POST">
          {roles.map(option => <button key={option.value} name="role" value={option.value} type="submit" aria-pressed={role === option.value} className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold hover:bg-blue-50 dark:hover:bg-slate-800 ${role === option.value ? 'bg-blue-50 text-blue-700 dark:bg-slate-800 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'}`}>{option.label}{role === option.value ? ' ?' : ''}</button>)}
        </form>
      </div>
    </details>
  );
}
