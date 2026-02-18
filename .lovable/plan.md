

# Plano: Landing Page Pitch Stanford com Slogan Atualizado

## Slogan Final

**EN:** "Extending Lives Through Precision Geroscience. 1.4 Million Dogs. Unlimited Discoveries."
**PT:** "Estendendo Vidas Atraves da Gerociencia de Precisao. 1,4 Milhao de Caes. Descobertas Ilimitadas."

## Estrutura

A pagina atual (hero + login/dashboard) permanece intacta no topo. Abaixo, adiciona-se um indicador "Scroll to explore" e 6 novas secoes com Framer Motion.

```text
TOPO EXISTENTE (inalterado)
  v Scroll to discover our vision v

SECAO 1 - THE VISION
  Slogan principal
  Caes como modelo translacional (7x mais rapido)
  Infografico Geroproteção vs Gerogenicidade (CSS/SVG)
  Nova ciencia da longevidade: tratar causas-raiz

SECAO 2 - THE OPPORTUNITY
  PetLove: 1.4M caes, +30K/mes, 2o maior plano pet
  PAMEC: 11 policias estaduais
  3 pilares: tratamento preventivo, descobertas epidemiologicas, estudos cohort

SECAO 3 - THE TECHNOLOGY (VetGraphRAG)
  Infografico 5 camadas: Compounds > Targets > Mechanisms > Effects > Clinical Outcomes
  Pipeline visual: Mass Data > AI Analysis > KG > Treatment > ML Feedback Loop
  Destaque: MedGraphRAG para veterinaria, machine learning, retroalimentacao

SECAO 4 - EXPECTED OUTCOMES
  Metricas: 20-30% reducao doencas, deteccao precoce, descobertas translacionais
  Casos por raca: Golden/displasia, Cavalier/cardiaco, Beagle/epilepsia

SECAO 5 - MARKET OPPORTUNITY
  TAM: 85M caes | SAM: 28M | SOM: 5.6M
  3o maior mercado pet, 14%+ crescimento, US$12bi/ano
  Infografico circulos concentricos CSS

SECAO 6 - INVESTMENT CTA
  Moats competitivos, roadmap 4 fases
  [Schedule Meeting] [Request Pitch Deck]
```

## Navegacao por Secoes

Barra sticky ao scrollar com anchors: Vision | Opportunity | Technology | Outcomes | Market | Invest

## Secao Tecnica

### Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/components/landing/LandingContent.tsx` | Container com todas as 6 secoes |
| `src/components/landing/LandingSectionNav.tsx` | Navegacao sticky por anchors |
| `src/components/landing/VisionSection.tsx` | Slogan, modelo translacional, infografico geroproteção |
| `src/components/landing/OpportunitySection.tsx` | PetLove, PAMEC, 3 pilares |
| `src/components/landing/TechnologySection.tsx` | VetGraphRAG 5 camadas, pipeline, ML feedback |
| `src/components/landing/OutcomesSection.tsx` | Resultados esperados, casos por raca |
| `src/components/landing/MarketSection.tsx` | TAM/SAM/SOM infografico CSS |
| `src/components/landing/InvestmentSection.tsx` | CTA investimento, roadmap |

### Arquivos a Modificar

| Arquivo | Modificacao |
|---------|-------------|
| `src/pages/Index.tsx` | Adicionar scroll indicator + importar LandingContent abaixo do conteudo existente |
| `src/locales/pt/translation.json` | Adicionar chaves `landing.*` |
| `src/locales/en/translation.json` | Adicionar chaves `landing.*` |
| `src/i18n.ts` | Incrementar I18N_VERSION para 1.9.39 |

### Conteudo das Secoes (EN)

**Vision:**
- Slogan: "Extending Lives Through Precision Geroscience. 1.4 Million Dogs. Unlimited Discoveries."
- "Dogs age 7x faster than humans -- the perfect translational model for longevity science"
- Infografico CSS: Geroprotection (healthy aging, cellular repair) vs Gerogenic damage (tumors, arthritis, cognitive decline)
- "By targeting the root causes of aging, we prevent degenerative diseases before they manifest"

**Opportunity:**
- PetLove: "The 2nd largest pet health plan worldwide. 1.4M dogs with full veterinary records, growing 30K/month."
- PAMEC: "Police canine aging program across 11 Brazilian state forces"
- 3 pilares com icones: Preventive Geroprotective Treatment | Epidemiological Discovery | Volunteer Cohort Studies

**Technology:**
- "VetGraphRAG: A MedGraphRAG Purpose-Built for Veterinary Geroscience"
- Infografico pipeline 5 camadas em CSS com cores distintas
- Fluxo circular: Mass Data Acquisition > Curated KG + AI Analysis > Individualized Treatment > Outcome Tracking > Discovery Feedback Loop
- "Machine learning accelerates discoveries -- treatment outcomes feed back into the knowledge graph"

**Outcomes:**
- 4 cards: 20-30% fewer degenerative diseases | Early risk detection by breed | Translational discoveries (dog to human) | Mass personalized treatment
- 3 casos por raca com predisposicoes

**Market (dados dos slides):**
- Infografico circulos concentricos: TAM 85M | SAM 28M | SOM 5.6M
- Metricas laterais: 3rd largest pet market, 14%+ growth, US$12bi/year

**Investment:**
- 4 moats: Unique 1.4M cohort, Curated scientific KG, AI-powered geroscience, PAMEC credibility
- Roadmap: Phase 1 Knowledge Base (done) > Phase 2 Patient System (done) > Phase 3 Recommendation Engine > Phase 4 Longitudinal Studies
- CTAs: Schedule a Meeting, Request Pitch Deck

### Design

- Estilo clean/minimalista existente (preto, cinzas, pasteis)
- Infograficos em CSS/SVG puro (nao imagens)
- Framer Motion fade-in ao scroll
- Responsivo para projetor 1920x1080
- Secao hero existente 100% inalterada

### Prioridade

1. Criar todos os componentes de secao em paralelo
2. Criar LandingContent e LandingSectionNav
3. Modificar Index.tsx (scroll indicator + LandingContent)
4. Adicionar todas as traducoes PT/EN
5. Incrementar I18N_VERSION

