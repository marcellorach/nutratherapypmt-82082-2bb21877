import { describe, it, expect } from 'vitest';
import {
  buildPermissionMap,
  hasPermissionIn,
  canAccessTab,
  resolveEffectiveLevel,
  tabPermissionKey,
} from './usePermissions.pure';

describe('permission resolution (mirrors public.has_permission)', () => {
  it('is fail-closed for unknown keys', () => {
    const map = buildPermissionMap([
      { permission_key: 'tab.estudos', level: 'edit', source: 'role' },
    ]);
    expect(hasPermissionIn(map, 'tab.prompts')).toBe(false);
    expect(canAccessTab(map, 'prompts')).toBe(false);
    expect(hasPermissionIn(null, 'tab.estudos')).toBe(false);
  });

  it('treats edit as covering view, but not the other way round', () => {
    const map = buildPermissionMap([
      { permission_key: 'tab.estudos', level: 'edit', source: 'role' },
      { permission_key: 'tab.prompts', level: 'view', source: 'role' },
    ]);
    expect(canAccessTab(map, 'estudos', 'view')).toBe(true);
    expect(canAccessTab(map, 'estudos', 'edit')).toBe(true);
    expect(canAccessTab(map, 'prompts', 'view')).toBe(true);
    expect(canAccessTab(map, 'prompts', 'edit')).toBe(false);
  });

  it('keeps the strongest level when rows repeat', () => {
    const map = buildPermissionMap([
      { permission_key: 'tab.estudos', level: 'view', source: 'role' },
      { permission_key: 'tab.estudos', level: 'edit', source: 'override' },
    ]);
    expect(map['tab.estudos']).toBe('edit');
  });

  it('applies precedence: individual deny > individual allow > role', () => {
    const roleGrants = [
      { role: 'scientist', permission_key: 'tab.estudos', level: 'edit' as const },
    ];
    const userRoles = ['scientist'];

    expect(resolveEffectiveLevel({ roleGrants, userRoles, permissionKey: 'tab.estudos' })).toBe('edit');

    expect(
      resolveEffectiveLevel({
        roleGrants,
        userRoles,
        override: { permission_key: 'tab.estudos', effect: 'deny', level: 'view' },
        permissionKey: 'tab.estudos',
      }),
    ).toBeNull();

    expect(
      resolveEffectiveLevel({
        roleGrants,
        userRoles,
        override: { permission_key: 'tab.estudos', effect: 'deny', level: 'edit' },
        permissionKey: 'tab.estudos',
      }),
    ).toBe('view');

    expect(
      resolveEffectiveLevel({
        roleGrants: [],
        userRoles: ['tutor'],
        override: { permission_key: 'tab.estudos', effect: 'allow', level: 'view' },
        permissionKey: 'tab.estudos',
      }),
    ).toBe('view');
  });

  it('ignores grants from roles the user does not have', () => {
    expect(
      resolveEffectiveLevel({
        roleGrants: [{ role: 'admin', permission_key: 'tab.prompts', level: 'edit' }],
        userRoles: ['tutor'],
        permissionKey: 'tab.prompts',
      }),
    ).toBeNull();
  });

  it('maps tab ids to catalogue keys', () => {
    expect(tabPermissionKey('triplet-curation')).toBe('tab.triplet-curation');
  });
});
