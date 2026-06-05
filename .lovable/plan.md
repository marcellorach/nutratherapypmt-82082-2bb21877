# Painel "Preview vs Publicado" — aba de Auditorias

Compara em tempo real 4 artefatos entre o ambiente de **preview** (sandbox Lovable) e o **publicado** (longevidade.ai), com diff lado a lado, sem alterar o pipeline de auditoria existente.

## Artefatos comparados

| Arquivo | Hoje servido em `/public/`? | Ação |
|---|---|---|
| `drift-report.json` | sim | usar como está |
| `ARCHITECTURE_LIVE.md` | **não** (mora em `docs/generated/`) | copiar para `public/snapshots/` no `audit:prebuild` |
| `CHANGELOG.md` | **não** (raiz) | idem |
| `PROMPTS.md` (snapshot) | **não** (`docs/generated/`) | idem |

Sem cópia para `/public/`, o navegador não consegue baixar esses 3 arquivos. O `audit:prebuild` ganha um passo final que copia os 4 para `public/snapshots/` junto de um `manifest.json` com `generated_at` + hash sha-256 de cada um.

## Problema de CORS (e a solução)

A página do preview precisa `fetch()` os mesmos arquivos da URL publicada (`https://longevidade.ai/snapshots/...`). Hospedagem estática Lovable não garante header CORS permissivo entre domínios diferentes, então o fetch direto pode falhar.

**Solução:** uma edge function nova e mínima, `compare-snapshots`, que:
- recebe `{ files: ["drift-report.json", ...] }`
- baixa cada arquivo de `https://id-preview--…lovable.app/snapshots/<file>` e `https://longevidade.ai/snapshots/<file>` em paralelo
- devolve `{ file, preview: {status, body, sha256, fetched_at}, published: {...} }`
- whitelist fixa de nomes de arquivo; sem parâmetros livres → seguro

A edge roda no servidor → sem CORS, sem cache de browser interferindo.

## UI do painel

Novo componente `PreviewVsPublishedPanel.tsx` no topo da aba de auditorias (`TechnicalAuditsTab.tsx`), acima do botão "Gerar nova auditoria":

```text
┌─ Preview vs Publicado ───────────────────────── [↻ Recarregar] ┐
│ Preview:   id-preview--…lovable.app   gerado: 05/06 14:32      │
│ Publicado: longevidade.ai             gerado: 03/06 09:11      │
├────────────────────────────────────────────────────────────────┤
│ drift-report.json         🟡 difere (54 → 56 findings)  [Ver]  │
│ ARCHITECTURE_LIVE.md      🟡 difere                      [Ver]  │
│ CHANGELOG.md              🟡 difere (3 entradas novas)   [Ver]  │
│ PROMPTS.md                🟢 igual                       [Ver]  │
└────────────────────────────────────────────────────────────────┘
```

- Status verde/amarelo via comparação de sha-256 do manifest.
- "Ver diff" abre um `Dialog` em tela cheia com diff lado a lado (lib `diff` do npm: ~20 KB).
- Para `drift-report.json` o diff mostra contagem de findings adicionadas/removidas no topo, depois o JSON formatado.
- Auto-refresh opcional a cada 30s (toggle).
- Se o publicado retornar 404 (deploy nunca feito) → mostra "Publicado ainda não tem snapshots; rode `npm run audit:prebuild` e publique".

## Mudanças por arquivo

**Adicionar**
- `scripts/copy-snapshots-to-public.mjs` — copia 4 arquivos para `public/snapshots/` + escreve `manifest.json` (`{file, sha256, bytes, generated_at}`).
- `supabase/functions/compare-snapshots/index.ts` — fetch paralelo preview+publicado, whitelist de nomes, devolve JSON.
- `src/components/administrador/audits/PreviewVsPublishedPanel.tsx` — UI do painel.
- `src/components/administrador/audits/SnapshotDiffDialog.tsx` — modal de diff lado a lado.

**Editar**
- `package.json` — `audit:prebuild` chama `copy-snapshots-to-public.mjs` como último passo.
- `src/components/administrador/audits/TechnicalAuditsTab.tsx` — montar `<PreviewVsPublishedPanel />` no topo.
- Traduções PT/EN (`src/locales/{pt,en}/translation.json`) + incremento `I18N_VERSION`.
- `CHANGELOG.md` + `npm run sync:changelog`.

**Dependência nova**
- `diff` (npm) para o renderizador de diff.

## Comportamento esperado

- Estado normal pré-deploy: preview à frente do publicado → painel mostra amarelo nos arquivos editados desde o último deploy. Isso responde "o que vai mudar no deploy".
- Após deploy: usuário recarrega → tudo verde. Confirmação visual de que o publicado absorveu as mudanças.
- Não bloqueia nem auto-corrige nada. Só informa.

## Fora de escopo (deixar explícito)

- Não compara bundle JS/HTML compilado (diff seria ruidoso e enorme).
- Não compara dados do DB (preview e publicado compartilham o mesmo Supabase — diferença é sempre zero por construção; aparece como nota fixa no rodapé do painel).
- Não auto-publica nem auto-roda `audit:prebuild`. Continua manual.
