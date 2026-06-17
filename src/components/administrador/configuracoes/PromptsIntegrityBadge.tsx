import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, ShieldAlert, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { APP_VERSION, PROMPTS_REVISION } from '@/config/app-version';

interface IntegrityCheck {
  id: string;
  app_version: string;
  manifest_count: number;
  db_count: number;
  missing_in_db: string[];
  extra_in_db: string[];
  out_of_sync: string[];
  hardcoded_outside_catalog: Array<{ function_name: string; suggested_key: string; note: string }>;
  status: 'ok' | 'drift' | 'error';
  triggered_by: string;
  checked_at: string;
}

interface Props {
  /** Quando true, mostra o painel expansível de "drift" abaixo do selo. */
  expandable?: boolean;
  /** Compacto: oculta os badges de manifest/db count. */
  compact?: boolean;
}

/**
 * Selo unificado de integridade do catálogo de system prompts.
 * Usado em todas as abas de prompts (Recomendações, Extração, System).
 *
 * Mostra três sinais distintos:
 *  - "Sistema 7.2.4 · Prompts rev. 1" (versionamento)
 *  - "Última modificação dos prompts" (max(updated_at) em ai_system_prompts)
 *  - "Última verificação de integridade" (checked_at em integrity_check)
 */
const PromptsIntegrityBadge: React.FC<Props> = ({ expandable = true, compact = false }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [integrity, setIntegrity] = useState<IntegrityCheck | null>(null);
  const [lastModified, setLastModified] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const autoVerifiedRef = React.useRef(false);

  const loadAll = async () => {
    const [check, mod] = await Promise.all([
      supabase
        .from('ai_system_prompts_integrity_check')
        .select('*')
        .order('checked_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('ai_system_prompts')
        .select('updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    if (check.data) setIntegrity(check.data as unknown as IntegrityCheck);
    if (mod.data?.updated_at) setLastModified(mod.data.updated_at);
  };

  const runVerify = async (triggeredBy: 'manual' | 'auto_on_version_bump' = 'manual') => {
    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-system-prompts', {
        body: { app_version: `${APP_VERSION}.${PROMPTS_REVISION}`, triggered_by: triggeredBy },
      });
      if (error) throw error;
      if ((data as any)?.check) setIntegrity((data as any).check as IntegrityCheck);
      await loadAll();
      if (triggeredBy === 'manual') {
        toast({ title: t('admin.systemPrompts.integrity.verifiedToast') });
      }
    } catch (e: any) {
      if (triggeredBy === 'manual') {
        toast({
          variant: 'destructive',
          title: t('admin.systemPrompts.integrity.verifyFailed'),
          description: e.message,
        });
      }
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    (async () => {
      await loadAll();
      if (!autoVerifiedRef.current && typeof window !== 'undefined') {
        const stamp = `${APP_VERSION}.${PROMPTS_REVISION}`;
        const last = localStorage.getItem('lastVerifiedAppVersion');
        if (last !== stamp) {
          autoVerifiedRef.current = true;
          localStorage.setItem('lastVerifiedAppVersion', stamp);
          await runVerify('auto_on_version_bump');
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const status = integrity?.status ?? 'ok';
  const isOk = status === 'ok' && integrity !== null;
  const isError = status === 'error';
  const driftCount = integrity
    ? integrity.missing_in_db.length +
      integrity.extra_in_db.length +
      integrity.out_of_sync.length +
      integrity.hardcoded_outside_catalog.length
    : 0;

  const fmt = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : t('admin.systemPrompts.integrity.never');

  const statusBoxClass = isOk
    ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-900'
    : isError
      ? 'border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900'
      : 'border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900';

  return (
    <Card className={`border ${statusBoxClass}`}>
      <CardContent className="py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {isOk ? (
              <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <ShieldAlert className={`h-5 w-5 shrink-0 ${isError ? 'text-red-600' : 'text-amber-600'}`} />
            )}
            <div className="text-xs space-y-0.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="font-mono text-[10px]">
                  {t('admin.systemPrompts.integrity.systemLabel')} {APP_VERSION}
                </Badge>
                <Badge variant="outline" className="font-mono text-[10px]">
                  {t('admin.systemPrompts.integrity.promptsRevLabel')} {PROMPTS_REVISION}
                </Badge>
                {integrity && !compact && (
                  <Badge variant="outline" className="font-mono text-[10px]">
                    manifest {integrity.manifest_count} · db {integrity.db_count}
                  </Badge>
                )}
              </div>
              <div className="text-foreground font-medium">
                {isOk
                  ? t('admin.systemPrompts.integrity.statusOk')
                  : isError
                    ? t('admin.systemPrompts.integrity.statusError')
                    : t('admin.systemPrompts.integrity.statusDrift', { count: driftCount })}
              </div>
              <div className="text-muted-foreground space-x-3">
                <span>{t('admin.systemPrompts.integrity.lastModified')}: {fmt(lastModified)}</span>
                <span>·</span>
                <span>{t('admin.systemPrompts.integrity.lastChecked')}: {fmt(integrity?.checked_at ?? null)}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            {expandable && integrity && !isOk && (
              <Button variant="ghost" size="sm" onClick={() => setShowDetails((v) => !v)}>
                {showDetails
                  ? t('admin.systemPrompts.integrity.hideDetails')
                  : t('admin.systemPrompts.integrity.showDetails')}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => runVerify('manual')} disabled={verifying}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${verifying ? 'animate-spin' : ''}`} />
              {verifying
                ? t('admin.systemPrompts.integrity.verifying')
                : t('admin.systemPrompts.integrity.verifyNow')}
            </Button>
          </div>
        </div>

        {expandable && integrity && showDetails && !isOk && (
          <div className="mt-3 pt-3 border-t border-current/10 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {integrity.missing_in_db.length > 0 && (
              <div>
                <div className="font-semibold mb-1">
                  {t('admin.systemPrompts.integrity.missingInDb', { count: integrity.missing_in_db.length })}
                </div>
                <div className="flex flex-wrap gap-1">
                  {integrity.missing_in_db.map((k) => (
                    <Badge key={k} variant="secondary" className="font-mono text-[10px]">{k}</Badge>
                  ))}
                </div>
              </div>
            )}
            {integrity.out_of_sync.length > 0 && (
              <div>
                <div className="font-semibold mb-1">
                  {t('admin.systemPrompts.integrity.outOfSync', { count: integrity.out_of_sync.length })}
                </div>
                <div className="flex flex-wrap gap-1">
                  {integrity.out_of_sync.map((k) => (
                    <Badge key={k} variant="secondary" className="font-mono text-[10px]">{k}</Badge>
                  ))}
                </div>
              </div>
            )}
            {integrity.extra_in_db.length > 0 && (
              <div>
                <div className="font-semibold mb-1">
                  {t('admin.systemPrompts.integrity.extraInDb', { count: integrity.extra_in_db.length })}
                </div>
                <div className="flex flex-wrap gap-1">
                  {integrity.extra_in_db.map((k) => (
                    <Badge key={k} variant="secondary" className="font-mono text-[10px]">{k}</Badge>
                  ))}
                </div>
              </div>
            )}
            {integrity.hardcoded_outside_catalog.length > 0 && (
              <div className="md:col-span-2">
                <div className="font-semibold mb-1">
                  {t('admin.systemPrompts.integrity.hardcoded', { count: integrity.hardcoded_outside_catalog.length })}
                </div>
                <div className="flex flex-wrap gap-1">
                  {integrity.hardcoded_outside_catalog.map((h) => (
                    <Badge key={h.function_name} variant="outline" className="font-mono text-[10px]" title={h.note}>
                      {h.function_name} → {h.suggested_key}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PromptsIntegrityBadge;