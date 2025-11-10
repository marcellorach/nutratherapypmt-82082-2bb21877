# Database Migrations para Análise Individualizada por IA

## Visão Geral

Este documento descreve as migrations necessárias para implementar o sistema de análise individualizada por IA, incluindo protocolos de dosagem estratificados e extração estruturada de estudos científicos.

## Como Executar

### Opção 1: Interface Administrativa (Recomendado para desenvolvimento)

1. Acesse a área administrativa do aplicativo
2. Navegue até a tab "Database Migrations"
3. Execute cada migration clicando no botão "Executar Migration"

### Opção 2: Supabase SQL Editor (Recomendado para produção)

1. Acesse o Supabase Dashboard
2. Vá para Database → SQL Editor
3. Copie e cole cada SQL abaixo
4. Execute em ordem (001 → 002 → 003)

## Migration 001: Create dosage_protocols table

**Propósito:** Cria tabela para armazenar protocolos de dosagem estratificados por características do paciente (peso, idade, raça).

**Arquivo:** `supabase/migrations/20250111000001_create_dosage_protocols.sql`

```sql
-- Create dosage_protocols table for stratified dosage information
CREATE TABLE IF NOT EXISTS public.dosage_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nutraceutical_id UUID NOT NULL REFERENCES public.nutraceuticals(id) ON DELETE CASCADE,
  condition_id UUID NOT NULL REFERENCES public.health_conditions(id) ON DELETE CASCADE,
  
  -- Stratification fields
  weight_min_kg DECIMAL(6,2),
  weight_max_kg DECIMAL(6,2),
  breed_specific TEXT[], -- Array of specific breeds if applicable
  age_min_years DECIMAL(4,1),
  age_max_years DECIMAL(4,1),
  
  -- Dosage information
  dosage_amount DECIMAL(10,2) NOT NULL,
  dosage_unit TEXT NOT NULL, -- 'mg', 'ml', 'g', 'mcg', etc.
  frequency_per_day INTEGER NOT NULL DEFAULT 1,
  administration_route TEXT, -- 'oral', 'topical', 'injection', etc.
  duration_days INTEGER, -- Recommended treatment duration
  
  -- Clinical modifiers
  severity_modifier TEXT, -- 'mild', 'moderate', 'severe'
  titration_protocol TEXT, -- Instructions for gradual dose adjustments
  
  -- Scientific backing
  based_on_study_ids UUID[], -- Array of study IDs that support this protocol
  confidence_level TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  last_reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  
  -- Constraints
  CONSTRAINT valid_weight_range CHECK (weight_min_kg IS NULL OR weight_max_kg IS NULL OR weight_min_kg <= weight_max_kg),
  CONSTRAINT valid_age_range CHECK (age_min_years IS NULL OR age_max_years IS NULL OR age_min_years <= age_max_years),
  CONSTRAINT valid_dosage CHECK (dosage_amount > 0),
  CONSTRAINT valid_frequency CHECK (frequency_per_day > 0),
  CONSTRAINT valid_confidence CHECK (confidence_level IN ('low', 'medium', 'high')),
  CONSTRAINT valid_severity CHECK (severity_modifier IS NULL OR severity_modifier IN ('mild', 'moderate', 'severe'))
);

-- Create indexes for efficient queries
CREATE INDEX idx_dosage_protocols_nutraceutical ON public.dosage_protocols(nutraceutical_id);
CREATE INDEX idx_dosage_protocols_condition ON public.dosage_protocols(condition_id);
CREATE INDEX idx_dosage_protocols_weight ON public.dosage_protocols(weight_min_kg, weight_max_kg);
CREATE INDEX idx_dosage_protocols_active ON public.dosage_protocols(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.dosage_protocols ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admin full access on dosage_protocols"
  ON public.dosage_protocols
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Veterinarians can view dosage_protocols"
  ON public.dosage_protocols
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'veterinarian')
    )
  );
```

## Migration 002: Create study_findings table

**Propósito:** Cria tabela para extração estruturada de dados de estudos científicos, permitindo curadoria manual rigorosa.

**Arquivo:** `supabase/migrations/20250111000002_create_study_findings.sql`

