import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { adminTabsConfig } from '@/config/admin-tabs';
import { APP_ROLES } from '@/config/app-roles';
import {
  resolveEffectiveLevel,
  tabPermissionKey,
  type PermissionEffect,
  type PermissionLevel,
  type RoleGrant,
} from '@/hooks/usePermissions.pure';

interface PlatformUser {
  user_id: string;
  email: string | null;
  full_name: string | null;
  roles: string[];
}

interface OverrideRow {
  user_id: string;
  permission_key: string;
  effect: PermissionEffect;
  level: PermissionLevel;
}

/**
 * Read-only view: for each admin tab, which roles grant access (and at what
 * level) and which real accounts end up reaching it, already applying
 * individual overrides with the same precedence as public.has_permission.
 */
const TabAccessPanel: React.FC = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const grants = useQuery({
    queryKey: ['role-permissions'],
    queryFn: async (): Promise<RoleGrant[]> => {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('role, permission_key, level');
      if (error) throw error;
      return (data ?? []) as RoleGrant[];
    },
  });

  const users = useQuery({
    queryKey: ['platform-users'],
    queryFn: async (): Promise<PlatformUser[]> => {
      const { data, error } = await supabase.rpc('list_platform_users');
      if (error) throw error;
      return (data ?? []) as PlatformUser[];
    },
  });

  const overrides = useQuery({
    queryKey: ['user-permission-overrides'],
    queryFn: async (): Promise<OverrideRow[]> => {
      const { data, error } = await supabase
        .from('user_permission_overrides')
        .select('user_id, permission_key, effect, level');
      if (error) throw error;
      return (data ?? []) as OverrideRow[];
    },
  });

  const rows = useMemo(() => {
    const roleGrants = grants.data ?? [];
    const allUsers = users.data ?? [];
    const allOverrides = overrides.data ?? [];

    return adminTabsConfig.map((tab) => {
      const key = tabPermissionKey(tab.id);

      const roles = APP_ROLES.map((role) => {
        const grant = roleGrants.find((g) => g.role === role && g.permission_key === key);
        return { role, level: grant?.level ?? null };
      }).filter((r) => r.level !== null) as { role: string; level: PermissionLevel }[];

      const people = allUsers
        .map((u) => {
          const override = allOverrides.find(
            (o) => o.user_id === u.user_id && o.permission_key === key,
          );
          const level = resolveEffectiveLevel({
            roleGrants,
            userRoles: u.roles ?? [],
            override: override
              ? { permission_key: key, effect: override.effect, level: override.level }
              : null,
            permissionKey: key,
          });
          return { user: u, level, viaOverride: !!override };
        })
        .filter((p) => p.level !== null);

      return { tab, key, roles, people };
    });
  }, [grants.data, users.data, overrides.data]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (r) =>
        r.tab.id.toLowerCase().includes(term) ||
        r.tab.label.toLowerCase().includes(term) ||
        r.tab.group.toLowerCase().includes(term) ||
        r.roles.some((x) => x.role.includes(term)),
    );
  }, [rows, search]);

  if (grants.isLoading || users.isLoading || overrides.isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('admin.permissions.tabAccess.title')}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {t('admin.permissions.tabAccess.subtitle')}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('admin.permissions.tabAccess.searchPlaceholder')}
          className="max-w-sm"
        />

        <div className="space-y-2">
          {filtered.map(({ tab, key, roles, people }) => (
            <div key={tab.id} className="rounded-md border p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{tab.label}</p>
                  <p className="text-xs text-muted-foreground font-mono">{key}</p>
                </div>
                <Badge variant="outline">{tab.group}</Badge>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {t('admin.permissions.tabAccess.rolesLabel')}
                </span>
                {roles.length === 0 ? (
                  <Badge variant="outline" className="text-muted-foreground">
                    {t('admin.permissions.tabAccess.noRole')}
                  </Badge>
                ) : (
                  roles.map((r) => (
                    <Badge key={r.role} variant={r.level === 'edit' ? 'default' : 'secondary'}>
                      {t(`admin.permissions.roles.${r.role}`)} ·{' '}
                      {t(`admin.permissions.levels.${r.level}`)}
                    </Badge>
                  ))
                )}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {t('admin.permissions.tabAccess.peopleLabel', { count: people.length })}
                </span>
                {people.length === 0 ? (
                  <Badge variant="outline" className="text-muted-foreground">
                    {t('admin.permissions.tabAccess.nobody')}
                  </Badge>
                ) : (
                  people.map((p) => (
                    <Badge
                      key={p.user.user_id}
                      variant={p.level === 'edit' ? 'default' : 'secondary'}
                      className="font-normal"
                    >
                      {p.user.email ?? p.user.full_name ?? p.user.user_id} ·{' '}
                      {t(`admin.permissions.levels.${p.level as PermissionLevel}`)}
                      {p.viaOverride ? ` · ${t('admin.permissions.sources.override')}` : ''}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">{t('admin.permissions.tabAccess.hint')}</p>
      </CardContent>
    </Card>
  );
};

export default TabAccessPanel;
