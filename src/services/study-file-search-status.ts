export type FileSearchStage = {
  status?: string;
  error_message?: string;
  reason?: string;
};

export type StudyFileSearchState = {
  kanban_status?: string | null;
  ingestion_stages?: unknown;
};

export type FileSearchCompletion =
  | { status: 'ok' | 'degraded'; stage: FileSearchStage }
  | { status: 'failed'; stage: FileSearchStage; error: string };

const getFileSearchStage = (stages: unknown): FileSearchStage => {
  if (!stages || typeof stages !== 'object' || Array.isArray(stages)) return {};
  const fileSearch = (stages as Record<string, unknown>).file_search;
  if (!fileSearch || typeof fileSearch !== 'object' || Array.isArray(fileSearch)) return {};
  return fileSearch as FileSearchStage;
};

export const waitForFileSearchCompletion = async (
  loadState: () => Promise<StudyFileSearchState>,
  options: { intervalMs?: number; timeoutMs?: number } = {},
): Promise<FileSearchCompletion> => {
  const intervalMs = options.intervalMs ?? 2_000;
  const timeoutMs = options.timeoutMs ?? 240_000;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const state = await loadState();
    const stage = getFileSearchStage(state.ingestion_stages);

    if (stage.status === 'ok' || stage.status === 'degraded') {
      return { status: stage.status, stage };
    }

    if (stage.status === 'failed' || state.kanban_status === 'error') {
      return {
        status: 'failed',
        stage,
        error: stage.error_message || stage.reason || 'File Search processing failed',
      };
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error('File Search processing timed out before reporting a final result');
};