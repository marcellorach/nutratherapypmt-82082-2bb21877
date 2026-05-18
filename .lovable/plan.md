## a) Traduzir strings hardcoded PT em Compliance + Technical Audits

**`src/components/administrador/compliance/ComplianceDashboard.tsx`** — hoje 100% PT:
- Labels de UI: `Órgão`, `Requisito`, `Evidência no sistema`, `Arquivo / Função`, `Status`, `Prio.`, `Ação recomendada`, `Filtros`, `Atende`, `Parcial`, `Gap`, `Todas as prioridades`, `Buscar por requisito...`, `Dashboard de Conformidade Regulatória`, `Exportar CSV`, `Mostrando X de Y`, `Nenhum requisito corresponde...`, `P0 — crítica` … → mover para `t('compliance.*')` em `pt/` e `en/translation.json`.
- Dados (`DATA[]`): cada `requirement`, `evidence`, `action` está em PT mas misturado com termos EN. Trocar a estrutura para `{ requirement, requirement_en, evidence, evidence_en, action, action_en }` e renderizar via `useLocalizedField`.

**`src/components/administrador/audits/TechnicalAuditsTab.tsx`** — varrer `DEFAULT_NEW_SCOPE`, toasts e labels (`Cobertura desejada da próxima auditoria`, “Forças/Gaps/Riscos”, botões) e mover para `t('audits.*')` bilíngue.

Incrementar `I18N_VERSION` em `src/i18n.ts` (→ `1.86.3`).

## b) Renovação manual de compliance + log de evolução

Hoje o dashboard é **estático** (array `DATA` hardcoded). Não há renovação — nem manual, nem automática. Proposta:

**Novo botão** “Rodar verificação de compliance” no header do `ComplianceDashboard`, ao lado de “Exportar CSV”. Ao clicar:
1. Snapshot do estado atual (contagem por status e por autoridade, lista de gaps/parciais).
2. Compara com o último snapshot e classifica cada item: **melhorou** (gap→partial→meets), **piorou** (regressão), **inalterado**, **novo**.
3. Persiste um registro em nova tabela.

**Migration (Lovable Cloud):**
```sql
create table public.compliance_audit_runs (
  id uuid primary key default gen_random_uuid(),
  run_at timestamptz not null default now(),
  run_by uuid references auth.users(id),
  system_version text not null,                 -- SENEX_VERSION
  i18n_version text,
  totals jsonb not null,                        -- { meets, partial, gap, total }
  per_authority jsonb not null,                 -- { FDA:{...}, EMA:{...}, AVMA:{...} }
  diff jsonb not null,                          -- [{ id, authority, requirement, prev, next, delta:'improved'|'regressed'|'unchanged'|'new' }]
  notes text
);
alter table public.compliance_audit_runs enable row level security;
create policy "Admins read"  on public.compliance_audit_runs for select using (public.has_role(auth.uid(),'admin'));
create policy "Admins write" on public.compliance_audit_runs for insert with check (public.has_role(auth.uid(),'admin'));
```

**Nova seção “Histórico de verificações”** no `ComplianceDashboard` (collapsible abaixo dos filtros):
- Timeline com cada rodada: data, versão do Senex AI, totais, e chips coloridos `+N melhorias` / `−N regressões`.
- Expansível por rodada: lista item-a-item com transição `partial → meets` etc.
- Campo `notes` (textarea opcional ao rodar) para o admin registrar o motivo.

Comportamento permanece **100 % manual** (sem cron) — conforme política de governança humana já vigente.

## c) Confirmação do Organograma

**O organograma NÃO se atualiza sozinho de forma automática em produção.** Ele depende de:

1. Cada mudança estrutural relevante → entrada no `CHANGELOG.md` com metadata (`<!-- area: … · status: … · i18n: … -->`).
2. Rodar `npm run sync:changelog` (script `scripts/sync-changelog.mjs`) → regenera `src/data/projectChangelog.generated.ts`, atualiza `organogramaLastUpdated` em `src/data/projectOrganograma.ts` e o briefing `.lovable/CONTEXT.md`.

No fluxo Lovable atual, **eu (agente) rodo `sync:changelog` automaticamente** após cada turno que toca estrutura, conforme `mem://workflow/changelog-driven-context` e `mem://architecture/organograma-source-of-truth`. Os arquivos `CHANGELOG.md` e `projectChangelog.generated.ts` confirmam (timestamps idênticos: 18 May 03:04).

Recomendação leve para reforçar a garantia: adicionar um **git pre-commit hook** (`.husky/pre-commit`) executando `npm run sync:changelog` — fora do escopo desta entrega, mas posso incluir se quiser.

## Arquivos afetados

- `src/components/administrador/compliance/ComplianceDashboard.tsx` (refactor + botão renovar + histórico)
- `src/components/administrador/audits/TechnicalAuditsTab.tsx` (i18n cleanup)
- `src/locales/pt/translation.json` + `src/locales/en/translation.json` (chaves `compliance.*`, `audits.*`)
- `src/i18n.ts` (`I18N_VERSION` → 1.86.3)
- nova migração SQL para `compliance_audit_runs`
- `CHANGELOG.md` + `npm run sync:changelog`
