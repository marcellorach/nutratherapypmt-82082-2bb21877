/**
 * Snapshot of the permission catalogue stored in public.permissions.
 *
 * Fail-closed contract: every admin tab must have a matching `tab.<id>` key
 * here (and in the database). A tab without a registered permission is
 * invisible to everyone — see src/hooks/usePermissions.pure.ts.
 *
 * Kept in sync with the database by the migration that seeds public.permissions
 * and guarded by src/config/permission-catalog.test.ts.
 */

export const OPERATION_PERMISSION_KEYS = [
  'op.parse_study',
  'op.gemini_file_search',
  'op.extract_study_entities',
  'op.generate_triplets',
  'op.enrich_knowledge_graph',
  'op.force_reextract',
  'op.curate_approve',
  'op.manage_users',
  'op.manage_permissions',
] as const;

export const APP_PERMISSION_KEYS = ['admin.access'] as const;

export type OperationPermissionKey = (typeof OPERATION_PERMISSION_KEYS)[number];
