---
name: Organograma como source of truth
description: Protocolo obrigatório para manter o organograma do projeto e o changelog visual sincronizados a cada mudança estrutural relevante.
type: preference
---

A aba admin "Organograma do Projeto" (/administrador?tab=organograma) consome dois arquivos tipados:

- `src/data/projectOrganograma.ts` — **estrutura** (áreas, componentes, cross-links). Editado à mão.
- `src/data/projectChangelog.generated.ts` — **histórico**. AUTOGERADO a partir de `CHANGELOG.md` por `npm run sync:changelog`. NUNCA editar à mão.

**Protocolo simplificado** (2 passos):

1. **Estrutura mudou?** (nova área, novo componente principal, refactor) → atualizar `projectOrganograma.ts`.
2. **Sempre** → adicionar entrada estruturada em `CHANGELOG.md` e rodar `npm run sync:changelog`. Isso renova histórico, `organogramaLastUpdated` e o briefing `.lovable/CONTEXT.md`.

Se houver mudança de strings de UI: incrementar `I18N_VERSION` em `src/i18n.ts` e espelhar chaves PT/EN.

**Metadata estendido do CHANGELOG**: o comentário `<!--  -->` aceita `area`, `status`, `i18n` e `commit`. Ex: `<!-- area: admin · status: entregue · i18n: 1.40.0 · commit: a1b2c3d -->`. O `commit` faz a entrada renderizar um chip clicável no mini-timeline quando `REPO_CONFIG.baseUrl` está preenchido em `src/data/repoConfig.ts` (vazio por default — chips ficam estáticos).

Ver também: `mem://workflow/changelog-driven-context` para o protocolo de leitura antes de iniciar tarefas.
