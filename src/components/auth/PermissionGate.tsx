import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import type { PermissionLevel } from '@/hooks/usePermissions.pure';

interface PermissionGateProps {
  /** Full permission key, e.g. `op.parse_study`. */
  permission?: string;
  /** Admin tab id, resolved to `tab.<id>`. */
  tab?: string;
  level?: PermissionLevel;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Fail-closed UI gate. Renders children only when the database says the user
 * holds the permission. While permissions load, nothing is rendered.
 */
const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  tab,
  level = 'view',
  children,
  fallback = null,
}) => {
  const { can, canTab, loading } = usePermissions();

  if (loading) return null;

  const allowed = tab ? canTab(tab, level) : permission ? can(permission, level) : false;
  return <>{allowed ? children : fallback}</>;
};

/** Convenience wrapper for sidebar entries. */
export const TabGate: React.FC<{ tab: string; children: React.ReactNode }> = ({ tab, children }) => (
  <PermissionGate tab={tab}>{children}</PermissionGate>
);

export default PermissionGate;
