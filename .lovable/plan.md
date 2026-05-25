
# Plano: Camada de Visualização + Painel de Priorizações

Resposta direta às suas perguntas antes do plano:

- **Esperar dados PetLove?** Sim para os scorings reais de cohort, **não** para a infraestrutura. Construir o esqueleto agora (fontes externas + UI) e plugar o cohort real quando chegar evita 2 semanas paradas.
- **Vets reais usando agora?** Sim, mas 1–2 só (sua veterinária + 1 amigo). Mais que isso sem o "view do veterinário" pronto = ruído. O view vem na Semana 1 justamente para destravar isso.
- **Skills = ganho real?** Sim, principalmente as 3 internas (`curate-study`, `evaluate-meta-study-reliability`, `audit-triplet-citation`). Elas transformam código que já existe em contratos discutíveis com a equipe técnica veterinária (papel c).
- **Dr. Claw é resposta para descobertas longitudinais PetLove?** Sim — o padrão "scoring multi-fonte + Kanban de descobertas + chat investigativo" é exatamente o que falta para transformar 1M de cães em insights publicáveis. Isso passa a ser **frente prioritária**, não exploratória.
- **Onde fica o planejamento?** Nova aba **"Priorizações"** dentro do grupo "Governança & IA" do `/administrador`. Vira a fonte única de verdade do roadmap (substitui o `docs/STANFORD_DEMO.md` na prática, mantém o `.md` como espelho gerado).

---

## Entrega 1 — Camada de Visualização de Papéis (Semana 1, ~1 dia)

Arquivo único novo: `src/config/role-views.ts` declarando 5 perfis de trabalho:

```text
TUTOR              → /tutor
VET_RESPONSAVEL    → /veterinario (lista de pets sob sua tutela)
VET_CURADOR        → /administrador (estudos, triplets, ontologia, simulações)
RND_LEAD           → /administrador (priorizações, population insights, propostas)
PLATFORM_ARCHITECT → tudo (você)
```

Cada perfil declara: `allowedSidebarGroups`, `allowedAdminTabs`, `defaultRoute`, `label PT/EN`.

Mudanças mínimas:
- `AdminSidebarGroups.tsx` filtra grupos/itens pelo perfil ativo.
- `Header.tsx` ganha um seletor "Visualizar como…" (só visível para `admin` real) que persiste em localStorage.
- `VeterinarioPage` ganha modo "simplificado" para `VET_RESPONSAVEL` (oculta tabs científicas pesadas que sua vet já reclamou).

**Não é segurança** — é redução de ruído cognitivo. RLS real fica para quando entrar o primeiro vet externo da PetLove.

---

## Entrega 2 — Aba "Priorizações" (Semana 1, ~1.5 dia)

Nova aba `/administrador?tab=priorizacoes` no grupo "Governança & IA".

Estrutura: Kanban com 5 colunas — **Backlog · Próximo · Em curso · Em teste · Entregue**.

Cada card tem: título, área (`patient | curation | population | governance | skills`), esforço (S/M/L/XL), valor estratégico (`PetLove | Stanford | Interno`), dependências, link para CHANGELOG quando entregue.

Seeded com os cards já combinados, na ordem sugerida abaixo. Dados ficam em `src/data/prioritizationBoard.ts` (manual, à la organograma) — sem tabela Supabase nessa primeira versão, porque a fonte de verdade é o seu critério.

**Ordem inicial sugerida (justificada):**

| # | Card | Por que nessa ordem |
|---|---|---|
| 1 | Camada de visualização de papéis | Destrava uso real pela sua vet e por convidados sem reescrever auth |
| 2 | Painel de Priorizações (esta aba) | Fonte única para discutir tudo abaixo com PetLove |
| 3 | Population Insights — esqueleto (sem cohort) | Pronto para plugar dados PetLove no dia 1 que chegarem |
| 4 | Gerador de Sugestões de Cohort | Documento que você manda à PetLove pedindo o recorte ideal |
| 5 | Pilot com 1–2 vets reais (sua vet + 1) | Valida o "view do veterinário" antes de escalar |
| 6 | 3 SKILL.md internas (`curate-study`, `evaluate-meta-study-reliability`, `audit-triplet-citation`) | Contrato com o papel (c) — preparação para vet-curador externo |
| 7 | Population Insights — integração com cohort PetLove real | Quando os dados chegarem |
| 8 | `investigate-clinical-question` skill (chat investigativo Dr. Claw-style) | Multiplica utilidade do Conversational Auditor |
| 9 | RLS real + papéis no banco | Quando entrar o primeiro vet PetLove externo |
| 10 | Fase B meta-KG | Depois que houver descobertas reais no cohort |

