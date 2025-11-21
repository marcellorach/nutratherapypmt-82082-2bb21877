# SQL Instructions: Bulk Cleanup and Management

## ⚠️ NOTA IMPORTANTE

**Você não precisa mais executar SQL manualmente!**

Use o **Painel de Ações de Emergência** na interface administrativa para todas as operações de limpeza e reset:

- 🗑️ **Limpar Importações Antigas** → Mantém apenas as 5 mais recentes
- 🔄 **Resetar Estudos com Erro** → Reprocessa estudos que falharam
- 🧹 **Remover Duplicatas** → Limpa estudos com títulos repetidos
- 📊 **Verificar Saúde do Sistema** → Dashboard completo de diagnóstico

**Dashboard de Diagnóstico** também disponível com:
- Métricas em tempo real (total estudos, taxa de sucesso, tempo médio)
- Tabela de estudos problemáticos com reset individual ou em massa
- Seleção múltipla com checkboxes para ações em batch

---

## Context (Legacy SQL Documentation)

Este documento fornece consultas SQL para operações de bulk cleanup, prevenção de re-processamento e gestão de importações acumuladas.

**IMPORTANTE**: As queries SQL abaixo são fornecidas apenas como referência técnica. Para uso diário, utilize sempre a interface administrativa.

---

## 🚨 QUICK CLEANUP: Remove Accumulated Imports

### Option 1: Keep Last 5 Imports Only (Recommended)
```sql
-- Delete all except the 5 most recent imports
DELETE FROM scispace_imports
WHERE id NOT IN (
  SELECT id 
  FROM scispace_imports 
  ORDER BY imported_at DESC NULLS LAST 
  LIMIT 5
);

-- Verify: Should show only 5 imports
SELECT COUNT(*) as total_imports FROM scispace_imports;
```

### Option 2: Keep Imports from Last 7 Days
```sql
-- Delete imports older than 7 days
DELETE FROM scispace_imports
WHERE imported_at < NOW() - INTERVAL '7 days';
```

### Option 3: Delete ALL Imports (Use with Caution!)
```sql
-- WARNING: This deletes all import history
DELETE FROM scispace_imports;

-- Reset auto-increment if needed
ALTER SEQUENCE scispace_imports_id_seq RESTART WITH 1;
```

---

## 🔄 PREVENT RE-PROCESSING: Clean Errored Studies

### Reset Studies with Errors (for Re-processing)
```sql
-- Find studies with error status
SELECT id, title, original_filename, error_message, kanban_status
FROM processed_studies
WHERE kanban_status = 'error'
   OR error_message IS NOT NULL;

-- Reset them to 'new' status for re-processing
UPDATE processed_studies
SET 
  kanban_status = 'new',
  error_message = NULL,
  analysis_data = NULL
WHERE kanban_status = 'error'
   OR error_message IS NOT NULL;
```

### Delete Studies with Errors (Permanent Removal)
```sql
-- WARNING: This permanently deletes errored studies
DELETE FROM study_extractions
WHERE study_id IN (
  SELECT id FROM processed_studies WHERE kanban_status = 'error'
);

DELETE FROM processed_studies
WHERE kanban_status = 'error';
```

---

## 🧹 CLEANUP INCORRECT EXTRACTIONS

After the bug fix in `extract-study-entities`, some studies may have incorrect extraction data (e.g., Turmeric study showing probiotic data instead).

## Steps to Clean and Re-process

### 1. Identify Incorrect Extractions

Query to find studies with potential issues:
```sql
-- List all studies with their extraction data
SELECT 
  ps.id,
  ps.title,
  ps.original_filename,
  se.extraction_quality_score,
  se.extracted_data->'nutraceuticals' as nutraceuticals,
  se.extracted_data->'conditions' as conditions,
  se.created_at
FROM processed_studies ps
LEFT JOIN study_extractions se ON ps.id = se.study_id
WHERE ps.kanban_status = 'processed'
ORDER BY se.created_at DESC;
```

### 2. Delete Incorrect Extractions

For a specific study (replace `<study_id>` with the actual UUID):
```sql
-- Delete incorrect extraction
DELETE FROM study_extractions
WHERE study_id = '<study_id>';

-- Reset kanban status to allow re-processing
UPDATE processed_studies
SET kanban_status = 'new'
WHERE id = '<study_id>';
```

### 3. Batch Clean Multiple Studies

If you need to clean multiple studies at once:
```sql
-- Delete all extractions (CAREFUL!)
DELETE FROM study_extractions;

-- Reset all statuses to 'new'
UPDATE processed_studies
SET kanban_status = 'new'
WHERE kanban_status = 'processed';
```

### 4. Verify Cleanup

```sql
-- Check that extractions were deleted
SELECT COUNT(*) FROM study_extractions;

-- Check that statuses were reset
SELECT kanban_status, COUNT(*)
FROM processed_studies
GROUP BY kanban_status;
```

### 5. Re-process Studies

After cleanup:
1. Go to the **Estudos** tab in the admin panel
2. Select the studies you want to re-process
3. Click "Adicionar à Fila" to add them to the processing queue
4. Click "Iniciar Processamento" to start the extraction with the fixed pipeline

## Example: Clean the Turmeric Study

