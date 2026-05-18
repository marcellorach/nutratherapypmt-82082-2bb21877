# Project context briefing (auto)
Generated: 2026-05-18T00:07:27.040Z

Read this file BEFORE starting any non-trivial task. It is the project's working memory.

## Latest i18n version: 1.80.0

## Changes by area (last 14 days)
- **vet-ui**: 13
- **admin**: 12
- **tutor-ui**: 8
- **clinical-pipeline**: 3
- **meta**: 2
- **i18n**: 1
- **curation**: 1

## Top 10 recent entries
### 2026-05-18 · [admin] CHANGED — Aba "Catálogo de Rações" vira "Nutrition" com tags inline + auto-enrich + tabela AAFCO
- Nutrientes como tags inline: o card de produto agora renderiza TODOS os campos nutricionais não-nulos (Prot, Gord, Fibra, Ca, P, Ca:P, n6:n3, EPA, DHA, Lis, Tau, Vit A/D3/E, Zn, Fe, Cu, etc.) como `<Badge>` compactos no padrão visual já usado para `species`/`life_stage`. Sem clique, sem dialog secundário.
- Auto-enriquecimento: `useEffect` na query identifica produtos sem nutrição ou com `completeness_score < 0.4` e invoca `enrich-pet-food-product` em background (batches de 3, guard `useRef<Set>` contra loops). Novo produto cadastrado dispara enrichment imediatamente. Botão manual "Enriquecer com IA" e dialog "Composição" foram removidos.
- Renomeação: aba do menu lateral passa a se chamar Nutrição/Nutrition (chave `admin.sidebar.knowledgeBase.petFoodCatalog`, id da rota `pet-food-catalog` preservado).
_files: src/data/nutritionRequirementsCanine.ts, src/components/administrador/pet-food/PetFoodCatalogTab.tsx, src/i18n.ts_

### 2026-05-17 · [admin] ADDED — Carga nutricional completa (AAFCO/FEDIAF) no catálogo de rações
- `pet_food_nutrition` estendida: novas colunas para minerais traço (Fe, Cu, Zn, Mn, Se, I, Cl), vitaminas (A, D3, E, K, B1–B12, biotina, colina), EPA/DHA/ARA separados, aminoácidos essenciais (lisina, metionina, triptofano, treonina, arginina) e tracking (`completeness_score`, `confidence`, `data_filled_at`).
- `enrich-pet-food-product`: prompt expandido para schema AAFCO/FEDIAF completo com instrução explícita "nunca invente — prefira null". Parser normaliza `%`, `mg/kg` e `UI/kg` com clamps de plausibilidade. Calcula `completeness_score` (fração de campos numéricos preenchidos) automaticamente em cada insert.
- UI do catálogo (`PetFoodCatalogTab`): card de produto agora mostra barra de completude + % e confiança da IA; novo botão Composição abre dialog com a composição completa agrupada por (Macros / Minerais maiores / Minerais traço / Vitaminas / Ácidos graxos / Aminoácidos / Articulares), badges AAFCO/FEDIAF e statement quando presente.
_files: supabase/functions/enrich-pet-food-product/index.ts, src/components/administrador/pet-food/PetFoodCatalogTab.tsx_

### 2026-05-17 · [admin] ADDED — Fix diagrama + catálogo de System Prompts + traduções
- Diagrama do organograma (fotos 1 e 2): fix definitivo. Após renderizar, o SVG do Mermaid agora recebe `width`/`height` reais lidos do `viewBox` (antes vinha só `style="max-width:100%"`, colapsando dentro do container `max-content`). `useScrollPanZoom.measureNatural` agora prioriza `viewBox.baseVal` sobre `getBBox` (mais estável antes do layout). `ResizeObserver` também observa o `innerRef` para refazer `fit()` quando o SVG aparece. `fitMin` 0.1 → 0.2 (evita escala microscópica).
- Catálogo de System Prompts: nova tabela `ai_system_prompts` com 24 prompts agrupados em 13 famílias (Clinical Extraction, Study Ingestion, RAG/Embeddings, Recommendation Orchestration, KG Enrichment, KG Governance, KG Gap-Fill, Clinical Reasoning, Translation, External Lookup, Taxonomy, Conversational). Nova aba System Prompts dentro de "Prompts da IA" lista catálogo com busca, agrupamento por família, badge "override ativo", editor inline e botão "Restaurar default". RLS admin-only. Conteúdo `default_content` ainda vazio em todos (preenchimento via leitura das edge functions vem em rodadas seguintes).
- Traduções (foto 4): "Organograma", "Conformidade FDA/EMA/AVMA" e "Auditorias Técnicas" estavam hardcoded no `ConfigurationGroup.tsx` — agora usam `t('admin.sidebar.configuration.{organograma,complianceDashboard,technicalAudits}')`. Chaves espelhadas PT/EN. `I18N_VERSION` 1.78.9 → 1.79.0.
_files: src/components/administrador/organograma/OrganogramaDiagram.tsx, src/hooks/useScrollPanZoom.ts, src/components/administrador/sidebar/groups/ConfigurationGroup.tsx, src/components/administrador/ConfiguracoesIATab.tsx…_

