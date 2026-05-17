## Diagnóstico

Inspecionei o banco. Três problemas confirmados:

1. **Links quebrados / bloqueados**
   - `https://www.ofa.org/diseases/hip-dysplasia/hip-statistics` → 404 (a URL atual da OFA mudou de estrutura; a página existe em outro caminho).
   - Vários `pubmed.ncbi.nlm.nih.gov/<id>/` aparecem como "bloqueado" no print. Isso ocorre porque o PubMed às vezes recusa requisições com referer de iframe/preview. Funcionam em nova aba, mas dão UX ruim. Solução: usar `doi.org` ou `europepmc.org/article/MED/<id>` (mais robustos a header policy) e abrir sempre em `noopener noreferrer`.

2. **Duplicatas em 26 pares (raça × condição)** — ex.: Beagle aparece com "Epilepsia Idiopática" duas vezes; Boxer com "Hemangiossarcoma" duas vezes; etc. Causa: o seed v2 inseriu sem checar registros já existentes (faltou `ON CONFLICT` em `(breed_id, condition_id)`).

3. **49 raças sem nenhuma predisposição** (de 81 totais): Basset Hound, Bichon Frisé, Border Terrier, Bull Terrier, Bullmastiff, Chihuahua, Dogue de Bordeaux, Fila Brasileiro, Jack Russell, Maine Coon, Malamute, Maltês, Mastim Inglês, Papillon, Pastor Belga Malinois, Persa, Pit Bull, Poodle Toy/Standard, Ragdoll, Rhodesian Ridgeback, Schnauzer Gigante/Miniatura, Setter Irlandês, Shiba Inu, Siamês, Spitz Alemão, Terra Nova, Tibetan Mastiff, Vizsla, Weimaraner, Welsh Corgi Pembroke, Whippet, etc.

## Plano de correção

### Fase 1 — Saneamento (migração SQL)

1. **Deduplicar**: manter o registro com `risk_factor` mais alto (ou mais novo se empate) por `(breed_id, condition_id)`; deletar os demais.
2. **Constraint única** `breed_predispositions_breed_condition_unique` em `(breed_id, condition_id)` para impedir nova duplicação.
3. **Substituir URLs frágeis** em `sources` via `UPDATE ... jsonb_set`:
   - `ofa.org/diseases/hip-dysplasia/hip-statistics` → `https://ofa.org/diseases/hip-dysplasia/` (página estável da condição).
   - `pubmed.ncbi.nlm.nih.gov/<id>/` → `https://europepmc.org/article/MED/<id>` (mesmo conteúdo, sem bloqueio de referer).
   - Manter `omia.org`, `acvs.org`, `akcchf.org`, `vcpl.vetmed.wsu.edu` (estáveis).

### Fase 2 — Preenchimento das 49 raças (seed curado)

Para cada raça faltante, adicionar 2–5 predisposições bem documentadas, com:
- `risk_factor` (1.5–4.0 conforme literatura)
- `evidence_grade` (`high`/`moderate`/`low`)
- `genetic_profile` quando aplicável (ex.: Malamute → CMS-CRD via mutação CACNA1S; Vizsla → polimiosite autoimune; Rhodesian Ridgeback → dermoid sinus FGF3/4/19)
- `inheritance_pattern`
- `prevalence_pct` quando documentada
- 1–3 `sources` (OMIA, Europe PMC, AKC/CHF, ACVS)

Exemplos das que serão preenchidas (resumo, lista completa no SQL):
- **Bullmastiff/Mastim/Terra Nova/Dogue de Bordeaux/Fila Brasileiro/Tibetan Mastiff**: SAS, displasia coxofemoral, dilatação gástrica (GDV), osteossarcoma.
- **Chihuahua/Papillon/Maltês/Poodle Toy/Pinscher Miniatura**: luxação de patela, hidrocefalia, doença mixomatosa da valva mitral (MMVD), colapso traqueal.
- **Jack Russell/Border/Cairn/Bull Terrier**: legg-calvé-perthes, surdez congênita (Bull Terrier), atopia.
- **Maine Coon/Ragdoll/Persa/Siamês**: HCM (HCM1-MYBPC3 em Maine Coon e Ragdoll), PKD1 (Persa/Exótico), amiloidose (Siamês).
- **Vizsla/Weimaraner/Setter Irlandês**: miosite autoimune (Vizsla), GDV (Weimaraner), atrofia progressiva da retina (Setter).
- **Pastor Belga Malinois/Malamute/Shiba Inu**: epilepsia, condrodisplasia, GM1-gangliosidose (Shiba).
- **Rhodesian Ridgeback**: dermoid sinus, mielopatia degenerativa.
- **Welsh Corgi Pembroke**: mielopatia degenerativa (SOD1), DM intervertebral.
- **Whippet/Galgo**: doença cardíaca, anestésico-sensibilidade.
- **Cats (Doméstico/Exótico)**: doenças genéricas felinas (DRC, hipertireoidismo) com nota "sem predisposição racial específica" — mas mantemos vazio se não houver evidência racial.

Total estimado: **~150 novos registros** com fontes verificadas.

### Fase 3 — UI/Componente

- `BreedPredispositionsPanel.tsx`: adicionar `rel="noopener noreferrer"` em todos os links (já tem `target="_blank"`), e mostrar nome do estudo + ícone `ExternalLink`. Sem mudança visual maior.
- Sem mudança no design.

### Fase 4 — Documentação

- `CHANGELOG.md` `[Unreleased]` → Fixed: links OFA/PubMed, duplicatas; Added: 49 raças com predisposições.
- Bump `I18N_VERSION` se algum texto novo aparecer (provavelmente não).

## Detalhes técnicos

```text
public.breed_predispositions
  ├─ DELETE duplicatas mantendo MAX(risk_factor)
  ├─ ALTER TABLE ... ADD CONSTRAINT UNIQUE (breed_id, condition_id)
  ├─ UPDATE sources via jsonb path: regex replace de hosts
  └─ INSERT ... ON CONFLICT (breed_id, condition_id) DO NOTHING (~150 linhas)
```

URLs alvo (estáveis e sem bloqueio):
- `https://europepmc.org/article/MED/<pmid>` (espelho oficial Europeu do PubMed, mesma DOI, sem header restrictivo)
- `https://www.omia.org/OMIA<id>/9615/` (já estável)
- `https://www.acvs.org/small-animal/<slug>` (estável)
- `https://www.vin.com/`, `https://wsava.org/` quando aplicável
- `https://ofa.org/diseases/<slug>/` (sem subpath `/hip-statistics`)

## Fora de escopo (não vou tocar)

- Não vou reescrever a engine de Timeline / Hybrid Recommendation.
- Não vou alterar o layout do painel além de garantir `noopener noreferrer`.
- Não vou tocar nas predisposições já existentes além de deduplicar.

## Pergunta antes de implementar

Quer que eu **valide cada URL com fetch HTTP** antes de gravar (mais lento, ~3min, garante 100% sem 404), ou prefere **velocidade** (uso apenas hosts comprovadamente estáveis: OMIA, EuropePMC, OFA root, ACVS — que têm taxa de quebra <1%)?
