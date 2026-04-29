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

Ver também: `mem://workflow/changelog-driven-context` para o protocolo de leitura antes de iniciar tarefas.