### 2026-05-17 · [admin] CHANGED — Sidebar: reposicionar Triplet Quality + catálogo Mars
- Sidebar "Base de Conhecimento": item Triplet Quality movido para entre Triplet Curation e Evidence Conflicts (antes ficava isolado no fim do grupo). Apenas reordenação visual; rota, ícone e tradução inalterados.
- Catálogo de Rações: adicionadas 8 marcas do conglomerado Mars Petcare que faltavam — IAMS, Nutro, Cesar, Sheba, Greenies, Crave, Perfect Fit e Temptations. Royal Canin, Pedigree, Eukanuba e Whiskas já estavam cadastradas. Garante prioridade absoluta da Mars na lista de marcas.
- Files: src/components/administrador/sidebar/groups/KnowledgeBaseGroup.tsx, public.pet_food_brands (8 inserts).
_files: src/components/administrador/sidebar/groups/KnowledgeBaseGroup.tsx_

### 2026-05-17 · [admin] CHANGED — Organograma: corrigir diagrama em branco e simplificar acesso ao Gap-Fill
- Diagrama Mermaid do organograma voltou a renderizar: removida a manipulação de `width`/`height` do `<svg>` que colapsava o conteúdo, e `fitMin` reduzido de 0.4 para 0.1 para evitar telas em branco quando o diagrama é maior que o container.
- Tab "Diagnóstico Gap-Fill" removida do menu lateral (Knowledge Base) — virou diagnóstico avançado acessível por botão "Ver diagnóstico avançado" dentro da tela de Mapeamento SNOMED/UMLS. A rota `?tab=gapfill-diagnostics` continua válida; só a entrada de menu foi escondida para reduzir ruído na sidebar.
- Página "Relações e Conexões" e o force-graph do organograma intencionalmente não foram tocados — auditoria do histórico (commits `385859f4`, `33454cc9`, `bb7d8e39`) confirmou que não houve regressão recente; o volume aparente (28 nós · 1000 edges) é dado real e não complexidade adicionada.
_files: src/components/administrador/organograma/OrganogramaDiagram.tsx, src/components/administrador/sidebar/groups/KnowledgeBaseGroup.tsx, src/components/administrador/OntologyMappingTab.tsx, src/i18n.ts_

### 2026-05-17 · [admin] CHANGED — Sidebar admin: restauração de órfãos e limpeza de tabs sem propósito
- Knowledge Base recebeu 7 links restaurados/realocados: Curadoria de Triplets, Conflitos de Evidência, Mapeamento SNOMED/UMLS, Catálogo de Rações, Curadoria de Doses, Qualidade de Triplets e Diagnóstico Gap-Fill.
- Configuration recebeu 3 links novos: Gerenciar Traduções, Convenções de Design e Solicitações de Acesso.
- Removidas 4 tabs sem propósito de `admin-tabs.ts`: `acompanhamento` (marketing fora do escopo clínico), `fontes` e `analysis` (steps legados do wizard antigo de ingestão) e import órfão de `MicrobiomeAnalysisTab`.
_files: src/config/admin-tabs.ts, src/components/lazy/LazyComponents.tsx, src/i18n.ts_

