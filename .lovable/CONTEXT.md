# Project context briefing (auto)
Generated: 2026-05-17T22:05:41.922Z

Read this file BEFORE starting any non-trivial task. It is the project's working memory.

## Latest i18n version: 1.78.9

## Changes by area (last 14 days)
- **vet-ui**: 13
- **admin**: 9
- **tutor-ui**: 8
- **clinical-pipeline**: 3
- **meta**: 2
- **i18n**: 1
- **curation**: 1

## Top 10 recent entries
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

### 2026-05-13 · [vet-ui] ADDED — Digital Twin do paciente (Fase 2 — histórico, traits, labs)
- `PatientKnowledgeSubgraph` ganha 3 novas camadas opcionais conectadas ao nó Pet central:
- Diagnósticos passados (círculos cinza, aresta `HAS_HISTORY` tracejada) lidos de `pet_conditions` resolvidas + consultas anteriores em `pet_consultations`.
- Traits (hexágonos azul-claro, aresta `HAS_TRAIT`) representando raça, faixa etária (filhote/adulto/sênior/geriátrico) e sexo. Traits de raça desenham `BREED_RISK_FOR` (tracejada azul-escura) apontando para condições predispostas vindas de `BreedPredisposition`.
_files: src/components/pet/PatientKnowledgeSubgraph.tsx, src/pages/veterinario/PetProfilePage.tsx, src/i18n.ts_

### 2026-05-13 · [vet-ui] ADDED — Subgrafo do paciente vira Digital Twin (Fase 1)
- `PatientKnowledgeSubgraph` agora renderiza um nó Pet central (estrela azul) com tooltip de raça/idade/peso/sexo, conectando-se via `HAS_CONDITION` a todas as condições ativas — antes condições e compostos flutuavam soltos sem dono clínico.
- Novos tipos de nó: medicação ativa (caixa roxa, lida de `pet_medications`) ligada ao Pet por `TAKES`, e detratores geriátricos ocultos (diamante âmbar) ligados por `EXHIBITS_DETRACTOR`.
- Novo tipo de aresta `INTERACTS_WITH` (vermelha, bidirecional) desenhada automaticamente entre composto recomendado e medicação atual sempre que o pipeline detecta um `InteractionAlert` — vet vê o conflito antes de aprovar.
_files: src/components/pet/PatientKnowledgeSubgraph.tsx, src/components/pet/VetGraphRAGInsightsPanel.tsx, src/pages/veterinario/PetProfilePage.tsx, src/i18n.ts_

### 2026-05-13 · [vet-ui] CHANGED — Evidências sempre com 2-3 links de estudos
- "Ver evidências e contexto" agora garante 2-3 referências clicáveis por composto, mesmo quando não há estudo curado para o par (composto × condição) — antes a seção "Estudos científicos" simplesmente sumia.
- Pipeline (`clinical-analysis-pipeline.ts → attachStudiesToCompounds`): novo helper `buildPublicSearchStudies(compound, condition)` que monta links determinísticos PubMed + Google Scholar; usado para top-up até `MAX_STUDIES_PER_COMPOUND = 3` quando o conjunto curado tem < 2 itens, e como fallback final no catch.
- UI (`CompoundDosageSlider.tsx`): novo badge "Busca pública" (cinza) diferenciando-o de PubMed/DOI/Scholar curados — mantém transparência do No-Mock Policy: nada é simulado, são buscas reais rotuladas.
_files: src/services/clinical-analysis-pipeline.ts, src/components/pet/CompoundDosageSlider.tsx, src/locales/pt/translation.json, src/locales/en/translation.json…_

---
To add a new entry: edit CHANGELOG.md following the structured format, then run `npm run sync:changelog`.