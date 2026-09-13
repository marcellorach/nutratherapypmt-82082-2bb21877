import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { PERMISSIONS_QUERY_KEY } from '@/hooks/usePermissions';
import type { PermissionLevel } from '@/hooks/usePermissions.pure';

export const MANAGED_ROLES = [
  'admin',
  'scientist',
  'vet_coordinator',
  'veterinarian',
  'tutor',
  'user',
] as const;

type ManagedRole = (typeof MANAGED_ROLES)[number];

interface PermissionRow {
  key: string;
  category: string;
  label_pt: string;
  label_en: string;
}

interface RolePermissionRow {
  role: string;
  permission_key: string;
  level: PermissionLevel;
}

const cycle = (current: PermissionLevel | null): PermissionLevel | null =>
  current === null ? 'view' : current === 'view' ? 'edit' : null;

const PermissionsMatrixPanel: React.FC = () => {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const isEn = i18n.language?.startsWith('en');

  const catalog = useQuery({
    queryKey: ['permission-catalog'],
    queryFn: async (): Promise<PermissionRow[]> => {
      const { data, error } = await supabase
        .from('permissions')
        .select('key, category, label_pt, label_en')
        .order('category')
        .order('key');
      if (error) throw error;
      return (data ?? []) as PermissionRow[];
    },
  });

  const grid = useQuery({
    queryKey: ['role-permissions'],
    queryFn: async (): Promise<RolePermissionRow[]> => {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('role, permission_key, level');
      if (error) throw error;
      return (data ?? []) as RolePermissionRow[];
    },
  });

  const gridMap = useMemo(() => {
    const map: Record<string, PermissionLevel> = {};
    for (const row of grid.data ?? []) map[`${row.role}::${row.permission_key}`] = row.level;
    return map;
  }, [grid.data]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const rows = catalog.data ?? [];
    if (!term) return rows;
    return rows.filter(
      (r) =>
        r.key.toLowerCase().includes(term) ||
        r.label_pt.toLowerCase().includes(term) ||
        r.label_en.toLowerCase().includes(term),
    );
  }, [catalog.data, search]);

  const toggle = async (role: ManagedRole, permissionKey: string) => {
    const current = gridMap[`${role}::${permissionKey}`] ?? null;
    const next = cycle(current);
    try {
      if (next === null) {
        const { error } = await supabase
          .from('role_permissions')
          .delete()
          .eq('role', role)
          .eq('permission_key', permissionKey);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('role_permissions')
          .upsert(
            { role, permission_key: permissionKey, level: next },
            { onConflict: 'role,permission_key' },
          );
        if (error) throw error;
      }
      await queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      await queryClient.invalidateQueries({ queryKey: PERMISSIONS_QUERY_KEY });
    } catch (error: any) {
      toast({
        title: t('admin.permissions.matrix.saveError'),
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (catalog.isLoading || grid.isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('admin.permissions.matrix.title')}</CardTitle>
        <p className="text-sm text-muted-foreground">{t('admin.permissions.matrix.subtitle')}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('admin.permissions.matrix.searchPlaceholder')}
          className="max-w-sm"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-4 font-medium">
                  {t('admin.permissions.matrix.permission')}
                </th>
                {MANAGED_ROLES.map((role) => (
                  <th key={role} className="px-2 py-2 font-medium text-center whitespace-nowrap">
                    {t(`admin.permissions.roles.${role}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((perm) => (
                <tr key={perm.key} className="border-b hover:bg-muted/40">
                  <td className="py-2 pr-4">
                    <div className="font-medium">{isEn ? perm.label_en : perm.label_pt}</div>
                    <div className="text-xs text-muted-foreground font-mono">{perm.key}</div>
                  </td>
                  {MANAGED_ROLES.map((role) => {
                    const level = gridMap[`${role}::${perm.key}`] ?? null;
                    return (
                      <td key={role} className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => toggle(role, perm.key)}
                          className="focus-visible:ring-2 focus-visible:ring-ring rounded"
                          aria-label={`${perm.key} / ${role}`}
                        >
                          <Badge
                            variant={
                              level === 'edit' ? 'default' : level === 'view' ? 'secondary' : 'outline'
                            }
                          >
                            {level
                              ? t(`admin.permissions.levels.${level}`)
                              : t('admin.permissions.levels.none')}
                          </Badge>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">{t('admin.permissions.matrix.hint')}</p>
      </CardContent>
    </Card>
  );
};

export default PermissionsMatrixPanel;