---

## Entrega 3 — Gerador de Sugestões de Cohort (Semana 1–2, ~1 dia)

Subpágina dentro de "Priorizações" (ou aba irmã, decidimos na implementação). Formulário guiado que produz **um documento estruturado** para você enviar à PetLove:

- Recorte por raça(s), idade, peso, condições conhecidas, medicação atual
- N alvo por estrato
- Dados mínimos por animal (anamnese, exames, histórico de consultas, alimentação)
- Formato de entrega (CSV, JSON, FHIR)
- Termo de uso de dados / anonimização
- Output: PDF + Markdown copiável

Permite gerar 3–5 cohorts paralelos (ex: "Golden 8+ com elevação de ALT", "Yorkshire <5kg com cardiopatia precoce", etc.) — cada um virando um card no Kanban de Population Insights depois.

---

## Entrega 4 — Population Insights v0 (Semana 2, ~3 dias do esqueleto)

Só o esqueleto agora; scoring real espera cohort PetLove.

- **Fonte externa funcional**: reaproveita 100% `kg-evidence-gap-fill` para puxar arXiv/PubMed novos relevantes ao Senex.
- **Fonte interna (mock honesto)**: usa `syntheticCohort.ts` mas com label explícito "Cohort sintético — aguardando dados PetLove".
- **Scoring**: `prevalence_delta + kg_gap + actionability` com pesos editáveis na própria UI.
- **UI**: Kanban "Descobertas → Hipóteses → Meta-estudos propostos → Aprovados", reaproveitando `MetaStudyKanban` + `MetaStudyDetailedCard`.
- **Botão "Investigar com IA"**: abre `relations-auditor` com contexto pré-carregado.

Quando o cohort PetLove chegar: trocar a fonte interna por queries reais nas tabelas que vamos modelar (parte do card #7).

---

## Detalhes técnicos

**Arquivos novos:**
- `src/config/role-views.ts`
- `src/components/layout/RoleViewSwitcher.tsx`
- `src/pages/administrador/PriorizacoesTab.tsx`
- `src/components/administrador/priorizacoes/PrioritizationBoard.tsx`
- `src/components/administrador/priorizacoes/PrioritizationCard.tsx`
- `src/data/prioritizationBoard.ts` (seed manual)
- `src/components/administrador/priorizacoes/CohortRequestGenerator.tsx`

**Arquivos editados:**
- `src/components/administrador/sidebar/groups/GovernanceAIGroup.tsx` (adiciona item "Priorizações")
- `src/config/admin-tabs.ts` (registra `priorizacoes`)
- `src/components/administrador/sidebar/AdminSidebarGroups.tsx` (filtro por perfil)
- `src/components/layout/Header.tsx` (RoleViewSwitcher só para admin real)
- `src/i18n.ts` (incrementar `I18N_VERSION`)
- `src/locales/{pt,en}/translation.json` (chaves novas)
- `CHANGELOG.md` + `npm run sync:changelog` no fim
- `src/data/projectOrganograma.ts` (registra nova aba + grupo "Governança & IA" atualizado)

**Sem migrations** nesta fase — dados de prioridades e cohorts ficam em arquivos `.ts` versionados.

**Bilíngue obrigatório**: todos os cards de prioridades têm `title_pt/title_en`, `description_pt/description_en`, conforme Core Rules.

---

## Fora deste plano (mas vão para o Kanban como cards futuros)

- Refactor RLS real (card #9)
- Fase B meta-KG / agentes debatendo hipóteses
- Skills "academic research" do Dr. Claw (descartadas)
- Multi-backend (já temos AI Gateway)

---

## Próximo passo

Se aprovar, implemento **Entrega 1 + 2 + 3** em sequência (provavelmente 1 mensagem grande para 1+2 e outra para 3). A Entrega 4 fica para uma mensagem separada depois que validarmos o Kanban funcionando.

