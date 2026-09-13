import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { PERMISSIONS_QUERY_KEY } from '@/hooks/usePermissions';

/** Roles the screen can assign — same list validated by the database. */
export const ASSIGNABLE_ROLES = [
  'admin',
  'scientist',
  'vet_coordinator',
  'veterinarian',
  'tutor',
  'user',
] as const;

export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

interface PlatformUser {
  user_id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string | null;
  last_sign_in_at: string | null;
  roles: string[];
}

const PLATFORM_USERS_KEY = ['platform-users'] as const;

const PlatformUsersPanel: React.FC = () => {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [pending, setPending] = useState<string | null>(null);

  const users = useQuery({
    queryKey: PLATFORM_USERS_KEY,
    queryFn: async (): Promise<PlatformUser[]> => {
      const { data, error } = await supabase.rpc('list_platform_users');
      if (error) throw error;
      return (data ?? []) as PlatformUser[];
    },
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const rows = users.data ?? [];
    if (!term) return rows;
    return rows.filter(
      (u) =>
        (u.email ?? '').toLowerCase().includes(term) ||
        (u.full_name ?? '').toLowerCase().includes(term),
    );
  }, [users.data, search]);

  const formatDate = (value: string | null) =>
    value
      ? new Date(value).toLocaleDateString(i18n.language?.startsWith('en') ? 'en-US' : 'pt-BR')
      : t('admin.permissions.users.never');

  const toggleRole = async (target: PlatformUser, role: AssignableRole) => {
    const has = target.roles.includes(role);
    const key = `${target.user_id}:${role}`;
    setPending(key);
    try {
      if (has) {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', target.user_id)
          .eq('role', role);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: target.user_id, role });
        if (error) throw error;
      }
      await queryClient.invalidateQueries({ queryKey: PLATFORM_USERS_KEY });
      if (target.user_id === user?.id) {
        await queryClient.invalidateQueries({ queryKey: PERMISSIONS_QUERY_KEY });
      }
      toast({ title: t('admin.permissions.users.saved') });
    } catch (error: any) {
      toast({
        title: t('admin.permissions.users.saveError'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setPending(null);
    }
  };

  if (users.isLoading) return <Skeleton className="h-72 w-full" />;

  if (users.error) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          {t('admin.permissions.users.loadError')}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-2">
        <CardTitle>{t('admin.permissions.users.title')}</CardTitle>
        <p className="text-sm text-muted-foreground">{t('admin.permissions.users.subtitle')}</p>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('admin.permissions.users.searchPlaceholder')}
          className="max-w-sm"
        />
      </CardHeader>
      <CardContent className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('admin.permissions.users.empty')}</p>
        ) : (
          filtered.map((u) => (
            <div
              key={u.user_id}
              className="flex flex-col gap-3 rounded-md border p-3 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={u.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {(u.full_name ?? u.email ?? '?').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{u.full_name ?? u.email}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('admin.permissions.users.lastSignIn', {
                      date: formatDate(u.last_sign_in_at),
                    })}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {u.roles.length === 0 && (
                  <Badge variant="outline" className="text-muted-foreground">
                    {t('admin.permissions.users.noRole')}
                  </Badge>
                )}
                {ASSIGNABLE_ROLES.map((role) => {
                  const active = u.roles.includes(role);
                  const busy = pending === `${u.user_id}:${role}`;
                  return (
                    <Button
                      key={role}
                      size="sm"
                      variant={active ? 'default' : 'outline'}
                      disabled={busy}
                      onClick={() => toggleRole(u, role)}
                    >
                      {busy && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                      {t(`admin.permissions.roles.${role}`)}
                    </Button>
                  );
                })}
              </div>
            </div>
          ))
        )}
        <p className="text-xs text-muted-foreground">{t('admin.permissions.users.hint')}</p>
      </CardContent>
    </Card>
  );
};

export default PlatformUsersPanel;
