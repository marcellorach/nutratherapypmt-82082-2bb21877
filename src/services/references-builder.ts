/**
 * Sprint 5 — Scientific references builder.
 *
 * Pure functions that take raw `scientific_studies` rows (as fetched by the
 * proposal references hook) and produce a deduplicated, ordered list plus
 * Vancouver-formatted citation strings. No DB access here — kept pure for
 * testability.
 */

export interface RawStudy {
  id: string;
  title?: string | null;
  title_en?: string | null;
  authors?: string | string[] | null;
  journal?: string | null;
  journal_en?: string | null;
  year?: number | string | null;
  pmid?: string | null;
  doi?: string | null;
  link?: string | null;
  // optional context tagging from the caller
  _compounds?: string[];
  _conditions?: string[];
}

export interface BuiltReference {
  id: string;
  pmid: string | null;
  doi: string | null;
  url: string | null;
  year: number | null;
  title: string;
  journal: string;
  authors: string[];
  vancouver: string;
  compounds: string[];
  conditions: string[];
}

const normalizeAuthors = (raw: RawStudy['authors']): string[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((a) => String(a).trim()).filter(Boolean);
  // string: split by ; or , (heuristic — many sources use "; " separator)
  return String(raw)
    .split(/;|,/)
    .map((a) => a.trim())
    .filter(Boolean);
};

const dedupeKey = (s: RawStudy): string => {
  if (s.pmid) return `pmid:${String(s.pmid).trim()}`;
  if (s.doi) return `doi:${String(s.doi).trim().toLowerCase()}`;
  return `id:${s.id}`;
};

/**
 * Vancouver-style citation:
 *   Authors. Title. Journal. Year;[PMID].
 * We keep it conservative (no volume/issue — many of our rows don't have it).
 */
export const formatVancouver = (s: BuiltReference): string => {
  const authorsPart = (() => {
    if (s.authors.length === 0) return '';
    if (s.authors.length <= 6) return s.authors.join(', ');
    return `${s.authors.slice(0, 6).join(', ')}, et al.`;
  })();
  const parts: string[] = [];
  if (authorsPart) parts.push(authorsPart + '.');
  if (s.title) parts.push(s.title.replace(/\.$/, '') + '.');
  if (s.journal) parts.push(s.journal + '.');
  if (s.year) parts.push(String(s.year) + '.');
  if (s.pmid) parts.push(`PMID: ${s.pmid}.`);
  else if (s.doi) parts.push(`doi:${s.doi}.`);
  return parts.join(' ').trim();
};

export const buildReferences = (raw: RawStudy[]): BuiltReference[] => {
  const map = new Map<string, BuiltReference>();

  for (const s of raw || []) {
    if (!s || !s.id) continue;
    const key = dedupeKey(s);
    const yearNum = s.year ? Number(s.year) : NaN;
    const built: BuiltReference = {
      id: s.id,
      pmid: s.pmid ? String(s.pmid).trim() : null,
      doi: s.doi ? String(s.doi).trim() : null,
      url:
        s.link ||
        (s.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${String(s.pmid).trim()}/` : null) ||
        (s.doi ? `https://doi.org/${String(s.doi).trim()}` : null),
      year: Number.isFinite(yearNum) ? yearNum : null,
      title: (s.title_en || s.title || '').trim(),
      journal: (s.journal_en || s.journal || '').trim(),
      authors: normalizeAuthors(s.authors),
      vancouver: '',
      compounds: Array.from(new Set(s._compounds || [])),
      conditions: Array.from(new Set(s._conditions || [])),
    };
    built.vancouver = formatVancouver(built);

    const existing = map.get(key);
    if (!existing) {
      map.set(key, built);
    } else {
      // merge tagging (compound/condition context across triplets)
      existing.compounds = Array.from(new Set([...existing.compounds, ...built.compounds]));
      existing.conditions = Array.from(new Set([...existing.conditions, ...built.conditions]));
    }
  }

  // Sort: newer year first, then title asc.
  return Array.from(map.values()).sort((a, b) => {
    const ya = a.year ?? 0;
    const yb = b.year ?? 0;
    if (yb !== ya) return yb - ya;
    return a.title.localeCompare(b.title);
  });
};

/** Filter helper used by the UI. Case-insensitive substring match. */
export const filterReferences = (
  refs: BuiltReference[],
  query: string,
): BuiltReference[] => {
  const q = (query || '').trim().toLowerCase();
  if (!q) return refs;
  return refs.filter((r) => {
    if (r.title.toLowerCase().includes(q)) return true;
    if (r.journal.toLowerCase().includes(q)) return true;
    if (r.authors.some((a) => a.toLowerCase().includes(q))) return true;
    if (r.compounds.some((c) => c.toLowerCase().includes(q))) return true;
    if (r.conditions.some((c) => c.toLowerCase().includes(q))) return true;
    if (r.pmid && r.pmid.includes(q)) return true;
    return false;
  });
};