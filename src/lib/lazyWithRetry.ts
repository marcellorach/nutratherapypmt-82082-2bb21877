import { lazy as reactLazy, type ComponentType, type LazyExoticComponent } from 'react';

const RELOAD_KEY = '__chunk_reload_attempted__';

const isChunkError = (err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('error loading dynamically imported module') ||
    msg.includes('Unable to preload CSS') ||
    msg.includes('Failed to load stylesheet')
  );
};

/**
 * React.lazy with resilience against stale hashed chunks after a new deploy.
 * Retries once (cache-busted), then falls back to a single hard reload so the
 * browser picks up the fresh index.html instead of showing a blank screen.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return reactLazy(async () => {
    try {
      return await factory();
    } catch (err) {
      if (!isChunkError(err)) throw err;

      // Second attempt — transient network failures recover here.
      try {
        return await factory();
      } catch (retryErr) {
        if (typeof window === 'undefined') throw retryErr;
        if (!sessionStorage.getItem(RELOAD_KEY)) {
          sessionStorage.setItem(RELOAD_KEY, '1');
          window.location.reload();
          // Keep the promise pending while the page reloads.
          return await new Promise<{ default: T }>(() => {});
        }
        throw retryErr;
      }
    }
  });
}
