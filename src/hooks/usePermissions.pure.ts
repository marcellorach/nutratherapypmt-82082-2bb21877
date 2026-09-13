/**
 * Pure permission resolution — Node-safe (no Supabase, no browser globals).
 *
 * Mirrors public.has_permission / public.my_effective_permissions in the database.
 * The DATABASE is always the source of truth; this module only reproduces the same
 * decision locally so the UI can hide what the server would refuse.
 */

export type PermissionLevel = 'view' | 'edit';
export type PermissionEffect = 'allow' | 'deny';
export type PermissionSource = 'role' | 'override' | 'deny' | 'none';

export interface EffectivePermissionRow {
  permission_key: string;
  level: PermissionLevel;
  source: PermissionSource;
}

export interface RoleGrant {
  role: string;
  permission_key: string;
  level: PermissionLevel;
}

export interface UserOverride {
  permission_key: string;
  effect: PermissionEffect;
  level: PermissionLevel;
}

export type PermissionMap = Record<string, PermissionLevel>;

export const LEVEL_RANK: Record<PermissionLevel, number> = { view: 1, edit: 2 };

export const rank = (level: PermissionLevel | null | undefined): number =>
  level ? LEVEL_RANK[level] ?? 0 : 0;

/** Permission key for an admin tab id (`estudos` -> `tab.estudos`). */
export const tabPermissionKey = (tabId: string): string => `tab.${tabId}`;

/** Builds a lookup map from the rows returned by my_effective_permissions(). */
export const buildPermissionMap = (
  rows: readonly EffectivePermissionRow[] | null | undefined,
): PermissionMap => {
  const map: PermissionMap = {};
  for (const row of rows ?? []) {
    if (!row?.permission_key) continue;
    const current = map[row.permission_key];
    if (!current || rank(row.level) > rank(current)) {
      map[row.permission_key] = row.level;
    }
  }
  return map;
};

/** Fail-closed: unknown key or missing grant means no access. */
export const hasPermissionIn = (
  map: PermissionMap | null | undefined,
  key: string,
  level: PermissionLevel = 'view',
): boolean => {
  if (!map) return false;
  const granted = map[key];
  if (!granted) return false;
  return rank(granted) >= rank(level);
};

export const canAccessTab = (
  map: PermissionMap | null | undefined,
  tabId: string,
  level: PermissionLevel = 'view',
): boolean => hasPermissionIn(map, tabPermissionKey(tabId), level);

/**
 * Same precedence as public.has_permission:
 * individual deny > individual allow > best role grant.
 */
export const resolveEffectiveLevel = (input: {
  roleGrants?: readonly RoleGrant[];
  userRoles?: readonly string[];
  override?: UserOverride | null;
  permissionKey: string;
}): PermissionLevel | null => {
  const { roleGrants = [], userRoles = [], override = null, permissionKey } = input;

  if (override && override.permission_key === permissionKey) {
    if (override.effect === 'deny') {
      // A deny at 'view' blocks everything; a deny at 'edit' only blocks editing.
      return override.level === 'edit' ? 'view' : null;
    }
    return override.level;
  }

  let best: PermissionLevel | null = null;
  for (const grant of roleGrants) {
    if (grant.permission_key !== permissionKey) continue;
    if (!userRoles.includes(grant.role)) continue;
    if (rank(grant.level) > rank(best)) best = grant.level;
  }
  return best;
};
