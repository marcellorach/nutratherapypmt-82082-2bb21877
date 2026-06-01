## Diagnóstico do desencontro

Hoje cada superfície lê a "versão" de um lugar diferente, e nada valida que elas batem:

| Tela | Mostra | Fonte real |
|---|---|---|
| Header/Footer | `v7.0.0 · 2026-06-01` | `SENEX_VERSION` ← `senexVersion` (gerado do marker `<!-- senex: 7.0.0 -->` em CHANGELOG.md) |
| Aba **Auditorias técnicas** | "Auditoria técnica **V7.0.1** · sistema i18n **1.115.8**" | `nextVersion` no `TechnicalAuditsTab.tsx` faz **auto-bump de PATCH** quando já existe auditoria com a versão Senex atual (7.0.0 → 7.0.1). O número da auditoria **não corresponde a nenhuma versão real do sistema**. O i18n vem certo (de `I18N_VERSION`) mas ficou defasado 1 minor (1.115.8 vs 1.115.9 atual). |
| **Organograma** | "Updated on 2026-06-01 · 209 changelog entries" | `organogramaLastUpdated` (gerado por `sync:changelog`). Não exibe a versão Senex em lugar nenhum — parece desconectado. |
| **Regulatory Compliance Dashboard** | botão "Run compliance check" | `ComplianceDashboard.tsx:174` grava `i18n_version: '1.86.3'` **hardcoded** (real: 1.115.9). O `system_version` vem de `SENEX_VERSION` (ok), mas o "check" só faz snapshot do array estático `COMPLIANCE_ITEMS` — não inspeciona código nem corre nada dinâmico. A UI também não diz qual versão está sendo auditada antes de clicar. |

Resultado: três números de versão diferentes na mesma sessão e um check que parece "rodar" mas só persiste a checklist curada.

## Política de versionamento proposta (fonte única + bump explícito)

**Regra de ouro: SENEX_VERSION é a única versão do sistema.** Auditorias e compliance runs herdam essa versão — não inventam a própria.

1. **Remover auto-bump de PATCH no `TechnicalAuditsTab`**.
   - Se já existe auditoria com `v{SENEX_VERSION}`, o botão "Run new audit" fica desabilitado com tooltip explicativo: *"v7.0.0 já foi auditada. Para rodar nova auditoria, bumpe o marker `<!-- senex: 7.0.x -->` em `CHANGELOG.md` e rode `npm run sync:changelog`."*
   - Exibe link/botão "Como bumpar versão?" abrindo um dialog com o passo-a-passo.
   - Alternativa opcional: botão "Re-rodar (substitui anterior)" que marca a antiga como `superseded_by` (campo já existe na tabela) sem criar versão fantasma.

2. **Validação server-side em `generate-audit`**: rejeita request cujo `version` não é exatamente `v{senexVersion}` lido do CHANGELOG no servidor. Mensagem clara: "Audit version must match SENEX_VERSION. Bump the changelog marker first."

3. **`ComplianceDashboard` — corrigir e amarrar à fonte única**:
   - Importar `I18N_VERSION` de `@/i18n` e `SENEX_VERSION`, `SENEX_LAST_UPDATE` de `@/config/senex-version`. Remover o `'1.86.3'` hardcoded.
   - Antes do botão "Run compliance check", mostrar um banner: *"Will snapshot: Senex AI v7.0.0 · i18n 1.115.9 · changelog 2026-05-31 · 17 requirements."* — usuário sabe o que está rodando antes de clicar.
   - Após o run, toast com a mesma string + link "View history" para o accordion já existente.
   - Indicar explicitamente que o "check" é um snapshot da checklist curada (`complianceData.ts`, last reviewed YYYY-MM-DD) — não scan dinâmico de código. Ou renomear o botão para "Snapshot compliance status" para ser honesto.

4. **Novo componente compartilhado `<VersionBadge />`** (em `src/components/system/`):
   - Renderiza inline: `Senex AI v{SENEX_VERSION} · i18n {I18N_VERSION} · changelog {SENEX_LAST_UPDATE}`.
   - Usado no cabeçalho de: `TechnicalAuditsTab`, `ComplianceDashboard`, `OrganogramaTab`, `AboutSenexTab`.
   - Divergência fica visualmente impossível — todos leem da mesma fonte no mesmo render.

5. **Organograma**: exibir o `<VersionBadge />` ao lado de "Updated on …" para amarrar o `organogramaLastUpdated` à versão Senex correspondente.

6. **Documentar a política** em uma nova memória `mem://workflow/versioning-policy` + nota curta em `docs/CORE_RULES.md`:
   - "Para rodar uma nova auditoria/compliance check: (1) bumpe `<!-- senex: x.y.z -->` em CHANGELOG.md, (2) rode `npm run sync:changelog`, (3) confirme que header/footer mostram a nova versão, (4) só então clique 'Run new audit' / 'Run compliance check'."

## Arquivos afetados

- `src/components/administrador/audits/TechnicalAuditsTab.tsx` (remover auto-bump, adicionar guard + dialog explicativo)
- `src/components/administrador/compliance/ComplianceDashboard.tsx` (importar I18N_VERSION, remover hardcode, banner pré-run, renomear botão)
- `src/components/system/VersionBadge.tsx` (novo)
- `src/pages/administrador/OrganogramaTab.tsx` (adicionar badge)
- `src/components/administrador/AboutSenexTab.tsx` (adicionar badge)
- `supabase/functions/generate-audit/index.ts` (validação `version === v{senexVersion}`)
- `.lovable/memory/workflow/versioning-policy.md` + index update
- `CHANGELOG.md` + `npm run sync:changelog`
- `src/i18n.ts` → bump `I18N_VERSION`
- `src/locales/{pt,en}/translation.json` → chaves do banner/dialog

## Não incluído (confirmar se quer)

- Tornar o "compliance check" um scan dinâmico real (analisar código/RLS/edge functions automaticamente) — é trabalho substancial; hoje proponho apenas tornar o snapshot honesto e bem-versionado. Posso fazer numa segunda rodada se quiser.

Confirma que avanço com isso? Se sim, na implementação eu já faço o bump para `<!-- senex: 7.0.1 -->` (refletindo essa própria mudança) para você ver a nova política funcionando end-to-end.