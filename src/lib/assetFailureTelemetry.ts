import { SENEX_VERSION } from '@/config/senex-version';

export type FailureDetail = {
  message: string;
  url?: string;
  /** Nome do chunk deduzido da URL (ex.: EstudosTab-DEsiKxQe.js). */
  chunkName?: string;
  /** Número da tentativa que falhou (1-based). Ausente em falhas globais de asset. */
  attempt?: number;
  /** Indica se a falha vai disparar um reload único da página. */
  willReload?: boolean;
  timestamp: string;
  buildVersion: string;
  userAgent: string;
};

export const ASSET_FAILURE_STORAGE_KEY = '__asset_failures__';
export const ASSET_FAILURE_EVENT = 'asset-preload-failure';

export function isAssetError(msg?: string, url?: string): boolean {
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

/** Extrai a URL do asset citada na mensagem do erro de import dinâmico. */
export function extractAssetUrl(message?: string): string | undefined {
  if (!message) return undefined;
  const match = message.match(/https?:\/\/[^\s"')]+/);
  return match?.[0];
}

export function extractChunkName(url?: string): string | undefined {
  if (!url) return undefined;
  const clean = url.split('?')[0];
  const last = clean.split('/').pop();
  return last || undefined;
}

export function recordAssetFailure(
  partial: Omit<FailureDetail, 'timestamp' | 'buildVersion' | 'userAgent'>,
): FailureDetail {
  const detail: FailureDetail = {
    ...partial,
    timestamp: new Date().toISOString(),
    buildVersion: SENEX_VERSION,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
  };

  try {
    const raw = sessionStorage.getItem(ASSET_FAILURE_STORAGE_KEY) ?? '[]';
    const arr: FailureDetail[] = JSON.parse(raw);
    arr.push(detail);
    sessionStorage.setItem(ASSET_FAILURE_STORAGE_KEY, JSON.stringify(arr.slice(-20)));
  } catch {
    /* ignore quota / unavailable storage */
  }

  // Structured telemetry log — easy to grep in production console.
  // eslint-disable-next-line no-console
  console.error('[asset-preload-failure]', detail);

  try {
    window.dispatchEvent(new CustomEvent(ASSET_FAILURE_EVENT, { detail }));
  } catch {
    /* no window (tests / SSR) */
  }

  return detail;
}

/** Installed once at module load — captures preload failures before React mounts. */
export function installAssetFailureTelemetry() {
  if (typeof window === 'undefined') return;
  if ((window as any).__assetTelemetryInstalled) return;
  (window as any).__assetTelemetryInstalled = true;

  window.addEventListener('error', (e: ErrorEvent) => {
    const target = e.target as HTMLElement | null;
    // <link rel=stylesheet> / <script> load failures bubble as ErrorEvent with target set.
    if (target && (target.tagName === 'LINK' || target.tagName === 'SCRIPT')) {
      const url = (target as HTMLLinkElement).href ?? (target as HTMLScriptElement).src;
      if (isAssetError(undefined, url)) {
        recordAssetFailure({
          message: `Failed to load ${target.tagName.toLowerCase()}`,
          url,
          chunkName: extractChunkName(url),
        });
      }
      return;
    }
    if (isAssetError(e?.message)) {
      const url = (e as any)?.filename ?? extractAssetUrl(e.message);
      recordAssetFailure({ message: e.message, url, chunkName: extractChunkName(url) });
    }
  }, true);

  window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
    const reason: any = e?.reason;
    const msg = reason?.message ?? String(reason ?? '');
    if (isAssetError(msg)) {
      const url = reason?.url ?? extractAssetUrl(msg);
      recordAssetFailure({ message: msg, url, chunkName: extractChunkName(url) });
    }
  });
}
