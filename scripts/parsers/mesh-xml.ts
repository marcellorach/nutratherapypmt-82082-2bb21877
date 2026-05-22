/**
 * MeSH desc XML streaming parser using `sax`.
 * Extracts DescriptorRecord → DescriptorUI + DescriptorName + ConceptList synonyms.
 * Filters by TreeNumber prefix: C (Diseases) and D (Chemicals/Drugs).
 */
import * as fs from 'node:fs';
import sax from 'sax';

export interface MeshIndex {
  byName: Map<string, string>; // lowercase name → MeSH DescriptorUI
  total: number;
}

const TREE_PREFIXES = ['C', 'D'];

export function parseMeshXml(path: string): Promise<MeshIndex> {
  return new Promise((resolve, reject) => {
    const parser = sax.createStream(true, { trim: true });
    const byName = new Map<string, string>();
    let total = 0;

    // record state
    let inRecord = false;
    let descriptorUI: string | null = null;
    let descriptorName: string | null = null;
    let treeNumbers: string[] = [];
    let conceptTerms: string[] = [];

    // text-collection state (which leaf element are we inside?)
    const stack: string[] = [];
    let pendingTreeNumber = false;
    let pendingDescriptorUI = false;
    let pendingDescriptorName = false;
    let pendingTermString = false;

    const flush = () => {
      if (!descriptorUI || !descriptorName) return;
      const ok = treeNumbers.some(t => TREE_PREFIXES.includes(t.charAt(0)));
      if (!ok) return;
      const add = (n: string) => {
        const key = n.trim().toLowerCase();
        if (key && !byName.has(key)) byName.set(key, descriptorUI!);
      };
      add(descriptorName);
      for (const t of conceptTerms) add(t);
      total++;
    };

    parser.on('opentag', node => {
      stack.push(node.name);
      if (node.name === 'DescriptorRecord') {
        inRecord = true;
        descriptorUI = null;
        descriptorName = null;
        treeNumbers = [];
        conceptTerms = [];
      }
      if (!inRecord) return;
      // DescriptorUI lives directly under DescriptorRecord
      if (node.name === 'DescriptorUI' && stack[stack.length - 2] === 'DescriptorRecord') {
        pendingDescriptorUI = true;
      }
      // DescriptorName/String is the canonical name
      if (node.name === 'String' && stack[stack.length - 2] === 'DescriptorName') {
        pendingDescriptorName = true;
      }
      if (node.name === 'TreeNumber') pendingTreeNumber = true;
      // ConceptList → Concept → TermList → Term → String  ⇒ synonyms
      if (node.name === 'String' && stack[stack.length - 2] === 'Term') {
        pendingTermString = true;
      }
    });

    parser.on('text', text => {
      if (pendingDescriptorUI) {
        descriptorUI = text;
        pendingDescriptorUI = false;
      } else if (pendingDescriptorName) {
        descriptorName = text;
        pendingDescriptorName = false;
      } else if (pendingTreeNumber) {
        treeNumbers.push(text);
        pendingTreeNumber = false;
      } else if (pendingTermString) {
        conceptTerms.push(text);
        pendingTermString = false;
      }
    });

    parser.on('closetag', name => {
      stack.pop();
      if (name === 'DescriptorRecord') {
        flush();
        inRecord = false;
      }
    });

    parser.on('error', reject);
    parser.on('end', () => resolve({ byName, total }));

    fs.createReadStream(path).pipe(parser);
  });
}
