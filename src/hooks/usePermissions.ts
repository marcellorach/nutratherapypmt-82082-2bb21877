import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  buildPermissionMap,
  canAccessTab,
  hasPermissionIn,
  type EffectivePermissionRow,
  type PermissionLevel,
  type PermissionMap,
} from './usePermissions.pure';

export const PERMISSIONS_QUERY_KEY = ['effective-permissions'] as const;

/**
 * Effective permissions of the signed-in user, read from the database
 * (my_effective_permissions). The server is always the source of truth —
 * every protected write is re-checked by has_permission server-side.
 *
 * Client-side freshness (measured, not assumed): permissions, role_permissions
 * and user_permission_overrides are NOT part of the supabase_realtime
 * publication, so the subscription below only fires if that publication is
 * enabled later. The guaranteed behaviour today is:
 *   - staleTime 30s;
 *   - refetch when the window regains focus or the connection is restored;
 *   - immediate invalidation in the session that edited the grid.
 * A revocation made elsewhere is therefore visible within 30s of the next
 * focus/refetch, not instantly.
 */
export const usePermissions = () => {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...PERMISSIONS_QUERY_KEY, user?.id ?? 'anonymous'],
    enabled: !!user,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    queryFn: async (): Promise<EffectivePermissionRow[]> => {
      const { data, error } = await supabase.rpc('my_effective_permissions');
      if (error) throw error;
      return (data ?? []) as EffectivePermissionRow[];
    },
  });

  // Optional fast path: only fires if these tables are added to the
  // supabase_realtime publication (they are NOT today). Harmless otherwise.
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('permission-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'role_permissions' }, () => {
        queryClient.invalidateQueries({ queryKey: PERMISSIONS_QUERY_KEY });
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_permission_overrides' },
        () => {
          queryClient.invalidateQueries({ queryKey: PERMISSIONS_QUERY_KEY });
        },
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, () => {
        queryClient.invalidateQueries({ queryKey: PERMISSIONS_QUERY_KEY });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const map: PermissionMap = useMemo(() => buildPermissionMap(query.data), [query.data]);

  return {
    permissions: map,
    rows: query.data ?? [],
    loading: authLoading || query.isLoading,
    error: query.error as Error | null,
    refresh: () => queryClient.invalidateQueries({ queryKey: PERMISSIONS_QUERY_KEY }),
    can: (key: string, level: PermissionLevel = 'view') => hasPermissionIn(map, key, level),
    canTab: (tabId: string, level: PermissionLevel = 'view') => canAccessTab(map, tabId, level),
  };
};

/** Invalidate the permission cache from anywhere (e.g. after editing the grid). */
export const invalidatePermissions = (queryClient: ReturnType<typeof useQueryClient>) =>
  queryClient.invalidateQueries({ queryKey: PERMISSIONS_QUERY_KEY });
