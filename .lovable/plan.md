## Respostas às suas dúvidas

### 1) `triplet-curation` — Curadoria de Triplets
**Confirmado:** É exatamente o que você lembra — o board Kanban (`pending → reviewing → approved → rejected`) que mostra todos os triplets extraídos pelo pipeline, com filtros e enriquecimento. Hoje está **órfã do sidebar** (acessível só via URL).

→ **Recomendação:** RESTAURAR no sidebar dentro de **Knowledge Base**, logo abaixo de "Estudos Científicos", como **"Curadoria de Triplets"** (com badge amarelo "Em curadoria ativa"). É um hub operacional importante e diferente da curadoria inline no `EstudoDetailDialog` (aquela é por estudo; esta é a fila global cross-study).

### 2) `evidence-conflicts` — Conflitos de Evidência
**Tem função, sim.** É o `ConflictReviewPanel` — detecta e permite resolver conflitos entre claims de estudos diferentes (ex.: Estudo A diz "curcumina reduz CRP", Estudo B diz "sem efeito"). Usa o hook `useEvidenceConflicts` + `useConflictDetection`. Faz parte do governance do KG.

→ **Recomendação:** MANTER e adicionar ao sidebar em **Knowledge Base**, agrupado conceitualmente com Curadoria de Triplets (ambos são "curadoria/qualidade do KG").

### 3) `pet-food-catalog` — Catálogo de Rações
**Concordo:** referências nutricionais são insumo direto do pipeline clínico (gap nutricional vs. necessidade ideal). Faz parte do conhecimento base.

→ **Recomendação:** Adicionar ao sidebar em **Knowledge Base**, próximo a "Referências Laboratoriais" (ambos são "dados de referência externos"). Nome sugerido: **"Catálogo de Rações"**.

### 4) Foto 3 (Gestão de Campanhas + MicrobiomeAnalysisTab)
Conforme pedido: **remover** do projeto.

---

## Reorganização proposta dos demais órfãos (foto 2)

Agrupando por afinidade funcional:

### Grupo A — Mover para **Knowledge Base** (curadoria/qualidade)
| Tab órfã | Nome no sidebar | Posição sugerida |
|---|---|---|
| `triplet-curation` | Curadoria de Triplets | após "Estudos Científicos" |
| `evidence-conflicts` | Conflitos de Evidência | após "Curadoria de Triplets" |
| `dosage-curation` | Curadoria de Doses | após "Base Farmacológica" |
| `pet-food-catalog` | Catálogo de Rações | após "Referências Laboratoriais" |
| `triplet-quality` | Qualidade de Triplets | grupo "Diagnósticos do KG" (ver abaixo) |
| `gapfill-diagnostics` | Diagnóstico Gap-Fill | grupo "Diagnósticos do KG" |
| `ontology-mapping` | Mapeamento SNOMED/UMLS | após "Auditoria de Ontologia" |

### Grupo B — Mover para **Configuration** (governance/sistema)
| Tab órfã | Nome no sidebar | Posição sugerida |
|---|---|---|
| `translation-manager` | Gerenciar Traduções | logo após "Translation Audit" (são complementares) |
| `design-conventions` | Convenções de Design | após "Organograma" |
| `access-requests` | Solicitações de Acesso | seção "Administração de Usuários" |
| `analytics` | Analytics da Plataforma | seção "Métricas" |

### Grupo C — REMOVER (substituídas/redundantes)
| Tab | Por que remover |
|---|---|
| `fontes` (Data Processing) | Funcionalidade substituída por "Estudos Científicos" + "Base Knowledge" |
| `analysis` (Data Processing) | Step legado do wizard antigo de ingestão; substituído pelo pipeline atual em `EstudosTab` |

### Grupo D — Excluídos por sua decisão
- `acompanhamento` (Gestão de Campanhas) — remover tab + import
- `MicrobiomeAnalysisTab` — remover import órfão em `admin-tabs.ts`

---

## Estrutura final do Knowledge Base (depois da reorganização)

```
Knowledge Base
├── 📚 Estudos Científicos              ✓ verde
├── 🧩 Curadoria de Triplets            ⏳ amarelo (NOVO no sidebar)
├── ⚠️  Conflitos de Evidência          ⏳ amarelo (NOVO no sidebar)
├── 💊 Nutracêuticos                    ✓ verde
├── 🎯 Alvos Veterinários               ✓ verde
├── 🕸  Knowledge Graph                 ✓ verde
├── 🗺  Auditoria de Ontologia          ✓ verde
├── 🔬 Mapeamento SNOMED/UMLS           ⏳ amarelo (NOVO)
├── 🐾 Raças & Predisposições           ✓ verde
├── 🧪 Referências Laboratoriais        ⏳ amarelo
├── 🍖 Catálogo de Rações               ⏳ amarelo (NOVO)
├── 🗃  Dados Base                      —
├── 💊 Base Farmacológica               ⏳ amarelo
├── ⚖️  Curadoria de Doses              ⏳ amarelo (NOVO)
├── 🔗 Relações                         ✓ verde
├── ✨ A.I. Insights                    —
├── ── Diagnósticos do KG ──
│   ├── 📊 Qualidade de Triplets        (NOVO)
│   └── 🩺 Diagnóstico Gap-Fill         (NOVO)
└── ⚙️  Configurações                   —
```

## Estrutura final do Configuration

```
Configuration
├── ⚙️  Configurações IA
├── 🤖 AI Prompts
├── ✅ Ações (em lote)
├── ── Traduções ──
│   ├── 🌐 Translation Audit
│   └── 📝 Gerenciar Traduções          (NOVO)
├── 📊 Analytics                        (NOVO)
├── 🎨 Convenções de Design             (NOVO)
├── 🗂  Organograma do Projeto
├── 🛡  Conformidade Regulatória
├── 📋 Auditorias Técnicas
└── 🔐 Solicitações de Acesso           (NOVO)
```

---

## Resumo do que será feito (após sua aprovação)

1. **Adicionar 9 links** novos ao sidebar (7 em Knowledge Base, 4 em Configuration — alguns sobrepõem).
2. **Remover 4 tabs** de `admin-tabs.ts` + imports: `acompanhamento`, `fontes`, `analysis`, `MicrobiomeAnalysisTab` (import morto).
3. **Adicionar chaves i18n** PT/EN para todos os novos labels e tooltips de status.
4. **Bump** `I18N_VERSION` → `1.78.8`.
5. **CHANGELOG.md** entrada em `[Unreleased]` (area: `admin-sidebar`, status: `done`, i18n: `pt+en`) e rodar `npm run sync:changelog`.

## Pontos que ainda precisam da sua decisão antes de eu implementar

a) **`triplet-curation`** — confirma que quer RESTAURAR no sidebar (a memória do projeto diz que foi substituída pela curadoria inline; o board Kanban global ainda faz sentido pra fila cross-study)?
b) **`fontes` e `analysis`** — confirma REMOVER? (verifiquei: são steps do wizard antigo; nenhum outro componente os referencia além do roteador de tabs)
c) Algum nome do sidebar que prefere diferente do que sugeri?

Aguardo seu OK (ou ajustes) para passar para a implementação.
