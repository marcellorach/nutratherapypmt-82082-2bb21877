/**
 * Classify a `pet_exams` row as either a physical exam finding (e.g. "Neurological
 * Examination", "Orthopedic Examination") or a true complementary/lab exam
 * (CBC, biochemistry, X-ray, urinalysis, ultrasound, etc.).
 *
 * Demos historically wrote physical-exam findings into `pet_exams.results`,
 * which polluted the "Exames Complementares" table. We partition them at
 * render time without rewriting the database.
 */

const PHYSICAL_EXAM_TYPES = [
  'neurological examination',
  'neurologic examination',
  'orthopedic examination',
  'orthopaedic examination',
  'cardiovascular examination',
  'cardiac examination',
  'dermatological examination',
  'dermatologic examination',
  'abdominal palpation',
  'abdominal examination',
  'general physical examination',
  'physical examination',
  'ophthalmologic examination',
  'ophthalmological examination',
];

const COMPLEMENTARY_EXAM_HINTS = [
  'cbc', 'complete blood count', 'hemograma',
  'biochemistry', 'chemistry panel', 'bioquímico', 'bioquimico',
  'urinalysis', 'urina', 'urin',
  'radiograph', 'x-ray', 'xray', 'raio',
  'ultrasound', 'ultrassom', 'us ',
  'thyroid', 'tireoide', 'tiroide',
  't4', 'tsh', 'sdma', 'crp', 'pcr',
  'fecal', 'parasitological', 'parasit',
  'blood gas', 'gasometria',
  'echocardiogram', 'ecocardio',
  'endoscopy', 'biopsy', 'biópsia',
  'mri', 'ct scan', 'tomografia',
];

const SPECIFIC_AREA_BY_TYPE: Record<string, 'neurological' | 'orthopedic' | 'cardiovascular' | 'dermatological' | 'abdominal'> = {
  'neurological examination': 'neurological',
  'neurologic examination': 'neurological',
  'orthopedic examination': 'orthopedic',
  'orthopaedic examination': 'orthopedic',
  'cardiovascular examination': 'cardiovascular',
  'cardiac examination': 'cardiovascular',
  'dermatological examination': 'dermatological',
  'dermatologic examination': 'dermatological',
  'abdominal palpation': 'abdominal',
  'abdominal examination': 'abdominal',
};

function norm(s?: string | null) {
  return (s ?? '').trim().toLowerCase();
}

export function isPhysicalExamType(examType?: string | null): boolean {
  const t = norm(examType);
  if (!t) return false;
  return PHYSICAL_EXAM_TYPES.some((p) => t.includes(p));
}

export function isComplementaryExamType(examType?: string | null): boolean {
  const t = norm(examType);
  if (!t) return false;
  if (isPhysicalExamType(t)) return false;
  return COMPLEMENTARY_EXAM_HINTS.some((h) => t.includes(h));
}

export function partitionExams<T extends { exam_type?: string | null }>(exams: T[]): {
  physical: T[];
  complementary: T[];
} {
  const physical: T[] = [];
  const complementary: T[] = [];
  for (const e of exams ?? []) {
    if (isPhysicalExamType(e.exam_type)) physical.push(e);
    else complementary.push(e); // unknown types default to complementary (legacy data)
  }
  return { physical, complementary };
}

/**
 * Convert a physical-exam row's `results` JSON into a short "key: value; key: value"
 * string suitable to be merged into PhysicalExamBlock's `specific.<area>` slot.
 */
export function summarizePhysicalExamRow(row: { results?: any }): string {
  const r = row?.results;
  if (!r) return '';
  if (typeof r === 'string') return r;
  if (typeof r !== 'object') return String(r);
  return Object.entries(r)
    .filter(([k]) => k !== 'interpretation')
    .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
    .join('; ');
}

export function getSpecificAreaForType(examType?: string | null): string | null {
  const t = norm(examType);
  for (const key of Object.keys(SPECIFIC_AREA_BY_TYPE)) {
    if (t.includes(key)) return SPECIFIC_AREA_BY_TYPE[key];
  }
  return null;
}

/**
 * Merge an array of physical-exam rows into the structured `physical_exam.specific`
 * shape used by PhysicalExamBlock. Existing values are preserved; new content is
 * appended with " · " separator.
 */
export function mergePhysicalExamRows(
  base: any,
  rows: Array<{ exam_type?: string | null; results?: any; notes?: string | null }>,
): any {
  const out = base ? JSON.parse(JSON.stringify(base)) : { general: null, specific: {} };
  out.specific = out.specific ?? {};
  for (const row of rows ?? []) {
    const area = getSpecificAreaForType(row.exam_type);
    const summary = summarizePhysicalExamRow(row) || (row.notes ?? '');
    if (!summary) continue;
    if (area) {
      const prev = out.specific[area];
      out.specific[area] = prev ? `${prev} · ${summary}` : summary;
    } else {
      // unknown specific area -> dump under "other"
      const prev = out.specific.other;
      const label = `${row.exam_type ?? 'physical'}: ${summary}`;
      out.specific.other = prev ? `${prev} · ${label}` : label;
    }
  }
  return out;
}