# Fontes Ontológicas Canônicas — Senex AI

Última atualização: 2026-05-22

Este documento lista as ontologias externas usadas para atribuir `canonical_id`
às entidades de `health_conditions` e `nutraceuticals`. Estratégia: **dump
offline versionado**, sem dependência de uptime de APIs de terceiros.

---

## 1. OMIA — Online Mendelian Inheritance in Animals

**Cobertura no Senex**: condições hereditárias caninas (predisposição racial).

- Site: https://omia.org
- Download oficial: https://omia.org/download/
- Espelho NCBI FTP: https://ftp.ncbi.nlm.nih.gov/pub/omia/
- Arquivo: `omia.txt.gz` (texto tabular, ~5 MB)
- API REST: existe (`https://omia.org/api/`) mas sem SLA; **não usamos em produção**.
- Taxonomy ID de cão: **9615** (`Canis lupus familiaris`)
- Licença: livre para uso acadêmico e comercial mediante citação
  (Nicholas FW, University of Sydney)
- Refresh sugerido: anual

Citação obrigatória:
> Nicholas FW. Online Mendelian Inheritance in Animals (OMIA): a comparative
> knowledgebase of genetic disorders and other familial traits in non-laboratory
> animals. Nucleic Acids Research. 2003;31(1):275–277.
> https://doi.org/10.1093/nar/gkg024

## 2. MeSH — Medical Subject Headings (NLM)

**Cobertura no Senex**: condições adquiridas, sinais clínicos, classes
farmacológicas e nutrientes genéricos.

- Site: https://www.nlm.nih.gov/mesh/
- Download: https://nlmpubs.nlm.nih.gov/projects/mesh/MESH_FILES/xmlmesh/
- Arquivos:
  - `desc2026.xml` — descritores principais (~300 MB)
  - `supp2026.xml` — substâncias suplementares (~1 GB)
- Filtros relevantes para geriatria canina:
  - Tree `C` (Diseases)
  - Tree `D` (Chemicals & Drugs)
  - Subtree `G06.184` (Geriatrics)
  - Subtree `D26` (Pharmaceutical Preparations)
- SPARQL endpoint (opcional para refresh dinâmico):
  https://id.nlm.nih.gov/mesh/sparql
- Licença: domínio público (NLM)
- Refresh sugerido: anual (NLM publica em novembro)

## 3. ChEBI — Chemical Entities of Biological Interest

**Cobertura no Senex**: compostos químicos e nutracêuticos puros.

- Site: https://www.ebi.ac.uk/chebi/
- Download: https://ftp.ebi.ac.uk/pub/databases/chebi/Flat_file_tab_delimited/
- Já integrado via edge function `fetch-external-ontologies` (busca síncrona).
  Fase 1 adiciona persistência do `canonical_id` retornado.
- Licença: CC BY 4.0

## 4. Mondo Disease Ontology (referência cruzada)

- Site: https://mondo.monarchinitiative.org
- Usado apenas quando OMIA + MeSH não cobrem (raro).

---

## Convenções de uso

- `canonical_source` aceita: `omia` · `mesh` · `mondo` · `snomed` · `umls` ·
  `chebi` · `pubchem` · `kegg` · `manual`.
- `canonical_id` é o ID nativo da fonte, sem prefixo (ex.: `D008279` para MeSH,
  `002218-9615` para OMIA, `16737` para ChEBI).
- Uma entidade pode ter `snomed_code`/`umls_cui` adicionais (já existentes na
  tabela), mas o par (`canonical_source`, `canonical_id`) é o que garante
  unicidade entre nós do KG.

## Procedimento de import (visão geral)

1. Baixar o dump no diretório local `data/ontologies/` (gitignored).
2. Rodar `npx tsx scripts/import-ontology-dump.ts --source=omia` (ou
   `--source=mesh`) — o script normaliza e faz `upsert` em
   `public.veterinary_ontology` e tenta vincular automaticamente a
   `health_conditions` / `nutraceuticals` por match exato de nome + sinônimos.
3. Linkagens fuzzy ficam pendentes para curadoria manual na aba **Ontologia**.

## Papers de fundamentação (Fase 1)

Recomendados para leitura antes/durante a curadoria:

1. Himmelstein DS et al. *Systematic integration of biomedical knowledge
   prioritizes drugs for repurposing*. **eLife (2017)**.
   https://doi.org/10.7554/eLife.26726
2. Huang K et al. *A foundation model for clinician-centered drug repurposing*
   (TxGNN). **Nature Medicine (2024)**.
   https://doi.org/10.1038/s41591-024-03233-x
3. Nicholas FW. *OMIA: a comparative knowledgebase*. **NAR (2003)**.
   https://doi.org/10.1093/nar/gkg024
4. Lipscomb CE. *Medical Subject Headings (MeSH)*. **Bull Med Libr Assoc (2000)**.
5. Hastings J et al. *ChEBI in 2016*. **NAR (2016)**.
   https://doi.org/10.1093/nar/gkv1031
6. ATBC Cancer Prevention Study Group. *Effect of vitamin E and beta carotene
   on lung cancer*. **NEJM (1994)**. — caso clássico de evidência negativa.
7. Petersen RC et al. *Vitamin E and donepezil for the treatment of MCI*.
   **NEJM (2005)**. — outro caso clássico de `FAILS_TO_TREAT`.
8. Bhathal A et al. *Glucosamine and chondroitin use in canines for
   osteoarthritis: A review*. **Open Vet J (2017)**.
9. Himmelstein DS, Baranzini SE. *Heterogeneous network edge prediction*
   (DWPC). **PLoS Comp Bio (2015)**.
   https://doi.org/10.1371/journal.pcbi.1004259
