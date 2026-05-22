/**
 * OMIA XML streaming parser using `sax`.
 * The OMIA dump (omia.xml.gz) is a MySQL XML export. Each phene row has
 * <table_data name="Phenes_table">/<row>/<field name="phene_id">…</field>…
 * We collect <Phenes_table> rows whose gb_species_id = 9615 (Canis lupus familiaris)
 * and index by phene_name → "<phene_id>-9615".
 *
 * Input is gzipped — caller passes the raw .gz path; we pipe through zlib.
 */
import * as fs from 'node:fs';
import * as zlib from 'node:zlib';
import sax from 'sax';

export interface OmiaIndex {
  byName: Map<string, string>; // lowercase phene_name → "phene_id-9615"
  total: number;
}

const CANIS = '9615';

export function parseOmiaXmlGz(path: string): Promise<OmiaIndex> {
  return new Promise((resolve, reject) => {
    const parser = sax.createStream(true, { trim: true });
    const byName = new Map<string, string>();
    let total = 0;

    let currentTable: string | null = null;
    let inRow = false;
    let row: Record<string, string> = {};
    let pendingField: string | null = null;

    parser.on('opentag', node => {
      const n = node.name;
      const attrs = node.attributes as Record<string, string>;
      if (n === 'table_data') {
        currentTable = attrs.name ?? null;
      } else if (n === 'row' && currentTable) {
        inRow = true;
        row = {};
      } else if (n === 'field' && inRow) {
        pendingField = attrs.name ?? null;
      }
    });

    parser.on('text', text => {
      if (pendingField !== null) {
        row[pendingField] = (row[pendingField] ?? '') + text;
      }
    });

    parser.on('closetag', name => {
      if (name === 'field') {
        pendingField = null;
      } else if (name === 'row' && inRow) {
        if (currentTable === 'Phenes_table' && row.gb_species_id === CANIS) {
          const phene = (row.phene_name ?? '').trim();
          const id = (row.phene_id ?? '').trim();
          if (phene && id) {
            const key = phene.toLowerCase();
            if (!byName.has(key)) byName.set(key, `${id}-${CANIS}`);
            total++;
          }
        }
        inRow = false;
        row = {};
      } else if (name === 'table_data') {
        currentTable = null;
      }
    });

    parser.on('error', reject);
    parser.on('end', () => resolve({ byName, total }));

    fs.createReadStream(path).pipe(zlib.createGunzip()).pipe(parser);
  });
}
