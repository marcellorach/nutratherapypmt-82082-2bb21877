
-- Adicionar colunas de controle de dados às tabelas existentes
ALTER TABLE nutraceuticals 
ADD COLUMN data_type TEXT DEFAULT 'production' CHECK (data_type IN ('mock', 'seed', 'production', 'import')),
ADD COLUMN batch_id TEXT DEFAULT NULL;

ALTER TABLE scientific_studies 
ADD COLUMN data_type TEXT DEFAULT 'production' CHECK (data_type IN ('mock', 'seed', 'production', 'import')),
ADD COLUMN batch_id TEXT DEFAULT NULL;

ALTER TABLE health_conditions 
ADD COLUMN data_type TEXT DEFAULT 'production' CHECK (data_type IN ('mock', 'seed', 'production', 'import')),
ADD COLUMN batch_id TEXT DEFAULT NULL;

ALTER TABLE nutraceutical_conditions 
ADD COLUMN data_type TEXT DEFAULT 'production' CHECK (data_type IN ('mock', 'seed', 'production', 'import')),
ADD COLUMN batch_id TEXT DEFAULT NULL;

ALTER TABLE nutraceutical_studies 
ADD COLUMN data_type TEXT DEFAULT 'production' CHECK (data_type IN ('mock', 'seed', 'production', 'import')),
ADD COLUMN batch_id TEXT DEFAULT NULL;

ALTER TABLE nutraceutical_scientific_metadata 
ADD COLUMN data_type TEXT DEFAULT 'production' CHECK (data_type IN ('mock', 'seed', 'production', 'import')),
ADD COLUMN batch_id TEXT DEFAULT NULL;

-- Criar tabela para gerenciar configurações do sistema de dados
CREATE TABLE data_management_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Inserir configurações padrão
INSERT INTO data_management_settings (setting_key, setting_value, description) VALUES
('data_mode', 'hybrid', 'Modo de dados: hybrid (mock + supabase), production (só supabase), development (mock priority)'),
('use_seed_data', 'true', 'Se deve incluir dados de seed nas consultas'),
('current_seed_batch', '', 'ID do lote atual de dados seed'),
('auto_cleanup_seeds', 'false', 'Se deve limpar automaticamente dados seed antigos');

-- Adicionar RLS para a nova tabela
ALTER TABLE data_management_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso público para visualização configurações" ON data_management_settings
FOR SELECT USING (true);

CREATE POLICY "Acesso público para atualização configurações" ON data_management_settings
FOR UPDATE USING (true);

CREATE POLICY "Acesso público para inserção configurações" ON data_management_settings
FOR INSERT WITH CHECK (true);

-- Criar função para limpar dados seed
CREATE OR REPLACE FUNCTION clean_seed_data(batch_id_param TEXT DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
    result_text TEXT := '';
    deleted_count INTEGER := 0;
    total_deleted INTEGER := 0;
BEGIN
    -- Limpar nutraceuticals
    IF batch_id_param IS NULL THEN
        DELETE FROM nutraceuticals WHERE data_type = 'seed';
    ELSE
        DELETE FROM nutraceuticals WHERE data_type = 'seed' AND batch_id = batch_id_param;
    END IF;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    total_deleted := total_deleted + deleted_count;
    result_text := result_text || 'Nutracêuticos: ' || deleted_count || ' removidos. ';
    
    -- Limpar scientific_studies
    IF batch_id_param IS NULL THEN
        DELETE FROM scientific_studies WHERE data_type = 'seed';
    ELSE
        DELETE FROM scientific_studies WHERE data_type = 'seed' AND batch_id = batch_id_param;
    END IF;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    total_deleted := total_deleted + deleted_count;
    result_text := result_text || 'Estudos: ' || deleted_count || ' removidos. ';
    
    -- Limpar health_conditions
    IF batch_id_param IS NULL THEN
        DELETE FROM health_conditions WHERE data_type = 'seed';
    ELSE
        DELETE FROM health_conditions WHERE data_type = 'seed' AND batch_id = batch_id_param;
    END IF;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    total_deleted := total_deleted + deleted_count;
    result_text := result_text || 'Condições: ' || deleted_count || ' removidas. ';
    
    -- Limpar relacionamentos
    IF batch_id_param IS NULL THEN
        DELETE FROM nutraceutical_conditions WHERE data_type = 'seed';
        DELETE FROM nutraceutical_studies WHERE data_type = 'seed';
        DELETE FROM nutraceutical_scientific_metadata WHERE data_type = 'seed';
    ELSE
        DELETE FROM nutraceutical_conditions WHERE data_type = 'seed' AND batch_id = batch_id_param;
        DELETE FROM nutraceutical_studies WHERE data_type = 'seed' AND batch_id = batch_id_param;
        DELETE FROM nutraceutical_scientific_metadata WHERE data_type = 'seed' AND batch_id = batch_id_param;
    END IF;
    
    result_text := result_text || 'Total de ' || total_deleted || ' registros principais removidos.';
    
    RETURN result_text;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_data_management_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_data_management_settings_updated_at
    BEFORE UPDATE ON data_management_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_data_management_settings_updated_at();
