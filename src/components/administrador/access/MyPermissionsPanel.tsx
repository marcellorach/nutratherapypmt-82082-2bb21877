import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';

const MyPermissionsPanel: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { rows, loading } = usePermissions();
  const { userRoles } = useAuth();
  const isEn = i18n.language?.startsWith('en');

  const catalog = useQuery({
    queryKey: ['permission-catalog'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permissions')
        .select('key, label_pt, label_en, category')
        .order('category');
      if (error) throw error;
      return data ?? [];
    },
  });

  const labelFor = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of (catalog.data ?? []) as any[]) map[p.key] = isEn ? p.label_en : p.label_pt;
    return map;
  }, [catalog.data, isEn]);

  if (loading || catalog.isLoading) return <Skeleton className="h-72 w-full" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('admin.permissions.mine.title')}</CardTitle>
        <p className="text-sm text-muted-foreground">{t('admin.permissions.mine.subtitle')}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">{t('admin.permissions.mine.roles')}:</span>
          {userRoles.length === 0 ? (
            <Badge variant="outline">{t('admin.permissions.mine.noRoles')}</Badge>
          ) : (
            userRoles.map((role) => (
              <Badge key={role} variant="secondary">
                {t(`admin.permissions.roles.${role}`, role)}
              </Badge>
            ))
          )}
        </div>

        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('admin.permissions.mine.empty')}</p>
        ) : (
          <ul className="divide-y">
            {rows.map((row) => (
              <li
                key={row.permission_key}
                className="flex items-center justify-between py-2 gap-3"
              >
                <div>
                  <div className="font-medium">
                    {labelFor[row.permission_key] ?? row.permission_key}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {row.permission_key}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={row.level === 'edit' ? 'default' : 'secondary'}>
                    {t(`admin.permissions.levels.${row.level}`)}
                  </Badge>
                  <Badge variant="outline">
                    {t(`admin.permissions.sources.${row.source}`, row.source)}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default MyPermissionsPanel;
