import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SENEX_VERSION } from '@/config/senex-version';

type FailureDetail = {
  message: string;
  url?: string;
  timestamp: string;
  buildVersion: string;
  userAgent: string;
};

const STORAGE_KEY = '__asset_failures__';
const EVENT_NAME = 'asset-preload-failure';

function isAssetError(msg?: string, url?: string): boolean {
  if (!msg && !url) return false;
  const m = msg ?? '';
  if (
    m.includes('Unable to preload CSS') ||
    m.includes('Failed to load stylesheet') ||
    m.includes('Failed to fetch dynamically imported module') ||
    m.includes('Importing a module script failed') ||
    m.includes('error loading dynamically imported module')
  ) {
    return true;
  }
  if (url && /\/assets\/.+\.(css|js|mjs)(\?|$)/.test(url)) return true;
  return false;
}

function recordFailure(detail: FailureDetail) {
  try {
    const arr: FailureDetail[] = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '[]');
    arr.push(detail);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(arr.slice(-20)));
  } catch {
    /* ignore quota errors */
  }
  // Structured telemetry log — easy to grep in production console / Sentry-like tools.
  // eslint-disable-next-line no-console
  console.error('[asset-preload-failure]', detail);
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail }));
}

/** Installed once at module load — captures preload failures before React mounts. */
export function installAssetFailureTelemetry() {
  if (typeof window === 'undefined') return;
  if ((window as any).__assetTelemetryInstalled) return;
  (window as any).__assetTelemetryInstalled = true;

  const make = (message: string, url?: string): FailureDetail => ({
    message,
    url,
    timestamp: new Date().toISOString(),
    buildVersion: SENEX_VERSION,
    userAgent: navigator.userAgent,
  });

  window.addEventListener('error', (e: ErrorEvent) => {
    const target = e.target as HTMLElement | null;
    // <link rel=stylesheet> / <script> load failures bubble as ErrorEvent with target set.
    if (target && (target.tagName === 'LINK' || target.tagName === 'SCRIPT')) {
      const url = (target as HTMLLinkElement).href ?? (target as HTMLScriptElement).src;
      if (isAssetError(undefined, url)) {
        recordFailure(make(`Failed to load ${target.tagName.toLowerCase()}`, url));
      }
      return;
    }
    if (isAssetError(e?.message)) {
      recordFailure(make(e.message, (e as any)?.filename));
    }
  }, true);

  window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
    const reason: any = e?.reason;
    const msg = reason?.message ?? String(reason ?? '');
    if (isAssetError(msg)) {
      recordFailure(make(msg, reason?.url));
    }
  });
}

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
      time: 'Horário',
      reload: 'Recarregar',
      dismiss: 'Dispensar',
    },
    en: {
      title: 'Failed to load part of the application',
      body: 'A resource is unavailable (likely a stale cached version). Reload the page to get the latest version.',
      build: 'Build',
      resource: 'Resource',
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
    window.addEventListener(EVENT_NAME, onFailure);
    // If a failure already happened before React mounted, surface it.
    try {
      const arr: FailureDetail[] = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '[]');
      if (arr.length > 0) setDetail(arr[arr.length - 1]);
    } catch { /* noop */ }
    return () => window.removeEventListener(EVENT_NAME, onFailure);
  }, []);

  if (!detail) return null;

  const handleReload = () => {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
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
                  {tr.resource}: <span className="font-mono">{detail.url}</span>
                </div>
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