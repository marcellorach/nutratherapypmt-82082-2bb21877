# Base Farmacológica Veterinária (drogas + marcas BR + interações)

## Diagnóstico

Hoje **não existe** um catálogo de medicamentos no sistema. A tabela `pet_medications` guarda apenas texto livre (`medication_name`, `dosage`, `frequency`) — sem vínculo com princípio ativo, classe, marca comercial ou base de interações. Por isso a veterinária digitou um nome comercial brasileiro (ex.: "Previcox", "Rimadyl", "Apoquel") e o sistema não reconheceu nada — não há o que reconhecer.

Os "grandes bancos" que temos hoje cobrem **nutracêuticos, condições, ontologias biomédicas e triplets de evidência** (ver sidebar admin: Base de Conhecimento, Processamento de Dados, Pesquisa). **Drogas farmacêuticas e seus nomes comerciais BR não estão em lugar nenhum** — é uma lacuna real.

## Proposta

Criar uma nova **família no menu admin** chamada **"Base Farmacológica"** (irmã de "Base de Conhecimento"), com 3 abas iniciais:

1. **Princípios Ativos** (carprofeno, firocoxib, oclacitinibe, gabapentina, tramadol, prednisolona, enrofloxacina, etc.)
2. **Marcas Comerciais BR** (Previcox, Rimadyl, Apoquel, Galliprant, Onsior, Meticorten…) ligadas ao princípio ativo
3. **Interações & Contraindicações** (droga ↔ droga, droga ↔ nutracêutico, droga ↔ condição)

E integrar isso ao **cadastro do cão**: quando a vet digitar "Previcox", o sistema sugere/normaliza para `firocoxib` (AINE COX-2), exibe alertas se já houver outro AINE/corticoide e checa interação com nutracêuticos recomendados.

## Modelo de dados (novo)

```text
drug_substances              ← princípio ativo canônico
  id, inn_name (DCI), inn_name_en, drug_class, atc_vet_code,
  mechanism, common_routes[], pediatric_geriatric_notes,
  contraindicated_breeds[], contraindicated_conditions[]

drug_brands                  ← marcas comerciais (foco BR + globais)
  id, brand_name, manufacturer, country='BR',
  substance_id → drug_substances, dose_form, strengths[],
  vet_label (boolean: rótulo veterinário ou off-label humano), anvisa_mapa_reg

drug_interactions            ← droga ↔ droga / nutracêutico / condição
  id, substance_a_id, substance_b_id (nullable),
  nutraceutical_id (nullable), condition_id (nullable),
  severity (info|caution|major|contraindicated),
  mechanism, recommendation, evidence_grade, citations[]

pet_medications  (alterar)   ← passa a referenciar o catálogo
  + substance_id (nullable, FK drug_substances)
  + brand_id     (nullable, FK drug_brands)
  + raw_input    (texto original digitado)
```

RLS: leitura pública autenticada; escrita só admin.

## UI / Navegação

**Novo grupo no sidebar admin** (`src/components/administrador/sidebar/AdminSidebarGroups.tsx` + novo `PharmacologyGroup.tsx`):

```text
Base Farmacológica
 ├─ Princípios Ativos
 ├─ Marcas Comerciais (BR)
 ├─ Interações & Contraindicações
 └─ Importação (Bulário/MAPA/ANVISA + CSV)
```

**No cadastro/edição do pet** (`PetRegistrationForm`, campo medicações):
- Autocomplete que busca em `drug_brands.brand_name` **e** `drug_substances.inn_name`
- Ao escolher marca, mostra chip "= firocoxib (AINE COX-2)"
- Painel de alertas em tempo real: duplicidade de classe, interação com outras meds já listadas, conflito com condições do pet, conflito com nutracêuticos sugeridos
- Permite "salvar mesmo assim" registrando `raw_input` quando não houver match (vira fila de curadoria)

## Seed inicial (~50 drogas mais usadas em cães no Brasil)

AINEs (carprofeno/Rimadyl, firocoxib/Previcox, meloxicam/Maxicam, robenacoxib/Onsior, grapiprant/Galliprant), corticoides (prednisolona/Meticorten, dexametasona), antibióticos (enrofloxacina/Baytril, amoxicilina+clav/Synulox, doxiciclina), antiparasitários (afoxolaner/NexGard, sarolaner/Simparic, milbemicina), dermato (oclacitinibe/Apoquel, lokivetmabe/Cytopoint), neuro/dor (gabapentina, tramadol, pregabalina), cardio (pimobendana/Vetmedin, benazepril, furosemida), endócrino (trilostano/Vetoryl, levotiroxina), GI (maropitant/Cerenia, ondansetrona, omeprazol).

## Curadoria & fontes

- Importador admin com upload CSV + busca em RxNorm/ATCvet/DrugBank (já temos `fetch-external-ontologies`); marcas BR via lista curada manualmente (não há API pública limpa do bulário veterinário).
- Reaproveitar o padrão de `base_knowledge_candidates` (pending → approved) para novas marcas/interações sugeridas pela IA caírem em fila de revisão.

## Escopo da 1ª entrega (sugestão de fases)

**Fase 1 (MVP visível p/ a vet):**
- Tabelas `drug_substances`, `drug_brands` + alteração em `pet_medications`
- Seed das ~50 drogas + ~80 marcas BR
- Autocomplete + normalização no formulário de pet
- Aba "Princípios Ativos" e "Marcas Comerciais" no novo grupo do sidebar (CRUD básico)

**Fase 2:**
- `drug_interactions` + painel de alertas no cadastro e no `ClinicalAlertsPanel`
- Integração das interações nas recomendações híbridas (`hybrid-recommendation`)

**Fase 3:**
- Importador externo (RxNorm/ATCvet) + fila de curadoria de marcas/interações sugeridas pela IA

## Perguntas para você decidir antes de eu implementar

1. **Escopo da 1ª entrega:** começamos só pela Fase 1 (catálogo + autocomplete que já resolve a queixa da vet) ou já incluímos Fase 2 (alertas de interação)?
2. **Posso assumir o nome do grupo no menu como "Base Farmacológica"** ou prefere outro (ex.: "Base de Medicamentos", "Farmacologia Veterinária")?
3. **Seed inicial:** posso popular as ~50 drogas + marcas BR mais comuns que listei, ou você quer enviar uma planilha sua?
