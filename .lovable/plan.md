## Diagnóstico

Os 14 cães demo (Zeus, Bento, Mel, etc.) que apareceram agora vieram de uma migration que só criou a linha em `pet_profiles`. As tabelas clínicas (`pet_conditions`, `pet_exams`, `pet_medications`, `pet_clinical_notes`) ficaram vazias — por isso o painel mostra "0 Condições / 0 Medicações / 0 Exames / 0 Notas Clínicas" e "Nenhuma condição registrada".

Mas as **análises aprovadas** desses pets (`pet_clinical_analysis_snapshots`) já contêm a matéria-prima clínica que originalmente alimentou cada análise:

- `predispositions[]` → nome bilíngue da condição, `risk_factor`, `evidence_grade`, `already_diagnosed`, notas
- `lab_alerts[]` → `test_name`, `value`, `unit`, `min_normal`/`max_normal`, `status`, `exam_date`, `clinical_significance`
- `interaction_alerts[]` → composto/medicação envolvida
- `clinical_discoveries[]` → texto de descoberta cruzada

Ou seja: dá para reconstruir o histórico clínico **a partir do próprio snapshot**, sem inventar dado.

## Plano

### 1. Migration de backfill clínico (1 migration SQL idempotente)

Para cada um dos 14 pets demo (`pet_profiles.is_demo = true` e que possuem snapshot `complete`), inserir:

**`pet_conditions`** (`origin = 'breed_predisposition'` para os de risco; `origin = 'vet_diagnosis'` para `already_diagnosed = true`):
- `condition_name` ← `predispositions[i].condition_name`
- `severity` ← mapeado de `risk_factor` (1→mild, 2→moderate, 3+→severe)
- `status` ← `'active'` se `already_diagnosed`, senão `'monitoring'`
- `notes` ← `predispositions[i].notes`
- Idempotência: `ON CONFLICT DO NOTHING` via chave composta (pet_id, condition_name) — já existe? não — usar `WHERE NOT EXISTS` no INSERT.

**`pet_exams`** — um registro por `lab_alerts[i]`:
- `exam_type` ← `'Bioquímico'` (ou `'Hemograma'` quando o test_name bater com termos hematológicos)
- `exam_date` ← `lab_alerts[i].exam_date`
- `results` ← `{test_name, value, unit, status, min_normal, max_normal, clinical_significance}` em JSONB
- `notes` ← `clinical_significance`

**`pet_medications`** — derivar de `interaction_alerts[]` quando contiver nome de medicação; caso contrário, deixar vazio (transparência: não inventamos remédio que não foi prescrito).

**`pet_clinical_notes`** — uma nota `note_type = 'observation'` por pet:
- `content` ← resumo bilíngue: número de predisposições, número de alertas laboratoriais, lista de descobertas clínicas
- `extracted_entities` ← contadores

Tudo guardado por `is_demo = true` no perfil pai, então a deleção em massa de demo já remove em cascata (FK `ON DELETE CASCADE` já existe).

### 2. Verificação

Após a migration:
```sql
SELECT p.name, 
  (SELECT count(*) FROM pet_conditions WHERE pet_id=p.id) AS cond,
  (SELECT count(*) FROM pet_exams      WHERE pet_id=p.id) AS exam,
  (SELECT count(*) FROM pet_medications WHERE pet_id=p.id) AS med,
  (SELECT count(*) FROM pet_clinical_notes WHERE pet_id=p.id) AS notes
FROM pet_profiles p WHERE p.is_demo=true;
```
Deve mostrar números > 0 nas colunas `cond`/`exam`/`notes` para Zeus e os outros 13.

### 3. Sem mudança de código front

O perfil do pet (página da captura) já lê dessas tabelas — vai popular sozinho assim que a migration rodar. Nenhuma alteração em `.tsx` necessária.

### 4. Changelog

Adicionar entrada em `CHANGELOG.md` `[Unreleased]`:
```
### Fixed
- 14 cães demo materializados a partir de snapshots aprovados agora exibem condições, exames e notas clínicas reconstruídos do próprio snapshot (predispositions + lab_alerts + clinical_discoveries). Sem invenção de dados.
<!-- area: tutor-portal · status: shipped · i18n: none -->
```
Rodar `npm run sync:changelog`.

## Observações

- **Princípio "no-mock"** preservado: todo o conteúdo vem do snapshot já aprovado pelo veterinário, não de seed inventado.
- **Medicações**: ficarão zeradas para a maioria — é o comportamento correto (a análise não exige medicação prévia). Se quiser que apareça pelo menos uma para fins de demo, posso adicionar `meloxicam` apenas quando `interaction_alerts` mencionar AINEs.
- A migration roda uma única vez e é segura para reexecução graças aos `WHERE NOT EXISTS`.