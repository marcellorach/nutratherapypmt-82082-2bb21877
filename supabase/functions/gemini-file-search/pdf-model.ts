// Resolves the Google model used to read PDFs.
// Source of truth: ai_configurations.ai_model_pdf_reading (edited in
// Admin → Modelos de IA por tarefa). Falls back to DEFAULT_PDF_MODEL when
// nothing is saved or when the saved model does not exist at Google (404).

// deno-lint-ignore-file no-explicit-any

export const DEFAULT_PDF_MODEL = 'gemini-3.1-pro-preview';
export const PDF_MODEL_CONFIG_KEY = 'ai_model_pdf_reading';

export type PdfModelSource = 'config' | 'default' | 'default_after_invalid_config';

export interface ResolvedPdfModel {
  model: string;
  source: PdfModelSource;
  rejected?: string;
}

const MODEL_ID_RE = /^[a-z0-9][a-z0-9.\-]{2,80}$/;

export function normalizeModelId(raw: unknown): string | null {
  if (raw == null) return null;
  const s = String(raw).replace(/"/g, '').trim().replace(/^models\//, '').replace(/^google\//, '');
  return MODEL_ID_RE.test(s) ? s : null;
}

/** Calls Google's models.get. Returns {ok:true} if the model exists for this key. */
export async function checkGoogleModel(
  model: string,
  apiKey: string,
): Promise<{ ok: boolean; status: number; message?: string }> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}?key=${apiKey}`,
  );
  if (res.ok) {
    const info = await res.json().catch(() => ({}));
    const methods: string[] = info?.supportedGenerationMethods ?? [];
    if (methods.length && !methods.includes('generateContent')) {
      return { ok: false, status: 422, message: 'model does not support generateContent' };
    }
    return { ok: true, status: 200 };
  }
  const text = await res.text().catch(() => '');
  return { ok: false, status: res.status, message: text.slice(0, 300) };
}

let cache: { at: number; value: ResolvedPdfModel } | null = null;
const TTL_MS = 30_000;

export async function resolvePdfModel(supabase: any, apiKey: string): Promise<ResolvedPdfModel> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;
  let value: ResolvedPdfModel = { model: DEFAULT_PDF_MODEL, source: 'default' };
  try {
    const { data } = await supabase
      .from('ai_configurations')
      .select('config_value')
      .eq('config_key', PDF_MODEL_CONFIG_KEY)
      .maybeSingle();
    const configured = normalizeModelId(data?.config_value);
    if (configured) {
      if (configured === DEFAULT_PDF_MODEL) {
        value = { model: configured, source: 'config' };
      } else {
        const check = await checkGoogleModel(configured, apiKey);
        if (check.ok) {
          value = { model: configured, source: 'config' };
        } else if (check.status === 404 || check.status === 400 || check.status === 422) {
          console.warn(`⚠️ Modelo configurado "${configured}" inválido (${check.status}); usando padrão ${DEFAULT_PDF_MODEL}`);
          value = { model: DEFAULT_PDF_MODEL, source: 'default_after_invalid_config', rejected: configured };
        } else {
          // Transient/credit error: keep the configured model; the real call will surface the error.
          value = { model: configured, source: 'config' };
        }
      }
    }
  } catch (e) {
    console.warn('⚠️ Falha ao ler ai_model_pdf_reading; usando padrão', e);
  }
  cache = { at: Date.now(), value };
  return value;
}
