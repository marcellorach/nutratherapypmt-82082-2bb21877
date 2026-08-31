import { lazy as reactLazy, type ComponentType, type LazyExoticComponent } from 'react';
import {
  extractAssetUrl,
  extractChunkName,
  recordAssetFailure,
} from '@/lib/assetFailureTelemetry';

export const RELOAD_KEY = '__chunk_reload_attempted__';

/** Backoff entre tentativas (ms). O tamanho define o número de retries. */
export const RETRY_DELAYS_MS = [300, 900];

export const isChunkError = (err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('error loading dynamically imported module') ||
    msg.includes('Unable to preload CSS') ||
    msg.includes('Failed to load stylesheet')
  );
};

export type LoadWithRetryOptions = {
  /** Sobrescreve os atrasos de backoff (útil em testes). */
  delaysMs?: number[];
  sleep?: (ms: number) => Promise<void>;
};

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Carrega um módulo dinâmico com retry + backoff e, como último recurso,
 * um único reload da página (protegido por flag de sessão) para pegar o
 * index.html novo depois de um deploy.
 */
export async function loadWithRetry<T>(
  factory: () => Promise<T>,
  options: LoadWithRetryOptions = {},
): Promise<T> {
  const delays = options.delaysMs ?? RETRY_DELAYS_MS;
  const sleep = options.sleep ?? defaultSleep;
  const maxAttempts = delays.length + 1;

  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    attempt += 1;
    try {
      return await factory();
    } catch (err) {
      if (!isChunkError(err)) throw err;

      const message = err instanceof Error ? err.message : String(err);
      const url = extractAssetUrl(message);
      const hasMoreAttempts = attempt < maxAttempts;

      let willReload = false;
      if (!hasMoreAttempts && typeof window !== 'undefined') {
        try {
          willReload = !sessionStorage.getItem(RELOAD_KEY);
        } catch {
          willReload = false;
        }
      }

      recordAssetFailure({
        message,
        url,
        chunkName: extractChunkName(url),
        attempt,
        willReload,
      });

      if (hasMoreAttempts) {
        await sleep(delays[attempt - 1]);
        continue;
      }

      if (willReload) {
        try {
          sessionStorage.setItem(RELOAD_KEY, '1');
        } catch {
          /* ignore */
        }
        window.location.reload();
        // Mantém a promise pendente enquanto a página recarrega.
        return await new Promise<T>(() => {});
      }

      throw err;
    }
  }
}

/**
 * React.lazy resiliente a chunks obsoletos após um novo deploy.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return reactLazy(() => loadWithRetry(factory));
}
