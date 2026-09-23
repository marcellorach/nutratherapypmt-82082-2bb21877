import { describe, expect, it, vi } from 'vitest';
import { waitForFileSearchCompletion } from '../study-file-search-status';

describe('waitForFileSearchCompletion', () => {
  it('waits through processing and returns only after success', async () => {
    const loadState = vi.fn()
      .mockResolvedValueOnce({ ingestion_stages: { file_search: { status: 'processing' } } })
      .mockResolvedValueOnce({ ingestion_stages: { file_search: { status: 'ok' } } });

    const result = await waitForFileSearchCompletion(loadState, { intervalMs: 0, timeoutMs: 100 });

    expect(result.status).toBe('ok');
    expect(loadState).toHaveBeenCalledTimes(2);
  });

  it('surfaces the background failure message', async () => {
    const result = await waitForFileSearchCompletion(
      async () => ({
        kanban_status: 'error',
        ingestion_stages: {
          file_search: {
            status: 'failed',
            error_message: 'Gemini API permanent error 402: RESOURCE_EXHAUSTED',
          },
        },
      }),
      { intervalMs: 0, timeoutMs: 100 },
    );

    expect(result).toMatchObject({
      status: 'failed',
      error: 'Gemini API permanent error 402: RESOURCE_EXHAUSTED',
    });
  });
});