/**
 * Geroscience condition whitelist + helpers.
 *
 * Geroscience conditions are biological hallmarks of aging that the SYSTEM
 * infers from clinical data. They must be visually grouped at the END of the
 * condition list with an explicit "atenção geriátrica" sub-label so vets
 * never mistake them for traditional clinical diagnoses they made themselves.
 *
 * See: mem://principles/geroscience-condition-grouping
 */

const GEROSCIENCE_KEYS_LOWER: string[] = [
  'inflammaging',
  'chronic low-grade inflammation',
  'chronic inflammation',
  'oxidative stress',
  'cellular senescence',
  'mitochondrial dysfunction',
  'sarcopenia',
  'cognitive dysfunction syndrome',
  'canine cognitive dysfunction',
  'immunosenescence',
  'immune senescence',
  'telomere attrition',
  'epigenetic alterations',
  'loss of proteostasis',
  'deregulated nutrient sensing',
  'stem cell exhaustion',
  'altered intercellular communication',
  // Portuguese variants
  'inflamação crônica',
  'estresse oxidativo',
  'senescência celular',
  'disfunção mitocondrial',
  'sarcopenia',
  'disfunção cognitiva',
  'imunossenescência',
];

export function isGeroscienceCondition(name?: string | null): boolean {
  if (!name) return false;
  const n = name.toLowerCase().trim();
  return GEROSCIENCE_KEYS_LOWER.some((k) => n.includes(k));
}

/**
 * Returns the i18n key + interpolation params for the geroscience origin
 * sub-label. Caller does the actual t() call.
 */
export function geroscienceOriginLabelKey(
  origin: string | null | undefined,
  consultationDateISO: string | null | undefined,
): { key: string; params?: Record<string, string> } {
  if (origin === 'exam_suggested') {
    return { key: 'geroscienceAttention.bySuggestedExams' };
  }
  if (consultationDateISO) {
    return {
      key: 'geroscienceAttention.byVetVisit',
      params: { date: formatShortDate(consultationDateISO) },
    };
  }
  return { key: 'geroscienceAttention.byVetGeneric' };
}

function formatShortDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString();
  } catch {
    return iso;
  }
}
