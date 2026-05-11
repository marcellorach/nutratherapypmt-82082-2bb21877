# Plano — Fases 3 e 4

> Observação: a Fase 2 (tooltips `(?)`) já foi entregue na rodada anterior. Esta execução cobre **Fase 3 (cadastro manual rico)** e **Fase 4 (i18n + docs)**.

## Fase 3 — `PetRegistrationForm` rico

### 3.1 Data de nascimento + sexo lado a lado
- Adicionar campo `birth_date` (date picker shadcn) ao lado do campo `sex`.
- Calcular `age_years` automaticamente (decimal, com base em `differenceInYears` / meses).
- Manter `age_years` no payload para não quebrar o schema atual; persistir também `birth_date` (coluna já criada na Fase 1).

### 3.2 Foto do pet
- Novo componente `PetPhotoUploader.tsx`:
  - Avatar circular + drop zone + botão "Trocar foto".
  - Faz upload em duas etapas: (1) seleção local com preview (URL.createObjectURL); (2) após `INSERT` do pet, faz upload em `pet-photos/{pet_id}/avatar.{ext}` e atualiza `pet_profiles.photo_url`.
- Renderizar foto no `PetProfilePage` (header) e na lista de pets (`VeterinarioPage`).

### 3.3 PDFs de exames já no registro
- Seção colapsável (Collapsible) "Exames iniciais (PDF)" no formulário.
- Permite anexar múltiplos arquivos antes do submit (mantidos em estado).
- Após criar o pet, percorre os arquivos e chama `parse-pet-exam-pdf` com o `pet_id` recém-criado (mesmo fluxo do `PetExamPdfUploader`, reutilizando a função em um helper `src/services/pet-exam-uploader.ts`).
- Resultados aparecem no `PetExamReviewDialog` existente (um por arquivo) — vet aprova antes de gravar.

### 3.4 Consultas históricas no cadastro
- Nova seção colapsável "Consultas anteriores" com botão `+ Adicionar consulta`.
- Cada item (`HistoricalConsultationItem`) coleta: data, queixa, peso, ECC, achados, conduta + sub-listas:
  - Diagnósticos (`condition_name`, severidade, status)
  - Medicações (nome, dose, frequência, datas)
  - Exames (tipo, data, observações; sem PDF nesta fase)
- Service novo `src/services/pet-consultation-writer.ts` (extraído de `GenerateSamplePetsButton`):
  - `writeConsultationBundle(petId, bundle)` faz INSERT em `pet_consultations` e propaga `consultation_id` para `pet_conditions` / `pet_medications` / `pet_exams` / `pet_clinical_notes`.
  - O trigger `refresh_pet_consultation_latest` cuida de `is_latest`.
- Submissão final: ordena consultas DESC por data, insere uma a uma e marca a última como atual.

### 3.5 Reorganização visual do form
- Layout em duas colunas (sm+):
  - Esquerda: foto + nome + espécie + raça
  - Direita: data nascimento + sexo + castrado + peso + chip
- Tutor (owner) e notas em uma seção abaixo.
- Seções colapsáveis (Exames iniciais, Consultas anteriores) ao final.

### Arquivos novos
- `src/components/pet/PetPhotoUploader.tsx`
- `src/components/pet/HistoricalConsultationsSection.tsx`
- `src/components/pet/HistoricalConsultationItem.tsx`
- `src/services/pet-consultation-writer.ts`
- `src/services/pet-exam-uploader.ts` (helper reutilizado)

### Arquivos modificados
- `src/components/pet/PetRegistrationForm.tsx` — campos novos + seções colapsáveis
- `src/pages/veterinario/PetRegistrationPage.tsx` — passar foto/exames/consultas após criação
- `src/hooks/usePetProfile.ts` — incluir `birth_date`/`photo_url` no `PetProfileData`
- `src/components/pet/GenerateSamplePetsButton.tsx` — refatorar para usar o novo `pet-consultation-writer.ts` (DRY)
- `src/pages/veterinario/PetProfilePage.tsx` — renderizar `photo_url` no header

### Sem migrações novas
- `birth_date` e `photo_url` já foram criados na Fase 1.
- Bucket `pet-photos` já existe (público, com RLS por owner).

## Fase 4 — i18n + documentação

- Bumpar `I18N_VERSION` em `src/i18n.ts` (de 1.66.0 → 1.67.0).
- Adicionar todas as novas chaves em `src/locales/{pt,en}/translation.json`:
  - `petRegistration.form.birthDate`, `petRegistration.form.photoUploader.*`
  - `petRegistration.form.initialExams.*`
  - `petRegistration.form.historicalConsultations.*` (incluindo labels de cada sub-lista e tooltips)
- Atualizar `CHANGELOG.md` (`[Unreleased]` → Added) com bloco para Fase 3 (foto, data nascimento, exames PDF no registro, consultas históricas) e Fase 4 (i18n).
- Rodar `npm run sync:changelog` para regenerar `src/data/projectChangelog.generated.ts` + `.lovable/CONTEXT.md`.
- Atualizar `ARCHITECTURE.md`: nova seção sobre `pet-consultation-writer.ts`, bucket `pet-photos`, novos componentes do form.
- Atualizar `docs/CURRENT_STATE.md`: mover "Histórico de consultas" e "Foto do pet" de "mockado/parcial" para "Implementado".
- Atualizar memória `mem://features/sample-pets-complexity-order` adicionando nota: "cadastro manual agora paridade com pets demo (foto, data nascimento, exames PDF, consultas históricas)".

## Fora de escopo
- Edição/exclusão de consultas históricas após salvar (read-only via timeline).
- OCR/parse automático de carteira de vacinação.
- Upload de PDFs por consulta histórica individual (apenas exames "iniciais" do pet nesta fase).
- Versionamento avançado de dietas.

## Riscos / pontos de atenção
- Upload de foto precisa rodar **depois** do INSERT (precisamos do `pet_id` para a pasta no bucket).
- Múltiplos PDFs em paralelo: limitar a `Promise.allSettled` com no máximo 3 simultâneos para não sobrecarregar a edge function.
- Refatoração do `GenerateSamplePetsButton`: garantir que os 5 sample pets continuam gerando exatamente o mesmo histórico (rodar manual após a refatoração).