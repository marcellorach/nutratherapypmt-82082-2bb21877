## Diagnóstico

Você está correto: **TxGNN (Huang 2024, 4.8/5)** e **Hetionet (Himmelstein 2017, 4.4/5)** contribuíram com regras ativas em runtime, mas estão fora do bloco "Scientific pillars" do AboutSenex. Confirmação via DB:

| Paper | RCs ligados (core_rule_evidence) | Status runtime |
|---|---|---|
| TxGNN | **RC-001** (Exclusão ≠ Contraindicação), **RC-008** (Taxonomia SNOMED-CT+UMLS), **RC-013** (Governança Tiered por Confiança) | active (008, 013) + doc_only (001) |
| Hetionet | **RC-008** (Taxonomia), **RC-014** (Normalização de Predicados) | active |

Ambos merecem entrar como **PARTIAL** — tal como KGARevion — porque inspiraram regras hoje rodando, mas a contribuição original completa (zero-shot drug repurposing com GraphMask para TxGNN; DWPC + metapaths permutados para Hetionet) não está implementada.

## Sobre o "prompt LLM que monta as citações"

**Não existe.** A lista de Pilares Científicos no AboutSenexTab é **curada manualmente** num array TypeScript hardcoded (`PILLARS` em `src/components/administrador/AboutSenexTab.tsx`, linhas ~85–125). Nenhuma edge function ou LLM monta esse bloco. A única fonte de verdade dinâmica papel↔RC vem de `core_rule_evidence` (DB), consumida pela aba **Fundamentos Arquiteturais** — e foi justamente essa fonte que revelou a lacuna.

Portanto não há prompt para corrigir. O que precisa de correção é o array curado.

## Plano de implementação

### 1. Adicionar 2 novos pilares ao array `PILLARS`

Inserir antes de "Canine geroscience":

- **TxGNN (Huang et al., Nature Medicine 2024)** — status `partial`
  - PT: "**Parcial.** Em runtime, a adoção de taxonomia padrão SNOMED-CT VetSCT + UMLS (RC-008) e a governança tiered por confiança (RC-013, auto-approve ≥ 0,50 + HITL) seguem TxGNN como evidência ativa. RC-001 (Exclusão ≠ Contraindicação) é doc-only. **Inspiração ainda não implementada:** zero-shot drug repurposing via metric learning degree-gated e explainer GraphMask multi-hop — o motor atual recomenda apenas sobre compostos com triplets curados, sem inferência zero-shot. O número de +46% accuracy / +49% confidence é benchmark do paper."
  - EN: equivalente

- **Hetionet / DWPC (Himmelstein et al., eLife 2017)** — status `partial`
  - PT: "**Parcial.** Em runtime, a adoção de taxonomia padrão SNOMED-CT VetSCT + UMLS (RC-008) e a normalização de predicados via dicionário (RC-014) seguem Hetionet como evidência ativa. **Inspiração ainda não implementada:** Degree-Weighted Path Count (DWPC) sobre metapaths heterogêneos com baselines de permutação — hoje o ranking de compostos usa scoring heurístico + KG hierárquico L0→L4, sem DWPC nem teste de permutação."
  - EN: equivalente

### 2. Atualizar o diagrama Mermaid `ENGINE_DIAGRAM`

No bloco `VAL` (Validation), o `V4` planejado hoje cita só "TransE link prediction". Adicionar referência paralela a TxGNN/Hetionet como inspirações ainda fora de runtime no bloco `OUT` (recomendação):
- Em `O3` ("Recommendation engine"), anotar `(inspired by TxGNN zero-shot + Hetionet DWPC, not yet in runtime)`.

### 3. Atualizar o banner de "Honestidade arquitetural"

Acrescentar TxGNN zero-shot e Hetionet DWPC à lista de inspirações não-runtime (junto com GRRA, U-Retrieval bidirecional e TransE).

### 4. Governança documental

- `CHANGELOG.md`: nova entrada em `[Unreleased]` → `Changed`: "AboutSenex: TxGNN e Hetionet adicionados aos Pilares Científicos (PARTIAL), refletindo RC-001/008/013 e RC-008/014 já ativos via `core_rule_evidence`."
- Bump marker: `7.2.2` → `7.2.3` (PATCH — correção de catálogo, sem novo recurso).
- `npm run sync:changelog`.
- Não há novas chaves i18n (os textos PT/EN dos pilares ficam no próprio array, como os demais).

### Fora de escopo

- Não criar novos RCs.
- Não alterar `core_rule_evidence` (já está correto).
- Não tocar em prompts de edge functions (irrelevante para este caso).
- Não mexer em `generate-audit` (que tem outra responsabilidade — gerar relatório de auditoria, não os pilares do AboutSenex).

## Arquivos a editar

1. `src/components/administrador/AboutSenexTab.tsx` — `PILLARS` array, `ENGINE_DIAGRAM`, banner de honestidade.
2. `CHANGELOG.md` — entrada em `[Unreleased]`, bump marker.
3. (auto via `sync:changelog`) `src/data/projectChangelog.generated.ts`, `.lovable/CONTEXT.md`.
