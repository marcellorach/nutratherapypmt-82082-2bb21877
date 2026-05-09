## Objetivo

Gerar `VetGraphRAG_Auto_Auditoria_Tecnica_v2.docx` expandindo a v1 com três adições principais, mantendo todo o conteúdo original e melhorando a profundidade técnica/regulatória.

---

## Entregáveis

### a) Mapeamento Regulatório Ponto a Ponto (nova seção expandida)

Criar **3 tabelas matriciais** (uma por órgão regulador) cruzando requisitos × evidências do nosso sistema, com status (✅ Atende / 🟡 Parcial / 🔴 Gap) e arquivo/função/migration de referência:

**FDA — Draft Guidance on AI/ML-Enabled Device Software Functions (Jan/2025)**
- Predetermined Change Control Plan (PCCP) → mapear contra `CHANGELOG.md` + `I18N_VERSION` + sistema de migrations
- Good Machine Learning Practice (GMLP) 10 princípios → mapear contra cada edge function relevante
- Transparency for users → mapear contra `ClinicalPipelineLogPanel`, `DigitalTwinLogPanel`, `EvidenceGapLogPanel`, badges de origem
- Real-World Performance Monitoring → identificar gap (não temos cohort tracking ainda)
- Bias mitigation → mapear contra política bilingue + dictionaries
- Data quality → mapear contra "no-mock policy", curation gatekeeper, two-tier governance

**EMA — Reflection Paper on AI in Medicinal Product Lifecycle (Sept/2024) + EU AI Act (Aug/2026 enforcement)**
- High-risk AI system classification → posicionar nosso produto
- Human oversight (Art. 14) → mapear contra Vet Recommendation Panel (aceitar/modificar/rejeitar)
- Technical documentation (Annex IV) → mapear contra docs existentes
- Logging and traceability → mapear contra audit log, study provenance, KG provenance
- Accuracy/robustness/cybersecurity → mapear contra RLS, secrets, validation triggers
- Data governance (Art. 10) → mapear contra base knowledge governance

**AVMA — Framework for AI in Veterinary Medicine (Nov/2025)**
- Veterinarian-in-the-loop → mapear contra curation pipeline
- Species-specific validation → identificar gap (foco canino apenas, sem validação cruzada)
- Off-label disclosure → mapear contra DrugLookupBadge novo
- Continuing education → identificar gap

Cada linha da tabela: **Requisito | Evidência no sistema | Arquivo/Função | Status | Ação recomendada**

### b) Bibliografia com Citações Verificáveis

Nova seção "Referências e Fontes" no final do documento:
- Pesquisar via `websearch--web_search` os documentos oficiais FDA/EMA/AVMA citados
- Buscar papers chave: MedGraphRAG (Wu et al. 2024 Oxford), Microsoft GraphRAG (Edge et al. 2024), Med-PaLM 2 (Singhal et al. 2023), VetGraphRAG/RAG em veterinária 2025-2026
- Para cada referência: **autores, título, venue/órgão, ano, URL, trecho/página citada**, e onde no documento a citação aparece (sistema de notas de rodapé ou numeração [1], [2]…)
- Adicionar marcadores de citação inline em todas as seções v1 que fazem afirmações sobre SOTA/regulatório

### c) Infográficos (SVG embeds)

Gerar via script Python (matplotlib/svgwrite) e embed como PNG no DOCX. Mínimo 5 infográficos:

1. **Pipeline de Digestão de Estudos (7 estágios)** — fluxograma horizontal: Upload → Dedup SHA-256 → Parse → Vectorize → Stage1/2/3 Extraction → Curadoria → KG sync
2. **Arquitetura 5 Camadas VetGraphRAG** — pirâmide invertida L0→L4 (Compound→Target→Mechanism→Effect→Outcome) com tabelas/contagens reais do DB
3. **Jornada do Revisor Veterinário** — swimlane: Login → Triplet Bank → Review (excerpt+chat+enrichment) → Approve/Reject → KG update
4. **Jornada do Estudo** — timeline: PDF → Hash check → Chunks → Embeddings → Triplets pendentes → Auto-approve (≥50%) ou Manual → Base Knowledge link → Recommendation engine
5. **Comparação MedGraphRAG vs VetGraphRAG** — tabela visual lado-a-lado (camadas, espécies, governança, U-Retrieval, etc.)
6. **Mapa de Conformidade Regulatória** — heatmap visual: linhas = órgãos (FDA/EMA/AVMA), colunas = pilares (transparência, oversight, data quality, traceability, monitoring), células coloridas por status

---

## Plano de Execução Técnica

```text
1. Pesquisa web (paralela): FDA Jan/2025 guidance, EMA reflection paper Sept/2024,
   EU AI Act timeline, AVMA Nov/2025 framework, MedGraphRAG arxiv, GraphRAG MS,
   Med-PaLM 2, RAG-vet papers 2025-2026
2. Inspecionar v1 .docx para preservar estrutura/estilo
3. Gerar infográficos PNG via /tmp/gen_infographics.py (matplotlib, paleta projeto)
4. QA visual: converter cada PNG e inspecionar com read tool
5. Construir v2 via docx-js (Node) reaproveitando conteúdo v1 + novas seções +
   embeds de imagens + tabelas regulatórias + footnotes/bibliografia
6. Validar .docx (validate_document.py) e converter para PDF para QA visual
   página a página antes de entregar
7. Salvar em /mnt/documents/VetGraphRAG_Auto_Auditoria_Tecnica_v2.docx
8. Atualizar CHANGELOG.md com a entrega
```

## Perguntas (opcional, posso assumir defaults)

- **Idioma do documento v2**: manter PT-BR como v1? (default: sim)
- **Citações**: numeração [1][2] estilo Vancouver ou footnotes Word nativas? (default: footnotes nativas, mais navegáveis)
- **Status "Gap"**: incluir esforço estimado (S/M/L) e prioridade (P0-P3)? (default: sim)
