/**
 * ChEBI OBO parser (streaming, line-by-line).
 * Builds Map<lowercased_name_or_synonym, chebi_id>.
 * Filters: only [Term] stanzas, ignores obsolete.
 */
import * as fs from 'node:fs';
import * as readline from 'node:readline';

export interface ChebiIndex {
  byName: Map<string, string>; // lowercase name → CHEBI:12345 (without prefix → 12345)
  total: number;
}

export async function parseChebiObo(path: string): Promise<ChebiIndex> {
  const rl = readline.createInterface({
    input: fs.createReadStream(path),
    crlfDelay: Infinity,
  });

  const byName = new Map<string, string>();
  let inTerm = false;
  let currentId: string | null = null;
  let currentName: string | null = null;
  let currentSyns: string[] = [];
  let obsolete = false;
  let total = 0;

  const flush = () => {
    if (currentId && currentName && !obsolete) {
      const id = currentId.replace(/^CHEBI:/i, '');
      const add = (n: string) => {
        const key = n.trim().toLowerCase();
        if (key && !byName.has(key)) byName.set(key, id);
      };
      add(currentName);
      for (const s of currentSyns) add(s);
      total++;
    }
    inTerm = false;
    currentId = null;
    currentName = null;
    currentSyns = [];
    obsolete = false;
  };

  for await (const line of rl) {
    if (line.startsWith('[Term]')) {
      flush();
      inTerm = true;
      continue;
    }
    if (line.startsWith('[') && !line.startsWith('[Term]')) {
      flush();
      continue;
    }
    if (!inTerm) continue;

    if (line.startsWith('id: ')) currentId = line.slice(4).trim();
    else if (line.startsWith('name: ')) currentName = line.slice(6).trim();
    else if (line.startsWith('is_obsolete: true')) obsolete = true;
    else if (line.startsWith('synonym: ')) {
      // synonym: "alpha-tocopherol" EXACT [...]
      const m = line.match(/^synonym: "([^"]+)"/);
      if (m) currentSyns.push(m[1]);
    }
  }
  flush();
  return { byName, total };
}
