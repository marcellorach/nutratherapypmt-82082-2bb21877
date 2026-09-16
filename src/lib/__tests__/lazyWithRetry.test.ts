import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadWithRetry, RELOAD_KEY } from '@/lib/lazyWithRetry';
import { ASSET_FAILURE_EVENT, ASSET_FAILURE_STORAGE_KEY } from '@/lib/assetFailureTelemetry';

const CHUNK_URL = 'https://app.example.com/assets/EstudosTab-DEsiKxQe.js';
const chunkError = () =>
  new TypeError(`Failed to fetch dynamically imported module: ${CHUNK_URL}`);

let reload: ReturnType<typeof vi.fn>;
let events: any[];

function makeStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
  } as unknown as Storage;
}

beforeEach(() => {
  events = [];
  reload = vi.fn();
  vi.stubGlobal('sessionStorage', makeStorage());
  vi.stubGlobal('navigator', { userAgent: 'vitest' });
  vi.stubGlobal('window', {
    location: { reload },
    dispatchEvent: (e: any) => {
      events.push(e.detail ?? e);
      return true;
    },
  });
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const opts = { delaysMs: [1, 2] };

describe('loadWithRetry', () => {
  it('resolves on the first attempt without telemetry', async () => {
    const factory = vi.fn().mockResolvedValue({ default: 'ok' });
    await expect(loadWithRetry(factory, opts)).resolves.toEqual({ default: 'ok' });
    expect(factory).toHaveBeenCalledTimes(1);
    expect(events).toHaveLength(0);
    expect(reload).not.toHaveBeenCalled();
  });

  it('retries after a chunk error without alerting the user', async () => {
    const factory = vi
      .fn()
      .mockRejectedValueOnce(chunkError())
      .mockResolvedValue({ default: 'ok' });

    await expect(loadWithRetry(factory, opts)).resolves.toEqual({ default: 'ok' });
    expect(factory).toHaveBeenCalledTimes(2);
    // Falha transitória resolvida pelo retry: nenhum alerta, nada persistido.
    expect(events).toHaveLength(0);
    expect(sessionStorage.getItem(ASSET_FAILURE_STORAGE_KEY)).toBeNull();
    expect(reload).not.toHaveBeenCalled();
  });

  it('clears a previous failure record once a retry succeeds', async () => {
    sessionStorage.setItem(ASSET_FAILURE_STORAGE_KEY, JSON.stringify([{ message: 'old' }]));
    const factory = vi
      .fn()
      .mockRejectedValueOnce(chunkError())
      .mockResolvedValue({ default: 'ok' });

    await loadWithRetry(factory, opts);
    expect(sessionStorage.getItem(ASSET_FAILURE_STORAGE_KEY)).toBeNull();
  });

  it('respects the backoff delays between attempts', async () => {
    const sleep = vi.fn().mockResolvedValue(undefined);
    const factory = vi.fn().mockRejectedValue(chunkError());

    // Never settles because the final step triggers a reload; race against a tick.
    void loadWithRetry(factory, { delaysMs: [300, 900], sleep });
    await new Promise((r) => setTimeout(r, 0));

    expect(sleep.mock.calls.map((c) => c[0])).toEqual([300, 900]);
    expect(factory).toHaveBeenCalledTimes(3);
  });

  it('reloads exactly once after exhausting retries and logs attempt counts', async () => {
    const factory = vi.fn().mockRejectedValue(chunkError());

    let settled = false;
    void loadWithRetry(factory, opts).then(() => { settled = true; });
    await new Promise((r) => setTimeout(r, 20));

    expect(factory).toHaveBeenCalledTimes(3);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(settled).toBe(false); // promise stays pending while the page reloads
    // Só a falha final (não recuperável) vira alerta persistido.
    expect(events.map((e) => e.attempt)).toEqual([3]);
    expect(events[0].willReload).toBe(true);
    expect(events.every((e) => e.url === CHUNK_URL)).toBe(true);
    expect(sessionStorage.getItem(RELOAD_KEY)).toBe('1');
    const stored = JSON.parse(sessionStorage.getItem(ASSET_FAILURE_STORAGE_KEY) ?? '[]');
    expect(stored).toHaveLength(1);
  });

  it('does not reload twice: rethrows when the session flag is already set', async () => {
    sessionStorage.setItem(RELOAD_KEY, '1');
    const factory = vi.fn().mockRejectedValue(chunkError());

    await expect(loadWithRetry(factory, opts)).rejects.toThrow(
      /Failed to fetch dynamically imported module/,
    );
    expect(reload).not.toHaveBeenCalled();
    expect(events).toHaveLength(1);
    expect(events[0].willReload).toBe(false);
  });

  it('propagates non-chunk errors immediately', async () => {
    const factory = vi.fn().mockRejectedValue(new TypeError('x is not a function'));
    await expect(loadWithRetry(factory, opts)).rejects.toThrow('x is not a function');
    expect(factory).toHaveBeenCalledTimes(1);
    expect(events).toHaveLength(0);
    expect(reload).not.toHaveBeenCalled();
  });

  it('emits on the shared channel only for unrecovered failures', async () => {
    const dispatched: string[] = [];
    (globalThis as any).window.dispatchEvent = (e: any) => {
      dispatched.push(e.type ?? ASSET_FAILURE_EVENT);
      return true;
    };
    const recovered = vi
      .fn()
      .mockRejectedValueOnce(chunkError())
      .mockResolvedValue({ default: 'ok' });
    await loadWithRetry(recovered, opts);
    expect(dispatched).toHaveLength(0);

    sessionStorage.setItem(RELOAD_KEY, '1');
    const failing = vi.fn().mockRejectedValue(chunkError());
    await expect(loadWithRetry(failing, opts)).rejects.toThrow();
    expect(dispatched).toHaveLength(1);
  });
});
