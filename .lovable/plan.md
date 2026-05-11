## Diagnóstico

Após revisar o código, confirmo os 7 gaps que você levantou:

**Pets demo (gerados):**
- (a) Os pets demo **já recebem** N consultas no banco (`GenerateSamplePetsButton` insere 1→5 consultas com `pet_consultations` + `pet_conditions/medications/exams/notes` linkados via `consultation_id`), mas **a tela `PetProfilePage` não renderiza** o histórico — só mostra os agregados atuais (Conditions, Medications, Exams, Clinical Notes). Por isso "não estamos vendo".
- (b) Mesma coisa para nutrição: `pet_nutrition` + `pet_nutrition_items` são gravados, mas o perfil **não tem nenhum painel de ração / impacto nutricional** visível. Só aparecem indiretamente via "Comparação" do debug.
- (c) O painel "Depuração do MedGraphRAG longitudinal" não tem nenhuma explicação inline do que é cada aba (Auditoria / Blocos usados / Comparação) — falta `(?)` com tooltip didático.

**Pets cadastrados manualmente (`PetRegistrationForm`):**
1. ✅ Campo **sexo já existe** (radio male/female) — sem ação necessária, talvez só destacar visualmente.
2. ❌ Hoje só pede **idade em anos** (`age_years`); não há **data de nascimento**.
3. ❌ Não há **upload de foto** do pet.
4. ❌ Há um `PetExamPdfUploader`, mas ele só aparece **depois** do registro, no perfil; não está embutido no formulário inicial.
5. ❌ Não há UI para registrar **consultas históricas** (apenas a "consulta atual" implícita) — toda a infra de `pet_consultations` existe no banco mas não é exposta ao vet manual.

---

## Plano de ação

### Fase 1 — Tornar o histórico longitudinal visível no perfil do pet
**(resolve a + b para os pets demo, e dá lugar para a Fase 3 escrever)**

1. **Novo componente `PetConsultationsTimeline.tsx`** (`src/components/pet/`):
   - Lê `pet_consultations` ordenadas DESC com seus filhos (conditions/meds/exams/notes via `consultation_id`).
   - Renderiza uma linha do tempo vertical com cards: data, queixa principal, peso/ECC, achados, conduta.
   - A consulta com `is_latest=true` recebe **borda destacada + badge "Última consulta"**; as anteriores ficam em estilo secundário.
   - Cada card é expansível mostrando os exames/diagnósticos/medicações daquela visita.

2. **Novo componente `PetNutritionPanel.tsx`**:
   - Mostra a dieta atual (`pet_nutrition.is_current=true`) + itens (marca/produto/share%).
   - Se houver dados de `pet_food_nutrition` enriquecidos, mostra perfil (kcal/dia, %P/G, ω3:ω6, Ca:P) e flags de gap (déficit ω3, excesso de fósforo etc.).
   - Indicador de "dieta trocada na consulta de DD/MM" quando aplicável.

3. **Integração no `PetProfilePage`**: nova seção "Histórico Clínico" (timeline) e "Nutrição & Impacto" entre os contadores e o `PatientKnowledgeSubgraph`. Adicionar 2 contadores no header: **Consultas** e **Dieta atual**.

### Fase 2 — Tooltips didáticos `(?)` em pontos complexos
**(resolve c)**

1. Criar componente reutilizável `<HelpHint>` (ícone ⓘ / `HelpCircle` da lucide + Tooltip do shadcn) com `title` + `body` curto.
2. Aplicar em:
   - **Painel "Depuração do MedGraphRAG longitudinal"**: explicação geral + um `<HelpHint>` por aba:
     - *Auditoria*: "Verifica se o histórico no banco está íntegro: cada pet tem 1 única consulta marcada como `is_latest`, e conditions/exams/medications estão linkadas a uma consulta."
     - *Blocos usados*: "Mostra os 3 blocos que injetamos no prompt do MedGraphRAG: CURRENT_STATE (peso 1.0 — última consulta), CLINICAL_TRAJECTORY (peso 0.4 — consultas anteriores), DIET_PROFILE (perfil nutricional atual)."
     - *Comparação*: "Roda a inferência duas vezes (com e sem o histórico) e compara os compostos recomendados, flags anormais e menções a lacunas nutricionais."
   - **Análise com VetGraphRAG** (botão), **Pipeline workflow** (cada estágio), **Confidence level**, **Patient Knowledge Subgraph**, **Treatability chart**.

### Fase 3 — Cadastro manual rico (`PetRegistrationForm`)
**(resolve 1-5 dos pets manuais)**

1. **Data de nascimento em vez de idade**:
   - Adicionar campo `birth_date` (date picker) e calcular `age_years` automaticamente para envio (mantém compatibilidade com schema existente).
   - Migration: adicionar coluna opcional `birth_date DATE` em `pet_profiles`.

2. **Upload de foto do pet**:
   - Migration: criar bucket `pet-photos` (público) com policies por usuário; coluna `photo_url TEXT` em `pet_profiles`.
   - Componente `PetPhotoUploader` (avatar + drop zone) integrado no topo do form.

3. **Anexar PDFs de exames já no registro**:
   - Embutir o `PetExamPdfUploader` no formulário em uma seção colapsável "Exames iniciais (PDF)". Após o INSERT do pet, faz upload + chama `parse-pet-exam-pdf` com o `pet_id` recém-criado.

4. **Sistema de consultas históricas**:
   - Nova seção colapsável "Consultas anteriores" no formulário com botão `+ Adicionar consulta`.
   - Cada item permite preencher: data, queixa, peso/ECC, achados, conduta, **e sub-listas** de diagnósticos, medicações e exames daquela consulta (mesmo modelo do `DemoConsultation`).
   - Ao salvar, insere todas as consultas em ordem cronológica (o trigger `refresh_pet_consultation_latest` marca a mais recente como `is_latest`) e propaga `consultation_id` para conditions/meds/exams.
   - Reaproveitar (extrair) parte da lógica de inserção de `GenerateSamplePetsButton` para um service compartilhado `pet-consultation-writer.ts`.

5. **Sexo já existe** — apenas reorganizar visualmente para ficar lado a lado com data de nascimento.

### Fase 4 — Documentação e i18n

- Incrementar `I18N_VERSION` e adicionar todas as novas chaves PT/EN (timeline, nutrição, tooltips, novos campos).
- Atualizar `CHANGELOG.md` [Unreleased] → Added.
- Atualizar `ARCHITECTURE.md` (novo painel Histórico/Nutrição + bucket pet-photos) e `docs/CURRENT_STATE.md` (mover histórico longitudinal de "implementado no backend" para "exibido na UI").
- Atualizar `mem://features/sample-pets-complexity-order` notando que o histórico passou a ser visível.

---

## Detalhes técnicos

- **Migrations novas**: 
  - `pet_profiles.birth_date DATE` + `pet_profiles.photo_url TEXT`
  - bucket `pet-photos` com RLS por `auth.uid()`
- **Sem mudanças no MedGraphRAG / hybrid-recommendation** — a infraestrutura já consome o histórico; estamos apenas expondo na UI e ampliando os pontos de entrada.
- **Hooks novos**: `usePetConsultations(petId)`, `usePetNutrition(petId)`.
- **Service compartilhado** `src/services/pet-consultation-writer.ts` para deduplicar a lógica entre `GenerateSamplePetsButton` e o novo formulário.

## Fora de escopo

- Edição/exclusão de consultas históricas após o registro (read-only nesta fase; edição vem depois).
- OCR automático da carteirinha de vacinação.
- Versionamento avançado de dietas ao longo do tempo (continuamos com snapshot atual + 1 troca).