```sql
-- Find the Turmeric study ID
SELECT id, title, original_filename
FROM processed_studies
WHERE title ILIKE '%turmeric%'
   OR original_filename ILIKE '%turmeric%';

-- Delete its extraction (replace with actual ID)
DELETE FROM study_extractions
WHERE study_id = '2da2d739-5a2d-4546-a954-65e3d13b4ad3';

-- Reset status
UPDATE processed_studies
SET kanban_status = 'new'
WHERE id = '2da2d739-5a2d-4546-a954-65e3d13b4ad3';
```

## 📊 AUDIT & MONITORING QUERIES

### Check Processing Status Distribution
```sql
SELECT 
  kanban_status,
  COUNT(*) as count,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
FROM processed_studies
GROUP BY kanban_status
ORDER BY count DESC;
```

### Find Duplicate Studies (Same Title)
```sql
SELECT 
  title,
  COUNT(*) as duplicate_count,
  ARRAY_AGG(id) as study_ids,
  ARRAY_AGG(kanban_status) as statuses
FROM processed_studies
WHERE title IS NOT NULL
GROUP BY title
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;
```

### Check Studies Processed Today
```sql
SELECT 
  id,
  title,
  kanban_status,
  created_at,
  updated_at
FROM processed_studies
WHERE updated_at::date = CURRENT_DATE
ORDER BY updated_at DESC;
```

### Identify Studies Ready for Re-processing
```sql
-- Studies that are 'new' but have been in the system for a while
SELECT 
  id,
  title,
  original_filename,
  created_at,
  kanban_status
FROM processed_studies
WHERE kanban_status = 'new'
  AND created_at < NOW() - INTERVAL '1 day'
ORDER BY created_at DESC;
```

---

## 🔒 SAFETY BEST PRACTICES

### 1. Always Use Transactions for Bulk Operations
```sql
BEGIN;

-- Your DELETE/UPDATE queries here

-- Review changes before committing
SELECT COUNT(*) FROM processed_studies;
SELECT COUNT(*) FROM scispace_imports;

-- If everything looks good:
COMMIT;

-- If something is wrong:
-- ROLLBACK;
```

### 2. Create Backups Before Major Cleanups
```sql
-- Backup processed_studies to a temporary table
CREATE TABLE processed_studies_backup AS 
SELECT * FROM processed_studies;

-- Backup scispace_imports
CREATE TABLE scispace_imports_backup AS 
SELECT * FROM scispace_imports;

-- To restore if needed:
-- DROP TABLE processed_studies;
-- ALTER TABLE processed_studies_backup RENAME TO processed_studies;
```

### 3. Test Queries with SELECT First
```sql
-- Instead of DELETE, run SELECT first to see what will be deleted
SELECT id, title, kanban_status 
FROM processed_studies 
WHERE kanban_status = 'error';

-- Only after confirming, run the DELETE
-- DELETE FROM processed_studies WHERE kanban_status = 'error';
```

---

## 📝 COMMON CLEANUP SCENARIOS

### Scenario 1: "I have 36+ old imports cluttering the UI"
**Solution**: Use Option 1 (Keep Last 5 Imports)

### Scenario 2: "Study keeps showing 'already processed' error"
**Solution**: Reset specific study to 'new' status
```sql
UPDATE processed_studies
SET kanban_status = 'new', analysis_data = NULL
WHERE id = '<study_id>';
```

### Scenario 3: "I want to start fresh with all studies"
**Solution**: Reset all studies (WARNING: Nuclear option)
```sql
BEGIN;
DELETE FROM study_extractions;
UPDATE processed_studies SET kanban_status = 'new', analysis_data = NULL;
COMMIT;
```

### Scenario 4: "Remove studies from a specific import batch"
```sql
-- Find the import batch ID first
SELECT id, consenso_name, imported_at, COUNT(*) as study_count
FROM scispace_imports si
LEFT JOIN processed_studies ps ON ps.source_import_id = si.id
GROUP BY si.id
ORDER BY imported_at DESC;

-- Delete studies from specific import
DELETE FROM processed_studies
WHERE source_import_id = '<import_id>';

-- Then delete the import record
DELETE FROM scispace_imports
WHERE id = '<import_id>';
```

---

## 🔍 Validation Queries

After cleanup operations, verify the results:

```sql
-- Overall system health check
SELECT 
  'Total Studies' as metric,
  COUNT(*) as count
FROM processed_studies
UNION ALL
SELECT 
  'Processed Studies',
  COUNT(*) 
FROM processed_studies 
WHERE kanban_status = 'processed'
UNION ALL
SELECT 
  'Studies with Errors',
  COUNT(*) 
FROM processed_studies 
WHERE kanban_status = 'error'
UNION ALL
SELECT 
  'Pending Studies',
  COUNT(*) 
FROM processed_studies 
WHERE kanban_status = 'new'
UNION ALL
SELECT 
  'Total Imports',
  COUNT(*) 
FROM scispace_imports
UNION ALL
SELECT 
  'Total Extractions',
  COUNT(*) 
FROM study_extractions;
```

---

## ⚠️ CRITICAL WARNINGS

1. **NEVER** run DELETE queries in production without testing in development first
2. **ALWAYS** create backups before bulk operations
3. **ALWAYS** use transactions (BEGIN/COMMIT/ROLLBACK)
4. **TEST** with SELECT before running DELETE/UPDATE
5. **VERIFY** results after operations with validation queries
6. **DOCUMENT** what you changed and why (in this file or changelog)
