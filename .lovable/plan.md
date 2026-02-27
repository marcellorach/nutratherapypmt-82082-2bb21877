

## Plano: Melhorar Pets de Exemplo e Análise Real no Veterinário

### Diagnóstico

1. **Imagens dos pets**: O `PetProfileCard.tsx` usa apenas um ícone genérico de pata. Não há imagens de raça. O campo `photo_url` existe na tabela `pet_profiles` mas não é usado.

2. **Doenças**: As condições atuais dos pets de exemplo incluem algumas que o KG **pode** tratar (Osteoarthritis, Canine Cognitive Dysfunction) mas outras são irrelevantes ao escopo (Exocrine Pancreatic Insufficiency, Idiopathic Epilepsy, Syringomyelia). O MRI Brain já foi removido dos exames, mas as condições precisam ser alinhadas.

3. **Análise real**: O pipeline `handleAnalyzeWithKG` já é real — consulta Neo4j via `graph-rag-search` e gera recomendações via `hybrid-recommendation` com Lovable AI. **Está funcional**. O que falta é enriquecer a **apresentação dos resultados** com:
   - Caminho biológico (pathway visualization)
   - Embasamento científico (triplets e estudos de suporte)
   - Gráfico de expectativa de melhora ao longo do tempo

### Condições do KG confirmadas (aprovadas em triplet_extractions):
- Osteoarthritis / Canine Osteoarthritis — Curcumin, Chondroitin Sulfate, Vitamin E, Selenium, L-carnitine, MSM, etc.
- Canine Cognitive Dysfunction Syndrome — CoQ10, NAD+ precursor, Probiotics, MCTs, Ginkgo Biloba, etc.
- Cardiovascular Disease — múltiplos compostos
- Aging / Cellular Senescence — Rapamycin, Metformin, Senolytics
- Arthritis — Curcumin, Gallic Acid, etc.
- Cognitive Decline — vários

---

### Etapa 1: Imagens de raça nos cards de pet

- Usar a Lovable AI Image Generation (Gemini) para gerar imagens no momento da criação dos pets de exemplo seria lento e caro. Em vez disso, usaremos **URLs de fotos de cães por raça** de bancos de imagens gratuitos (Dog API ou URLs estáticas confiáveis).
- Modificar `GenerateSamplePetsButton.tsx` para incluir `photo_url` ao inserir os pets.
- Modificar `PetProfileCard.tsx` para exibir a `photo_url` em vez do ícone de pata.
- Modificar `PetProfilePage.tsx` no header para mostrar foto do pet.

### Etapa 2: Atualizar condições dos pets de exemplo

Trocar condições que o VetGraphRAG não tem dados por condições com cobertura real no KG:

| Pet | Raça | Condições Atuais | Condições Novas |
|-----|------|-------------------|-----------------|
| Rex | Labrador | Hip Dysplasia, Osteoarthritis | **Osteoarthritis** (moderate), **Aging/Frailty** (mild) |
| Luna | Cavalier | Mitral Valve Disease, Syringomyelia | **Cardiovascular Disease** (moderate), **Cognitive Decline** (mild) |
| Thor | German Shepherd | EPI, Atopic Dermatitis | **Osteoarthritis** (moderate), **Inflammation** (mild) |
| Mel | Golden Retriever | CCD, Hypothyroidism, Spondylosis | **Canine Cognitive Dysfunction** (moderate), **Osteoarthritis** (mild), **Cellular Senescence** (mild) |
| Max | Beagle | Idiopathic Epilepsy | **Cognitive Decline** (mild), **Aging** (monitoring) |

Exames e medicações serão ajustados para corresponder.

### Etapa 3: Enriquecer a apresentação dos resultados da análise

Após o `handleAnalyzeWithKG` retornar dados, além do VetRecommendationPanel com sliders, adicionar:

**a) Seção "Embasamento Científico"** — Novo componente `ScientificEvidencePanel.tsx`:
- Para cada condição, listar os triplets TREATS do KG que fundamentam a recomendação
- Mostrar: Composto → [TREATS] → Condição, com contagem de estudos e score de confiança
- Badge de nível de evidência (KG-backed vs AI-suggested)

