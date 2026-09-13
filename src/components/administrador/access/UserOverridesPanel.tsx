import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Trash2 } from 'lucide-react';
import { PERMISSIONS_QUERY_KEY } from '@/hooks/usePermissions';
import type { PermissionEffect, PermissionLevel } from '@/hooks/usePermissions.pure';

interface OverrideRow {
  id: string;
  user_id: string;
  permission_key: string;
  effect: PermissionEffect;
  level: PermissionLevel;
  reason: string | null;
  created_at: string;
}

const UserOverridesPanel: React.FC = () => {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const isEn = i18n.language?.startsWith('en');

  const [userId, setUserId] = useState('');
  const [permissionKey, setPermissionKey] = useState('');
  const [effect, setEffect] = useState<PermissionEffect>('allow');
  const [level, setLevel] = useState<PermissionLevel>('view');
  const [reason, setReason] = useState('');

  const catalog = useQuery({
    queryKey: ['permission-catalog'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permissions')
        .select('key, label_pt, label_en')
        .order('key');
      if (error) throw error;
      return data ?? [];
    },
  });

  const profiles = useQuery({
    queryKey: ['permission-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('user_id, full_name');
      if (error) throw error;
      return data ?? [];
    },
  });

  const overrides = useQuery({
    queryKey: ['user-permission-overrides'],
    queryFn: async (): Promise<OverrideRow[]> => {
      const { data, error } = await supabase
        .from('user_permission_overrides')
        .select('id, user_id, permission_key, effect, level, reason, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as OverrideRow[];
    },
  });

  const nameFor = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of profiles.data ?? []) map[p.user_id] = p.full_name ?? p.user_id;
    return map;
  }, [profiles.data]);

  const save = async () => {
    if (!userId || !permissionKey) {
      toast({ title: t('admin.permissions.overrides.missingFields'), variant: 'destructive' });
      return;
    }
    try {
      const { error } = await supabase.from('user_permission_overrides').upsert(
        {
          user_id: userId,
          permission_key: permissionKey,
          effect,
          level,
          reason: reason || null,
        },
        { onConflict: 'user_id,permission_key' },
      );
      if (error) throw error;
      setReason('');
      await queryClient.invalidateQueries({ queryKey: ['user-permission-overrides'] });
      await queryClient.invalidateQueries({ queryKey: PERMISSIONS_QUERY_KEY });
      toast({ title: t('admin.permissions.overrides.saved') });
    } catch (error: any) {
      toast({
        title: t('admin.permissions.overrides.saveError'),
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('user_permission_overrides').delete().eq('id', id);
    if (error) {
      toast({
        title: t('admin.permissions.overrides.saveError'),
        description: error.message,
        variant: 'destructive',
      });
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ['user-permission-overrides'] });
    await queryClient.invalidateQueries({ queryKey: PERMISSIONS_QUERY_KEY });
  };

  if (overrides.isLoading || catalog.isLoading) return <Skeleton className="h-72 w-full" />;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.permissions.overrides.title')}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t('admin.permissions.overrides.subtitle')}
          </p>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-5">
          <Select value={userId} onValueChange={setUserId}>
            <SelectTrigger>
              <SelectValue placeholder={t('admin.permissions.overrides.userPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {(profiles.data ?? []).map((p) => (
                <SelectItem key={p.user_id} value={p.user_id}>
                  {p.full_name ?? p.user_id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={permissionKey} onValueChange={setPermissionKey}>
            <SelectTrigger>
              <SelectValue placeholder={t('admin.permissions.overrides.permissionPlaceholder')} />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {(catalog.data ?? []).map((p: any) => (
                <SelectItem key={p.key} value={p.key}>
                  {isEn ? p.label_en : p.label_pt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={effect} onValueChange={(v) => setEffect(v as PermissionEffect)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="allow">{t('admin.permissions.effects.allow')}</SelectItem>
              <SelectItem value="deny">{t('admin.permissions.effects.deny')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={level} onValueChange={(v) => setLevel(v as PermissionLevel)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="view">{t('admin.permissions.levels.view')}</SelectItem>
              <SelectItem value="edit">{t('admin.permissions.levels.edit')}</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('admin.permissions.overrides.reasonPlaceholder')}
            />
            <Button onClick={save}>{t('admin.permissions.overrides.save')}</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('admin.permissions.overrides.listTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {(overrides.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t('admin.permissions.overrides.empty')}
            </p>
          ) : (
            <ul className="divide-y">
              {(overrides.data ?? []).map((o) => (
                <li key={o.id} className="flex items-center justify-between py-2 gap-3">
                  <div>
                    <div className="font-medium">{nameFor[o.user_id] ?? o.user_id}</div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {o.permission_key}
                    </div>
                    {o.reason && <div className="text-xs text-muted-foreground">{o.reason}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={o.effect === 'deny' ? 'destructive' : 'default'}>
                      {t(`admin.permissions.effects.${o.effect}`)}
                    </Badge>
                    <Badge variant="secondary">{t(`admin.permissions.levels.${o.level}`)}</Badge>
                    <Button variant="ghost" size="icon" onClick={() => remove(o.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserOverridesPanel;
