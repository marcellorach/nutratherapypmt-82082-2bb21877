# SQL Instructions: Clean Up Incorrect Study Extractions

## Context
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

## Validation Queries

After re-processing, verify the data is correct:

```sql
-- Check extraction content
SELECT 
  ps.title,
  se.extracted_data->'nutraceuticals' as extracted_nutraceuticals,
  se.extracted_data->'conditions' as extracted_conditions,
  se.extraction_quality_score
FROM processed_studies ps
JOIN study_extractions se ON ps.id = se.study_id
WHERE ps.id = '<study_id>';
```

## Safety Notes

- **ALWAYS backup your data before running DELETE queries**
- Test queries on a single study first before batch operations
- Use transactions for complex operations:
  ```sql
  BEGIN;
  -- your queries here
  COMMIT; -- or ROLLBACK if something looks wrong
  ```
