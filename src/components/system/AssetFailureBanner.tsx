import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ASSET_FAILURE_EVENT,
  ASSET_FAILURE_STORAGE_KEY,
  installAssetFailureTelemetry,
  type FailureDetail,
} from '@/lib/assetFailureTelemetry';

export { installAssetFailureTelemetry };

/** Banner shown when one or more asset preload failures are captured. */
export default function AssetFailureBanner() {
  const [detail, setDetail] = useState<FailureDetail | null>(null);
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'pt').toLowerCase().startsWith('en') ? 'en' : 'pt';
  const tr = {
    pt: {
      title: 'Falha ao carregar parte da aplicação',
      body: 'Detectamos um recurso indisponível (provavelmente uma versão antiga em cache). Recarregue a página para obter a versão mais recente.',
      build: 'Build',
      resource: 'Recurso',
      attempts: 'Tentativas',
      time: 'Horário',
      reload: 'Recarregar',
      dismiss: 'Dispensar',
    },
    en: {
      title: 'Failed to load part of the application',
      body: 'A resource is unavailable (likely a stale cached version). Reload the page to get the latest version.',
      build: 'Build',
      resource: 'Resource',
      attempts: 'Attempts',
      time: 'Time',
      reload: 'Reload',
      dismiss: 'Dismiss',
    },
  }[lang];

  useEffect(() => {
    const onFailure = (e: Event) => {
      const d = (e as CustomEvent<FailureDetail>).detail;
      setDetail(d);
    };
    window.addEventListener(ASSET_FAILURE_EVENT, onFailure);
    // If a failure already happened before React mounted, surface it.
    try {
      const arr: FailureDetail[] = JSON.parse(sessionStorage.getItem(ASSET_FAILURE_STORAGE_KEY) ?? '[]');
      if (arr.length > 0) setDetail(arr[arr.length - 1]);
    } catch { /* noop */ }
    return () => window.removeEventListener(ASSET_FAILURE_EVENT, onFailure);
  }, []);

  if (!detail) return null;

  const handleReload = () => {
    try { sessionStorage.removeItem(ASSET_FAILURE_STORAGE_KEY); } catch { /* noop */ }
    window.location.reload();
  };

  const handleDismiss = () => setDetail(null);

  return (
    <div
      role="alert"
      className="fixed bottom-4 left-1/2 z-[9999] w-[min(92vw,520px)] -translate-x-1/2 rounded-lg border border-warning/40 bg-warning-subtle text-warning-foreground shadow-elevated"
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">
              {tr.title}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {tr.body}
            </p>
            <div className="mt-2 space-y-0.5 text-[10px] text-muted-foreground/80">
              <div>{tr.build}: <span className="font-mono">{detail.buildVersion}</span></div>
              {detail.url && (
                <div className="truncate">
                  {tr.resource}: <span className="font-mono">{detail.chunkName ?? detail.url}</span>
                </div>
              )}
              {typeof detail.attempt === 'number' && (
                <div>{tr.attempts}: <span className="font-mono">{detail.attempt}</span></div>
              )}
              <div>{tr.time}: <span className="font-mono">{detail.timestamp}</span></div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleReload}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
            >
              {tr.reload}
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
            >
              {tr.dismiss}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
