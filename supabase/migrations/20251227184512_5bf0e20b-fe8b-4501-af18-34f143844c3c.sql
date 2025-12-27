-- ===========================================
-- Soft Delete + Auditoria para processed_studies
-- ===========================================

-- 1. Adicionar colunas de soft delete em processed_studies
ALTER TABLE processed_studies 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by UUID;

-- 2. Criar índice para consultas de soft delete
CREATE INDEX IF NOT EXISTS idx_processed_studies_deleted_at 
ON processed_studies(deleted_at) 
WHERE deleted_at IS NULL;

-- 3. Criar tabela de auditoria para ações em estudos
CREATE TABLE IF NOT EXISTS study_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action_type TEXT NOT NULL, -- 'delete', 'restore', 'update_status', 'bulk_delete'
  study_ids UUID[] NOT NULL,
  study_titles TEXT[],
  previous_status TEXT[],
  performed_by UUID,
  performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  notes TEXT
);

-- 4. Enable RLS
ALTER TABLE study_audit_logs ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS para study_audit_logs
CREATE POLICY "Admins can manage audit logs" 
ON study_audit_logs 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_roles.user_id = auth.uid() 
  AND user_roles.role = 'admin'
));

CREATE POLICY "Admins can view audit logs" 
ON study_audit_logs 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_roles.user_id = auth.uid() 
  AND user_roles.role = 'admin'
));

-- 6. Comentários para documentação
COMMENT ON COLUMN processed_studies.deleted_at IS 'Timestamp de soft delete. Se NULL, o registro está ativo.';
COMMENT ON COLUMN processed_studies.deleted_by IS 'UUID do usuário que executou o soft delete.';
COMMENT ON TABLE study_audit_logs IS 'Registro de auditoria para ações em estudos (delete, restore, bulk operations).';