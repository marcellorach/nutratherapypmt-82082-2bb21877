import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { OPERATION_PERMISSION_KEYS, APP_PERMISSION_KEYS } from './permission-catalog';
import { tabPermissionKey } from '@/hooks/usePermissions.pure';

/**
 * Guard: admin-tabs.ts and the permission catalogue must not drift.
 * A tab with no permission key is invisible for everyone (fail-closed),
 * so divergence is a bug, not a soft warning.
 */
const adminTabIds = (): string[] => {
  const source = readFileSync(new URL('./admin-tabs.ts', import.meta.url), 'utf8');
  return [...source.matchAll(/^\s*id:\s*'([^']+)'/gm)].map((m) => m[1]);
};

// Snapshot of the keys seeded in public.permissions (47 tabs + 9 operations + 1 app).
const EXPECTED_TAB_COUNT = 47;

describe('permission catalogue', () => {
  it('has a tab.<id> key for every admin tab', () => {
    const ids = adminTabIds();
    expect(ids.length).toBe(EXPECTED_TAB_COUNT);
    for (const id of ids) {
      expect(tabPermissionKey(id)).toBe(`tab.${id}`);
    }
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('declares the operation keys enforced server-side', () => {
    for (const key of [
      'op.parse_study',
      'op.gemini_file_search',
      'op.extract_study_entities',
      'op.generate_triplets',
      'op.enrich_knowledge_graph',
    ]) {
      expect(OPERATION_PERMISSION_KEYS).toContain(key);
    }
  });

  it('keeps the admin entry point in the catalogue', () => {
    expect(APP_PERMISSION_KEYS).toContain('admin.access');
  });
});
