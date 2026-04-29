---
name: Organograma como source of truth
description: Protocolo obrigatório para manter o organograma do projeto e o changelog visual sincronizados a cada mudança estrutural relevante.
type: preference
---

A aba admin "Organograma do Projeto" (/administrador?tab=organograma) consome
três arquivos tipados que SÃO a fonte de verdade da arquitetura para o agente:

- `src/data/projectOrganograma.ts` — áreas, componentes, cross-links
- `src/data/projectChangelog.ts` — histórico visual filtrável por área/status
- `src/data/organogramaAreaMeta.ts` — ícones e cores por área

**Protocolo obrigatório** sempre que houver mudança estrutural (nova tab admin,
novo componente principal, refactor de área, nova edge function relevante,
remoção de feature):

1. Atualizar o nó da área afetada em `projectOrganograma.ts` (children/files/linksTo)
2. Adicionar entrada NO TOPO de `projectChangelog.ts` (area, kind, title, bullets, files, status)
3. Atualizar `organogramaLastUpdated` em `projectOrganograma.ts`
4. Adicionar mesma entrada em `CHANGELOG.md` (seção [Unreleased])
5. Se mudou strings de UI: incrementar `I18N_VERSION` em `src/i18n.ts` e
   espelhar chaves em `src/locales/pt/translation.json` + `en/translation.json`

**Why:** centraliza a visão estrutural do projeto que o agente usa para
orientar mudanças, reduzindo erros de contexto. Inspirado na abordagem do
projeto Sleep Graph RAG (/admin/organograma).

**How to apply:** ao terminar qualquer feature que cria/move arquivo principal,
rodar mentalmente esses 5 passos antes de fechar a resposta.