```sql
-- Create study_findings table for structured scientific data extraction
CREATE TABLE IF NOT EXISTS public.study_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  study_id UUID NOT NULL REFERENCES public.scientific_studies(id) ON DELETE CASCADE,
  nutraceutical_id UUID NOT NULL REFERENCES public.nutraceuticals(id) ON DELETE CASCADE,
  condition_id UUID REFERENCES public.health_conditions(id) ON DELETE SET NULL,
  
  -- Study protocol details
  dosage_tested TEXT NOT NULL, -- Exact dosage used in the study
  protocol_duration_days INTEGER, -- How long was the treatment
  administration_route TEXT, -- How was it administered
  
  -- Study characteristics
  sample_size INTEGER NOT NULL,
  species TEXT NOT NULL, -- 'canine', 'feline', 'equine', etc.
  breed_distribution TEXT[], -- Breeds studied if specified
  age_range_years TEXT, -- e.g., "5-12" or "adult"
  
  -- Measured outcomes
  outcome_measured TEXT NOT NULL, -- What was measured (e.g., "pain reduction", "liver enzymes")
  effect_size DECIMAL(8,4), -- Statistical effect size (Cohen's d, etc.)
  p_value DECIMAL(10,8), -- Statistical significance
  confidence_interval_lower DECIMAL(10,4),
  confidence_interval_upper DECIMAL(10,4),
  
  -- Study quality assessment
  study_type TEXT NOT NULL, -- 'RCT', 'observational', 'case-control', 'cohort', 'case-report'
  study_quality_score INTEGER, -- 0-10 quality rating
  blinding TEXT, -- 'double-blind', 'single-blind', 'open-label'
  placebo_controlled BOOLEAN DEFAULT false,
  
  -- Safety data
  adverse_events TEXT[], -- Array of adverse events reported
  dropout_rate DECIMAL(5,2), -- % of participants who dropped out
  
  -- Key findings
  conclusion TEXT NOT NULL, -- Brief summary of findings
  clinical_relevance TEXT, -- Practical implications
  limitations TEXT, -- Study limitations
  
  -- Curation metadata
  extracted_by UUID REFERENCES auth.users(id),
  extraction_date TIMESTAMPTZ DEFAULT NOW(),
  verified_by UUID REFERENCES auth.users(id),
  verification_date TIMESTAMPTZ,
  curation_status TEXT DEFAULT 'draft', -- 'draft', 'verified', 'published'
  extraction_confidence TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
  
  -- Standard metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_sample_size CHECK (sample_size > 0),
  CONSTRAINT valid_quality_score CHECK (study_quality_score IS NULL OR (study_quality_score >= 0 AND study_quality_score <= 10)),
  CONSTRAINT valid_p_value CHECK (p_value IS NULL OR (p_value >= 0 AND p_value <= 1)),
  CONSTRAINT valid_dropout CHECK (dropout_rate IS NULL OR (dropout_rate >= 0 AND dropout_rate <= 100)),
  CONSTRAINT valid_study_type CHECK (study_type IN ('RCT', 'observational', 'case-control', 'cohort', 'case-report', 'systematic-review', 'meta-analysis')),
  CONSTRAINT valid_curation_status CHECK (curation_status IN ('draft', 'verified', 'published', 'archived')),
  CONSTRAINT valid_extraction_confidence CHECK (extraction_confidence IN ('low', 'medium', 'high'))
);

-- Create indexes for efficient queries
CREATE INDEX idx_study_findings_study ON public.study_findings(study_id);
CREATE INDEX idx_study_findings_nutraceutical ON public.study_findings(nutraceutical_id);
CREATE INDEX idx_study_findings_condition ON public.study_findings(condition_id);
CREATE INDEX idx_study_findings_species ON public.study_findings(species);
CREATE INDEX idx_study_findings_status ON public.study_findings(curation_status);
CREATE INDEX idx_study_findings_quality ON public.study_findings(study_quality_score DESC) WHERE study_quality_score IS NOT NULL;

-- Enable RLS
ALTER TABLE public.study_findings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admin full access on study_findings"
  ON public.study_findings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Veterinarians can view published study_findings"
  ON public.study_findings
  FOR SELECT
  TO authenticated
  USING (
    (curation_status = 'published' AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'veterinarian')
    )) OR
    (EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    ))
  );
```

## Migration 003: Enrich nutraceutical_conditions

**Propósito:** Adiciona metadados científicos avançados à tabela `nutraceutical_conditions` para suportar análise rigorosa.

**Arquivo:** `supabase/migrations/20250111000003_enrich_nutraceutical_conditions.sql`

