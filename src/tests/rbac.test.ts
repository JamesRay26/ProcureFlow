import { describe, expect, it, vi, afterEach } from 'vitest';
import { can, isLocalDeveloper } from '../lib/rbac';

afterEach(() => vi.unstubAllEnvs());
describe('role boundaries', () => {
  it('prevents auditors from writing and staff from approving or administering', () => {
    for (const permission of ['inventory:create', 'request:create', 'request:approve', 'team:manage'] as const) expect(can('AUDITOR', permission)).toBe(false);
    expect(can('AUDITOR', 'audit:read')).toBe(true);
    expect(can('WAREHOUSE_STAFF', 'request:create')).toBe(true);
    for (const permission of ['request:approve', 'team:manage', 'audit:read'] as const) expect(can('WAREHOUSE_STAFF', permission)).toBe(false);
    expect(can('PROCUREMENT_MANAGER', 'request:approve')).toBe(true);
    expect(can('PROCUREMENT_MANAGER', 'team:manage')).toBe(false);
    expect(can('ADMIN', 'team:manage')).toBe(true);
    expect(can('unknown', 'inventory:create')).toBe(false);
  });
  it('restricts role previews to the local developer in development', () => {
    const user = { email: 'local-developer@procureflow.invalid' };
    vi.stubEnv('NODE_ENV', 'development');
    expect(isLocalDeveloper(user, 'localhost:3001')).toBe(true);
    expect(isLocalDeveloper(user, 'example.com')).toBe(false);
    expect(isLocalDeveloper({ email: 'staff@example.com' }, 'localhost:3001')).toBe(false);
    vi.stubEnv('NODE_ENV', 'production');
    expect(isLocalDeveloper(user, 'localhost:3001')).toBe(false);
  });
});