**b) Seção "Caminho Biológico"** — Novo componente `BiologicalPathway.tsx`:
- Diagrama vertical simplificado mostrando: Composto → Mecanismo → Efeito → Resultado Clínico
- Baseado nos triplets HAS_MECHANISM, ACTIVATES, TREATS do KG
- Usa cards conectados por linhas (CSS, não biblioteca de grafos) para manter leve

**c) Seção "Projeção de Melhora"** — Novo componente `ImprovementProjectionChart.tsx`:
- Gráfico de linha (Recharts) mostrando projeção de melhora ao longo de 12 meses
- Curvas baseadas nos scores de tratabilidade e evidência
- Faixas de confiança (área sombreada)

### Etapa 4: Integrar dados reais do KG na análise

Modificar `handleAnalyzeWithKG` em `PetProfilePage.tsx` para:
- Após consultar Neo4j, salvar também os triplets relevantes encontrados no state
- Passar esses dados aos novos componentes de embasamento e pathway
- O `graph-rag-search` com queryType `context` já retorna nodes e relationships — basta processá-los

### Etapa 5: Traduções i18n e versionamento

- Incrementar versão no `i18n.ts`
- Adicionar chaves para todos os novos componentes em PT e EN
- Atualizar CHANGELOG.md

### Arquivos a criar/modificar

- **Criar**: `src/components/pet/ScientificEvidencePanel.tsx`
- **Criar**: `src/components/pet/BiologicalPathway.tsx`
- **Criar**: `src/components/pet/ImprovementProjectionChart.tsx`
- **Modificar**: `src/components/pet/GenerateSamplePetsButton.tsx` (condições + photo_url)
- **Modificar**: `src/components/pet/PetProfileCard.tsx` (exibir foto)
- **Modificar**: `src/pages/veterinario/PetProfilePage.tsx` (foto no header + novos painéis + dados do KG)
- **Modificar**: `src/locales/pt/translation.json` + `en/translation.json`
- **Modificar**: `src/i18n.ts`
- **Atualizar**: `CHANGELOG.md`

### Layout atualizado da página do pet

```text
┌────────────────────────────────────────────────────────────┐
│  [foto] Mel   Golden Retriever · 10a · 28kg    [Analisar] │
├────────────────────────────────────┬───────────────────────┤
│                                    │                       │
│  ┌─ Tratabilidade por Condição ──┐ │  ┌─ Chat Clínico ──┐ │
│  │  [Gráfico barras horizontais] │ │  │                  │ │
│  └───────────────────────────────┘ │  │                  │ │
│                                    │  │                  │ │
│  ┌─ Stack Geroprotetor ──────────┐ │  │                  │ │
│  │  [Sliders de dosagem]         │ │  │                  │ │
│  │  [Aprovar] [Modificar]        │ │  │                  │ │
│  └───────────────────────────────┘ │  │                  │ │
│                                    │  │                  │ │
│  ┌─ Embasamento Científico ──────┐ │  │                  │ │
│  │  Curcumin → TREATS → OA (12)  │ │  │                  │ │
│  │  CoQ10 → TREATS → CCD (8)    │ │  │                  │ │
│  └───────────────────────────────┘ │  │                  │ │
│                                    │  │                  │ │
│  ┌─ Caminho Biológico ───────────┐ │  └──────────────────┘ │
│  │  Composto → Mecanismo → Efeito│ │                       │
│  └───────────────────────────────┘ │                       │
│                                    │                       │
│  ┌─ Projeção de Melhora ─────────┐ │                       │
│  │  [Gráfico 12 meses]          │ │                       │
│  └───────────────────────────────┘ │                       │
│                                    │                       │
│  ┌─ Tabs: Condições | Meds... ───┐│                       │
│  │  (conteúdo existente)         ││                       │
│  └───────────────────────────────┘│                       │
└────────────────────────────────────┴───────────────────────┘
```

