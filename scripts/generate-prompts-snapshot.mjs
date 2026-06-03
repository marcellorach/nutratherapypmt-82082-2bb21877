#!/usr/bin/env node
/**
 * generate-prompts-snapshot.mjs
 *
 * Lê supabase/functions/_shared/system-prompts.ts e emite
 * docs/generated/PROMPTS.md — snapshot read-only do registro de prompts efetivos
 * por task (default_content). Override de DB NÃO entra aqui (snapshot estático).
 *
 * Regenerar:  npm run docs:prompts
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(__dirname, '../supabase/functions/_shared/system-prompts.ts');
const OUT = resolve(__dirname, '../docs/generated/PROMPTS.md');

const src = readFileSync(SRC, 'utf8');

// Parser leve: encontra blocos `  <key>: {  ... content: \`...\` ... },`
// Funciona porque o arquivo segue convenção estável (ver _shared/system-prompts.ts).
const ENTRY_RE = /^\s{2}([a-z0-9_]+):\s*\{\s*$/gm;
const entries = [];
let m;
const lines = src.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const km = line.match(/^\s{2}([a-z0-9_]+):\s*\{\s*$/);
  if (!km) continue;
  const key = km[1];
  // Captura até a próxima linha "  }," no mesmo nível de indentação.
  let j = i + 1;
  const buf = [];
  while (j < lines.length && !/^\s{2}\},?\s*$/.test(lines[j])) {
    buf.push(lines[j]);
    j++;
  }
  const block = buf.join('\n');
  const purpose = (block.match(/purpose:\s*'([^']*)'/) || block.match(/purpose:\s*"([^"]*)"/) || [])[1] || '';
  const model = (block.match(/model_default:\s*'([^']*)'/) || [])[1] || '';
  const temp = (block.match(/temperature:\s*([0-9.]+)/) || [])[1] || '';
  const fmt = (block.match(/output_format:\s*'([^']*)'/) || [])[1] || '';
  const consumers = (block.match(/consumers:\s*\[([^\]]*)\]/) || [])[1] || '';
  // Conteúdo: pega o trecho dentro de `content: \`...\``
  const cIdx = block.indexOf('content:');
  let content = '';
  if (cIdx >= 0) {
    const after = block.slice(cIdx);
    const bt1 = after.indexOf('`');
    const bt2 = after.indexOf('`', bt1 + 1);
    if (bt1 >= 0 && bt2 > bt1) content = after.slice(bt1 + 1, bt2);
  }
  entries.push({ key, purpose, model, temp, fmt, consumers: consumers.replace(/['"]/g, '').trim(), content });
  i = j;
}

const now = new Date().toISOString().slice(0, 10);
const head = `# PROMPTS — Snapshot do registro de system prompts

> **DO NOT EDIT.** Gerado por \`npm run docs:prompts\`
> (scripts/generate-prompts-snapshot.mjs). Última geração: ${now}.
>
> Fonte: \`supabase/functions/_shared/system-prompts.ts\`.
> Snapshot do \`default_content\` apenas — overrides de DB (\`ai_system_prompts.override_content\`)
> NÃO entram aqui por design (snapshot estável para visibilidade pública).

## Resumo

- Total de prompts: **${entries.length}**

## Índice

${entries.map(e => `- [\`${e.key}\`](#${e.key.replace(/_/g, '-')}) — ${e.purpose || '(sem purpose)'}`).join('\n')}

---

`;

const body = entries.map(e => `## \`${e.key}\`

- **Purpose:** ${e.purpose || '_(none)_'}
- **Model default:** \`${e.model || '-'}\`  · **Temperature:** \`${e.temp || '-'}\`  · **Output:** \`${e.fmt || '-'}\`
- **Consumers:** ${e.consumers || '_(none)_'}

<details><summary>default_content</summary>

\`\`\`
${e.content.replace(/```/g, '` ` `')}
\`\`\`

</details>
`).join('\n---\n\n');

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, head + body, 'utf8');
console.log(`[prompts-snapshot] wrote ${OUT} (${entries.length} prompts)`);