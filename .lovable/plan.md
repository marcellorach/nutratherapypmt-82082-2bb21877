
## Problemas identificados

### a) Busca de evidências desapareceu
Na última consolidação de tabs, o componente `DigitalTwinDog` (que contém o `EvidenceGapCard` com busca + log panel) foi removido do `PetProfilePage.tsx`. Apenas o `BiologicalTimeline` permanece na tab "trajectory". O `DigitalTwinDog` está importado e funcional, mas não está renderizado em nenhum lugar da página.

### b) Avatares dos cães com marcadores incorretos
A lógica em `buildMarkers()` funciona assim:
- **Sem protocolo**: `buildMarkers(yearWithout, new Set(), false)` -- mostra marcadores mas nenhum como "protegido"
- **Com protocolo**: `buildMarkers(yearWith, coveredNames, true)` -- mostra marcadores com ★ nos protegidos

O problema é que a API de trajetória provavelmente retorna dados diferentes para `years_without_protocol` e `years_with_protocol`. Se `yearWithout` vier vazio ou sem `existing_conditions`, o avatar "sem protocolo" fica limpo e as doenças só aparecem no "com protocolo" -- invertendo a lógica visual.

### c) Perplexity
O Perplexity JA está integrado na edge function `kg-evidence-gap-fill`. A chave `PERPLEXITY_API_KEY` é lida via `Deno.env.get()`. Precisa verificar se o connector está ativo.

---

## Plano de implementação

### 1. Restaurar `DigitalTwinDog` no PetProfilePage
- Adicionar `DigitalTwinDog` de volta ao `PetProfilePage.tsx`, dentro da tab "trajectory" (substituindo ou complementando o `BiologicalTimeline`)
- O `DigitalTwinDog` já inclui internamente o `EvidenceGapCard` (busca com logs) e o `DigitalTwinLogPanel`
- Isso restaura toda a funcionalidade de busca de evidências que estava funcionando

### 2. Corrigir lógica dos marcadores nos avatares
- Garantir que `markersWithout` sempre receba as condições existentes do pet (fallback para os dados do cenário "com protocolo" se o cenário "sem" vier vazio)
- Ambos os avatares devem mostrar os marcadores de doenças; a diferença visual é que no "com protocolo" os marcadores cobertos pelo KG ganham ★ (protegido) e potencialmente severidade reduzida

### 3. Verificar connector Perplexity
- Confirmar se o connector está ativo para que as buscas realmente funcionem

### 4. i18n
- Incrementar `I18N_VERSION` se houver novas chaves
- Atualizar CHANGELOG.md