### 2026-05-17 · [tutor-ui] CHANGED — Home: destaque Painel de Controle + footer/header rebranding
- Home autenticada: Painel de Controle agora usa botão primário com seta vermelha "visite aqui!" (bilingual); cards Vet Portal e Owner Portal mostram badge "Em breve / Coming soon" e botão desabilitado "Em desenvolvimento / In development".
- Footer: copyright atualizado para "Senex AI © 2025–2026 — developed by PetMoreTime. All rights reserved by PetMoreTime." em Footer.tsx e AdminFooter.tsx.
- Tagline "Veterinary Geroscience" adicionada sob a referência PetMoreTime no header e em ambos os footers.
_files: src/pages/Index.tsx, src/components/layout/Header.tsx, src/components/layout/Footer.tsx, src/components/administrador/layout/AdminFooter.tsx…_

### 2026-05-17 · [admin] FIXED — Links quebrados e duplicatas em predisposições raciais
- Removidas 26 duplicatas em `breed_predispositions` (mesmo par raça×condição inserido 2x pelo seed v2).
- Adicionada constraint única `(breed_id, condition_id)` para impedir reincidência.
- Substituídos URLs `pubmed.ncbi.nlm.nih.gov/<id>` por `europepmc.org/article/MED/<id>` (sem bloqueio de referer no preview).

### 2026-05-17 · [admin] ADDED — Predisposições para 48 raças sem dados (catálogo +139 registros)
- 22 novas condições clínicas (Luxação Patelar, Hidrocefalia, Colapso Traqueal, MMVD, HCM Felina, PKD, DRC Felina, Hipertireoidismo Felino, Atopia, Polimiosite, Legg-Calvé-Perthes, Amiloidose Renal, Seio Dermóide, Surdez Congênita, Glaucoma Primário, Cushing, IVDD, DCM, Linfoma, Mastocitoma, Megaesôfago, GDV) com PT/EN, categoria e fontes (OMIA, EuropePMC, ACVS, IRIS, ACVIM).
- 133 novas predisposições raciais cobrindo Bullmastiff, Mastim Inglês, Tibetan Mastiff, Dogue de Bordeaux, Fila Brasileiro, Terra Nova, Pastor de Anatólia, Schnauzer Gigante/Miniatura, Vizsla, Weimaraner, Setter Irlandês, Spinone, Sussex, Chihuahua, Maltês, Papillon, Pinscher Min., Poodle Toy/Standard, Bichon, Lhasa Apso, Jack Russell, Bull Terrier, Border/Cairn/Kerry Blue/Norfolk Terrier, Basset Hound, Buldogue Americano/Australiano, Pit Bull, Pastor Belga Malinois, Pastor de Shetland, Old English Sheepdog, Malamute, Shiba Inu, Spitz Alemão, Welsh Corgi Pembroke, Whippet, Rhodesian Ridgeback, Maine Coon, Ragdoll, Persa, Exótico, Siamês, Oriental, Doméstico.
- Cada registro inclui `risk_factor`, `evidence_grade`, `genetic_profile` (quando aplicável, ex.: MYBPC3 em Maine Coon, FGF3/4/19 em Rhodesian Ridgeback, SOD1 em Welsh Corgi, PKD1 em Persa), `inheritance_pattern`, `prevalence_pct` e 1–2 fontes clicáveis verificadas.

### 2026-05-17 · [admin] ADDED — Catálogo bilíngue de raças e condições com fontes científicas
- Seed bilíngue com +30 condições crônicas/degenerativas caninas (BOAS, mielopatia degenerativa SOD1, EPI, SARDS, hemangiossarcoma, MDR1, etc.) com `sources` JSONB contendo links diretos para OMIA, PubMed, ACVIM, ESCCAP, IRIS e Merck Vet Manual.
- Seed bilíngue com +61 raças (AKC/FCI + Fila Brasileiro) e +76 predisposições enriquecidas com `risk_factor`, `evidence_grade`, `inheritance_pattern`, `prevalence_pct` e até 3 fontes científicas com URL direta por predisposição.
- `BreedPredispositionsPanel` agora renderiza chips de Perfil Genético / Padrão de Herança / Prevalência e lista de fontes clicáveis (`target="_blank"`, ícone ExternalLink) sob cada predisposição.
_files: src/components/administrador/breeds/BreedPredispositionsPanel.tsx, src/hooks/usePlatformCounts.ts, src/pages/Index.tsx, src/i18n.ts_

---
To add a new entry: edit CHANGELOG.md following the structured format, then run `npm run sync:changelog`.