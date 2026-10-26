'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState, useTransition } from 'react';
import { Moon, Sun, Monitor, Building2, Save, Users, Shield, Trash2, ChevronDown } from 'lucide-react';
import { updateOrganizationName, updateMemberRole, removeMember } from '@/app/actions';

interface MemberData {
  id: string;
  name: string;
  email: string;
  role: string;
  isSelf: boolean;
}

interface SettingsClientProps {
  isAdmin: boolean;
  orgName: string;
  orgId: string;
  members: MemberData[];
  currentUserRole: string;
}

export default function SettingsClient({ isAdmin, orgName, orgId, members, currentUserRole }: SettingsClientProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [companyName, setCompanyName] = useState(orgName);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const handleSaveOrgName = async () => {
    if (!companyName.trim() || companyName.trim() === orgName) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      await updateOrganizationName(companyName.trim());
      setSaveMessage('Organization name updated successfully.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update';
      setSaveMessage(message);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(null), 4000);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    startTransition(async () => {
      try {
        await updateMemberRole(memberId, newRole);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to update role';
        alert(message);
      }
    });
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Remove ${memberName} from this organization? They will lose access to all resources.`)) return;
    startTransition(async () => {
      try {
        await removeMember(memberId);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to remove member';
        alert(message);
      }
    });
  };

  const roleLabels: Record<string, string> = {
    ADMIN: 'Administrator',
    SYSTEM_ADMIN: 'Administrator',
    PROCUREMENT_MANAGER: 'Procurement Manager',
    WAREHOUSE_STAFF: 'Warehouse Staff',
    AUDITOR: 'Auditor',
  };

  const roleDotColors: Record<string, string> = {
    ADMIN: 'bg-indigo-500',
    SYSTEM_ADMIN: 'bg-indigo-500',
    PROCUREMENT_MANAGER: 'bg-blue-500',
    WAREHOUSE_STAFF: 'bg-emerald-500',
    AUDITOR: 'bg-purple-500',
  };

  return (
    <>
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h2>
        <p className="text-slate-500 text-sm mt-1 dark:text-slate-400">Manage your workspace preferences and organization settings.</p>
      </header>
      
      <div className="max-w-3xl space-y-6">

        {/* Organization Settings — Admin Only */}
        {isAdmin && (
          <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Organization</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Change your company name displayed across all workspaces.</p>
            </div>
            <div className="p-5">
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">Company Name</label>
                  <input 
                    type="text" 
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    placeholder="Enter company name"
                  />
                </div>
                <button 
                  onClick={handleSaveOrgName}
                  disabled={saving || !companyName.trim() || companyName.trim() === orgName}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white font-semibold text-sm rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" /> Save
                </button>
              </div>
              {saveMessage && (
                <p className={`mt-3 text-xs font-medium ${saveMessage.includes('success') ? 'text-emerald-600' : 'text-red-600'}`}>
                  {saveMessage}
                </p>
              )}
            </div>
          </section>
        )}

        {/* Team Members — Admin Only */}
        {isAdmin && (
          <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Team Members</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage roles and access for all workspace members.</p>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {members.map((member) => (
                <div key={member.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center font-semibold text-xs shrink-0">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {member.name}
                        {member.isSelf && <span className="ml-1.5 text-[10px] font-medium text-slate-400">(you)</span>}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {member.isSelf ? (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className={`w-1.5 h-1.5 rounded-full ${roleDotColors[member.role] || 'bg-slate-400'}`}></span>
                        {roleLabels[member.role] || member.role}
                      </div>
                    ) : (
                      <>
                        <div className="relative">
                          <select
                            value={member.role}
                            onChange={(e) => handleRoleChange(member.id, e.target.value)}
                            disabled={isPending}
                            className="appearance-none pl-3 pr-8 py-1.5 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 cursor-pointer outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                          >
                            <option value="WAREHOUSE_STAFF">Warehouse Staff</option>
                            <option value="PROCUREMENT_MANAGER">Procurement Manager</option>
                            <option value="AUDITOR">Auditor</option>
                            <option value="ADMIN">Administrator</option>
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                        </div>
                        <button
                          onClick={() => handleRemoveMember(member.id, member.name)}
                          disabled={isPending}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors disabled:opacity-50"
                          title={`Remove ${member.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Theme Settings */}
        <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Appearance</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Choose how ProcureFlow looks on your device.</p>
          </div>
          
          <div className="p-5">
            <div className="grid grid-cols-3 gap-3">
              <button 
                onClick={() => setTheme('light')}
                className={`flex flex-col items-center justify-center p-5 rounded-lg border-2 transition-all ${theme === 'light' ? 'border-slate-900 bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white' : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 text-slate-500 dark:text-slate-400'}`}
              >
                <Sun className="w-6 h-6 mb-2" />
                <span className="text-xs font-semibold">Light</span>
              </button>

              <button 
                onClick={() => setTheme('dark')}
                className={`flex flex-col items-center justify-center p-5 rounded-lg border-2 transition-all ${theme === 'dark' ? 'border-slate-400 bg-slate-900 text-white' : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 text-slate-500 dark:text-slate-400'}`}
              >
                <Moon className="w-6 h-6 mb-2" />
                <span className="text-xs font-semibold">Dark</span>
              </button>

              <button 
                onClick={() => setTheme('system')}
                className={`flex flex-col items-center justify-center p-5 rounded-lg border-2 transition-all ${theme === 'system' ? 'border-slate-900 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 text-slate-500 dark:text-slate-400'}`}
              >
                <Monitor className="w-6 h-6 mb-2" />
                <span className="text-xs font-semibold">System</span>
              </button>
            </div>
          </div>
        </section>

        {/* Non-admin info */}
        {!isAdmin && (
          <section className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Limited Access</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Organization settings and team management are restricted to <strong>Administrator</strong> accounts. 
              Contact your system administrator to request changes.
            </p>
          </section>
        )}
      </div>
    </>
  );
}
