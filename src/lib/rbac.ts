export const roles = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'PROCUREMENT_MANAGER', label: 'Manager' },
  { value: 'AUDITOR', label: 'Auditor' },
  { value: 'WAREHOUSE_STAFF', label: 'Staff' },
] as const;
export type Permission = 'inventory:create' | 'request:create' | 'request:approve' | 'audit:read' | 'team:manage';
export function can(role: string, permission: Permission): boolean {
  if (role === 'ADMIN' || role === 'SYSTEM_ADMIN') return true;
  const grants: Record<string, Permission[]> = {
    PROCUREMENT_MANAGER: ['inventory:create', 'request:create', 'request:approve', 'audit:read'],
    WAREHOUSE_STAFF: ['inventory:create', 'request:create'],
    AUDITOR: ['audit:read'],
  };
  return grants[role]?.includes(permission) ?? false;
}
export function isLocalDeveloper(user: { email: string } | null, host: string | null): boolean {
  return process.env.NODE_ENV === 'development' && user?.email === 'local-developer@procureflow.invalid'
    && !!host && /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host);
}
