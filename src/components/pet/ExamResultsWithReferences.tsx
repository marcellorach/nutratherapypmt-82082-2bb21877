import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Built-in canine reference ranges for the most common bloodwork keys
 * we surface in demos and AI extractions. Lower-cased keys.
 * Source: ISFM/ACVIM/IRIS adult canine consensus values.
 */
const CANINE_REF: Record<string, { low: number; high: number; unit?: string; label?: string }> = {
  wbc: { low: 6000, high: 17000, unit: '/µL', label: 'WBC' },
  rbc: { low: 5.5, high: 8.5, unit: '×10⁶/µL', label: 'RBC' },
  platelets: { low: 200000, high: 500000, unit: '/µL', label: 'Plaquetas' },
  hematocrit: { low: 37, high: 55, unit: '%', label: 'Hematócrito' },
  hemoglobin: { low: 12, high: 18, unit: 'g/dL', label: 'Hemoglobina' },
  alt: { low: 10, high: 100, unit: 'U/L', label: 'ALT' },
  ast: { low: 0, high: 50, unit: 'U/L', label: 'AST' },
  alp: { low: 20, high: 150, unit: 'U/L', label: 'FA (ALP)' },
  ggt: { low: 0, high: 7, unit: 'U/L', label: 'GGT' },
  creatinine: { low: 0.5, high: 1.6, unit: 'mg/dL', label: 'Creatinina' },
  urea: { low: 15, high: 60, unit: 'mg/dL', label: 'Ureia' },
  bun: { low: 7, high: 27, unit: 'mg/dL', label: 'BUN' },
  glucose: { low: 70, high: 120, unit: 'mg/dL', label: 'Glicose' },
  albumin: { low: 2.6, high: 4.0, unit: 'g/dL', label: 'Albumina' },
  total_protein: { low: 5.4, high: 7.5, unit: 'g/dL', label: 'Proteína total' },
  cholesterol: { low: 110, high: 320, unit: 'mg/dL', label: 'Colesterol' },
  triglycerides: { low: 20, high: 150, unit: 'mg/dL', label: 'Triglicérides' },
  t4: { low: 1.0, high: 4.0, unit: 'µg/dL', label: 'T4 total' },
  tsh: { low: 0, high: 0.6, unit: 'ng/mL', label: 'TSH' },
  sdma: { low: 0, high: 14, unit: 'µg/dL', label: 'SDMA' },
  crp: { low: 0, high: 10, unit: 'mg/L', label: 'PCR (CRP)' },
  '8_ohdg_ng_ml': { low: 0, high: 5, unit: 'ng/mL', label: '8-OHdG' },
  mda_umol_l: { low: 0, high: 2.5, unit: 'µmol/L', label: 'MDA' },
  gsh_gssg_ratio: { low: 5, high: 100, label: 'GSH/GSSG' },
};

function lookupRef(rawKey: string) {
  const k = rawKey.toLowerCase().trim();
  if (CANINE_REF[k]) return CANINE_REF[k];
  // try simplification: remove _u_l / _mg_dl etc.
  const simplified = k.replace(/_(mg_dl|u_l|g_dl|ng_ml|umol_l|ng_dl|ug_dl|mmol_l|cells)$/i, '');
  return CANINE_REF[simplified];
}

function classify(value: number, ref?: { low: number; high: number }): 'normal' | 'low' | 'high' | 'unknown' {
  if (!ref) return 'unknown';
  if (value < ref.low) return 'low';
  if (value > ref.high) return 'high';
  return 'normal';
}

const statusStyle: Record<string, string> = {
  normal: 'text-green-700 bg-green-50 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
  low: 'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
  high: 'text-orange-700 bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800',
  unknown: 'text-muted-foreground bg-muted/40 border-border',
};

interface Props {
  exams: any[];
}

/**
 * Renders consultation exam results as a small table with the result
 * compared against canine reference ranges (when available).
 */
const ExamResultsWithReferences: React.FC<Props> = ({ exams }) => {
  const { t } = useTranslation();
  if (!exams?.length) return null;

  // Flatten: each numeric result key becomes a row.
  const rows: Array<{ examType: string; key: string; raw: any; ref?: any; status: string }> = [];
  for (const e of exams) {
    if (!e.results || typeof e.results !== 'object') {
      rows.push({ examType: e.exam_type, key: '—', raw: String(e.results ?? ''), status: 'unknown' });
      continue;
    }
    for (const [k, v] of Object.entries(e.results as Record<string, any>)) {
      if (k === 'interpretation') continue;
      const num = typeof v === 'number' ? v : Number(String(v).replace(',', '.'));
      const ref = lookupRef(k);
      const status = !Number.isNaN(num) ? classify(num, ref) : 'unknown';
      rows.push({ examType: e.exam_type, key: k, raw: v, ref, status });
    }
  }

  return (
    <div>
      <p className="text-xs uppercase text-muted-foreground mb-1">{t('examResults.title')}</p>
      <div className="rounded-md border border-border overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="text-left px-2 py-1 font-medium">{t('examResults.exam')}</th>
              <th className="text-left px-2 py-1 font-medium">{t('examResults.parameter')}</th>
              <th className="text-left px-2 py-1 font-medium">{t('examResults.result')}</th>
              <th className="text-left px-2 py-1 font-medium">{t('examResults.reference')}</th>
              <th className="text-left px-2 py-1 font-medium">{t('examResults.status')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-border">
                <td className="px-2 py-1 text-muted-foreground">{r.examType}</td>
                <td className="px-2 py-1">{r.ref?.label ?? r.key.replace(/_/g, ' ')}</td>
                <td className="px-2 py-1 font-medium">
                  {typeof r.raw === 'object' ? JSON.stringify(r.raw) : String(r.raw)}
                  {r.ref?.unit ? <span className="text-muted-foreground ml-1">{r.ref.unit}</span> : null}
                </td>
                <td className="px-2 py-1 text-muted-foreground">
                  {r.ref ? `${r.ref.low} – ${r.ref.high}${r.ref.unit ? ' ' + r.ref.unit : ''}` : '—'}
                </td>
                <td className="px-2 py-1">
                  <span className={`inline-block rounded border px-1.5 py-0.5 ${statusStyle[r.status]}`}>
                    {t(`examResults.statusLabel.${r.status}`)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExamResultsWithReferences;