```sql
-- Enrich nutraceutical_conditions table with scientific metadata
-- Add new columns for enhanced scientific rigor

-- Study convergence and evidence quality
ALTER TABLE public.nutraceutical_conditions
  ADD COLUMN IF NOT EXISTS study_convergence_score DECIMAL(3,2) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS confidence_interval_lower DECIMAL(10,4),
  ADD COLUMN IF NOT EXISTS confidence_interval_upper DECIMAL(10,4);

-- Sample characteristics
ALTER TABLE public.nutraceutical_conditions
  ADD COLUMN IF NOT EXISTS sample_size_total INTEGER,
  ADD COLUMN IF NOT EXISTS species_distribution JSONB; -- {"canine": 150, "feline": 75}

-- Safety and interactions
ALTER TABLE public.nutraceutical_conditions
  ADD COLUMN IF NOT EXISTS contraindications_conditions TEXT[],
  ADD COLUMN IF NOT EXISTS interaction_warnings TEXT[],
  ADD COLUMN IF NOT EXISTS adverse_events_reported TEXT[];

-- Curation metadata
ALTER TABLE public.nutraceutical_conditions
  ADD COLUMN IF NOT EXISTS last_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS curation_status TEXT DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS evidence_quality TEXT DEFAULT 'medium';

-- Add constraints for new columns
ALTER TABLE public.nutraceutical_conditions
  ADD CONSTRAINT valid_convergence_score 
    CHECK (study_convergence_score IS NULL OR (study_convergence_score >= 0 AND study_convergence_score <= 1)),
  ADD CONSTRAINT valid_sample_size 
    CHECK (sample_size_total IS NULL OR sample_size_total > 0),
  ADD CONSTRAINT valid_curation_status_nc 
    CHECK (curation_status IN ('draft', 'reviewed', 'verified', 'published', 'archived')),
  ADD CONSTRAINT valid_evidence_quality 
    CHECK (evidence_quality IN ('very-low', 'low', 'medium', 'high', 'very-high'));

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_nutraceutical_conditions_convergence 
  ON public.nutraceutical_conditions(study_convergence_score DESC) 
  WHERE study_convergence_score IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_nutraceutical_conditions_status 
  ON public.nutraceutical_conditions(curation_status);

CREATE INDEX IF NOT EXISTS idx_nutraceutical_conditions_evidence 
  ON public.nutraceutical_conditions(evidence_quality);
```

## Validação Pós-Migration

Após executar todas as migrations, valide com as seguintes queries:

```sql
-- Verificar se tabelas foram criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('dosage_protocols', 'study_findings');

-- Verificar se colunas foram adicionadas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'nutraceutical_conditions' 
AND column_name IN ('study_convergence_score', 'contraindications_conditions', 'evidence_quality');

-- Verificar RLS policies
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('dosage_protocols', 'study_findings');
```

## Rollback (se necessário)

Se precisar reverter as migrations:

```sql
-- Rollback Migration 003
ALTER TABLE public.nutraceutical_conditions
  DROP COLUMN IF EXISTS study_convergence_score,
  DROP COLUMN IF EXISTS confidence_interval_lower,
  DROP COLUMN IF EXISTS confidence_interval_upper,
  DROP COLUMN IF EXISTS sample_size_total,
  DROP COLUMN IF EXISTS species_distribution,
  DROP COLUMN IF EXISTS contraindications_conditions,
  DROP COLUMN IF EXISTS interaction_warnings,
  DROP COLUMN IF EXISTS adverse_events_reported,
  DROP COLUMN IF EXISTS last_reviewed_at,
  DROP COLUMN IF EXISTS reviewed_by,
  DROP COLUMN IF EXISTS curation_status,
  DROP COLUMN IF EXISTS evidence_quality;

-- Rollback Migration 002
DROP TABLE IF EXISTS public.study_findings CASCADE;

-- Rollback Migration 001
DROP TABLE IF EXISTS public.dosage_protocols CASCADE;
```

## Próximos Passos

Após executar as migrations:
1. Regenerar tipos TypeScript do Supabase
2. Testar serviços de dosage_protocols e study_findings
3. Popular com dados de demonstração Stanford
4. Validar interface de curadoria

## Suporte

Para problemas com migrations:
- Verifique logs do Supabase
- Confirme que usuário tem permissões adequadas
- Execute migrations manualmente via SQL Editor se necessário
