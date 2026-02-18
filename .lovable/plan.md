
# Plano: Atualizar Metricas e Casos por Raca na OutcomesSection

## Resumo das Mudancas

### 1. Metricas (cards do topo)
- **Card 1 (foto 1)**: Trocar "20-30%" por **"15-25%"** e texto para "Potential lifespan extension through geroprotective interventions" / "Potencial de extensao da vida atraves de intervencoes geroprotetoras"
- **Card 2 (foto 2)**: Trocar "~" (deteccao precoce) por **"40-70%"** e texto para "Fewer degenerative diseases through preventive geroprotection" / "Menos doencas degenerativas atraves de geroproteção preventiva"
- Cards 3 e 4 permanecem iguais (translational discoveries e 1.4M personalized)

### 2. Casos por raca (foto 3) - Incluir drogas geroprotetoras reais

Baseado em evidencias cientificas:

- **Golden Retriever** - Hip Dysplasia 60%
  - Approach: Curcumin (anti-inflamatorio articular) + Rapamycin (geroprotetor geral via inibicao mTOR) para protecao condroprotetora e geroprotecao sistemica desde os 2 anos.

- **Cavalier King Charles** - Mitral Valve Disease 70%
  - Approach: Empagliflozin (cardioprotetor SGLT2 com evidencia em insuficiencia cardiaca) + Rapamycin (geroprotetor geral) com CoQ10 e taurina desde idade adulta.

- **Beagle** - Epilepsy 6%
  - Approach: Apigenin (neuroprotetor, modulador GABAergico) + Dapagliflozin (neuroprotetor SGLT2 com evidencia em protecao cerebral) com monitoramento continuo.

## Secao Tecnica

### Arquivos a Modificar

| Arquivo | Modificacao |
|---------|-------------|
| `src/components/landing/OutcomesSection.tsx` | Trocar valores e icones dos 2 primeiros cards; reordenar metricas |
| `src/locales/en/translation.json` | Atualizar chaves `landing.outcomes.metrics.fewer`, `detection` e todas as `breeds.*.approach` |
| `src/locales/pt/translation.json` | Mesmo para portugues |
| `src/i18n.ts` | Incrementar I18N_VERSION para 1.9.40 |

### Detalhes das Mudancas

**OutcomesSection.tsx:**
- Metric 1: icon `TrendingUp` (extensao de vida), value `15-25%`, key `lifeExtension`
- Metric 2: icon `TrendingDown`, value `40-70%`, key `fewer`
- Metric 3 e 4: permanecem iguais

**Traducoes EN:**
```
metrics.lifeExtension: "Potential lifespan extension through geroprotective interventions"
metrics.fewer: "Fewer degenerative diseases through preventive geroprotection"
breeds.golden.approach: "Curcumin (anti-inflammatory) + Rapamycin (mTOR inhibitor for systemic geroprotection) — chondroprotective protocol starting at age 2."
breeds.cavalier.approach: "Empagliflozin (SGLT2 cardioprotection) + Rapamycin (systemic geroprotection) with CoQ10 and taurine from early adulthood."
breeds.beagle.approach: "Apigenin (GABAergic neuroprotection) + Dapagliflozin (SGLT2 neuroprotection) with continuous outcome monitoring."
```

**Traducoes PT:**
```
metrics.lifeExtension: "Potencial de extensao da vida atraves de intervencoes geroprotetoras"
metrics.fewer: "Menos doencas degenerativas atraves de geroproteção preventiva"
breeds.golden.approach: "Curcumina (anti-inflamatorio) + Rapamicina (inibidor mTOR para geroproteção sistemica) — protocolo condroprotetor iniciando aos 2 anos."
breeds.cavalier.approach: "Empagliflozina (cardioproteção SGLT2) + Rapamicina (geroproteção sistemica) com CoQ10 e taurina desde a idade adulta."
breeds.beagle.approach: "Apigenina (neuroproteção GABAergica) + Dapagliflozina (neuroproteção SGLT2) com monitoramento continuo de resultados."
```
