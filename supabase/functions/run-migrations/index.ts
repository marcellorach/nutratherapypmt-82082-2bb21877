import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MIGRATIONS = [
  {
    id: '001',
    name: 'Create dosage_protocols table',
    sql: `
-- Migration 001: Create dosage_protocols table
CREATE TABLE IF NOT EXISTS public.dosage_protocols (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nutraceutical_id UUID REFERENCES public.nutraceuticals(id) ON DELETE CASCADE NOT NULL,
    condition_id UUID REFERENCES public.chronic_diseases(id) ON DELETE CASCADE NOT NULL,
    
    -- Stratification factors
    weight_min_kg DECIMAL(5,2),
    weight_max_kg DECIMAL(5,2),
    age_min_years INTEGER,
    age_max_years INTEGER,
    breed_category TEXT CHECK (breed_category IN ('toy', 'small', 'medium', 'large', 'giant', 'any')),
    severity_level TEXT CHECK (severity_level IN ('mild', 'moderate', 'severe', 'any')),
    
    -- Dosage information
    dosage_amount DECIMAL(10,2) NOT NULL,
    dosage_unit TEXT NOT NULL CHECK (dosage_unit IN ('mg', 'g', 'ml', 'capsules', 'drops', 'IU')),
    frequency_per_day INTEGER NOT NULL DEFAULT 1,
    duration_days INTEGER,
    timing_instructions TEXT,
    
    -- Clinical modifiers
    comorbidity_adjustments JSONB DEFAULT '[]'::jsonb,
    drug_interaction_warnings JSONB DEFAULT '[]'::jsonb,
    
    -- Scientific backing
    evidence_level TEXT CHECK (evidence_level IN ('meta_analysis', 'rct', 'observational', 'case_study', 'expert_opinion')),
    studies_supporting INTEGER DEFAULT 0,
    confidence_score DECIMAL(3,2) CHECK (confidence_score BETWEEN 0 AND 5),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Ensure unique combinations
    UNIQUE(nutraceutical_id, condition_id, weight_min_kg, weight_max_kg, age_min_years, age_max_years, breed_category, severity_level)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_dosage_protocols_nutraceutical ON public.dosage_protocols(nutraceutical_id);
CREATE INDEX IF NOT EXISTS idx_dosage_protocols_condition ON public.dosage_protocols(condition_id);
CREATE INDEX IF NOT EXISTS idx_dosage_protocols_weight ON public.dosage_protocols(weight_min_kg, weight_max_kg);
CREATE INDEX IF NOT EXISTS idx_dosage_protocols_age ON public.dosage_protocols(age_min_years, age_max_years);

-- Enable RLS
ALTER TABLE public.dosage_protocols ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage all dosage protocols"
    ON public.dosage_protocols
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Veterinarians can view dosage protocols"
    ON public.dosage_protocols
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'veterinarian')
        )
    );
`
  },
  {
    id: '002',
    name: 'Create study_findings table',
    sql: `
-- Migration 002: Create study_findings table
CREATE TABLE IF NOT EXISTS public.study_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Study identification
    study_title TEXT NOT NULL,
    authors TEXT,
    journal TEXT,
    publication_year INTEGER,
    doi TEXT UNIQUE,
    pmid TEXT UNIQUE,
    study_type TEXT CHECK (study_type IN ('meta_analysis', 'systematic_review', 'rct', 'cohort', 'case_control', 'case_series', 'in_vitro', 'in_vivo')),
    
    -- Raw extracted content
    raw_text TEXT,
    pdf_url TEXT,
    extraction_method TEXT CHECK (extraction_method IN ('manual', 'ai_assisted', 'fully_automated')),
    
    -- Nutraceutical and condition associations
    nutraceuticals_mentioned JSONB DEFAULT '[]'::jsonb,
    conditions_mentioned JSONB DEFAULT '[]'::jsonb,
    
    -- Sample characteristics
    sample_size INTEGER,
    species TEXT DEFAULT 'canine',
    breed_distribution JSONB DEFAULT '{}'::jsonb,
    age_range_years TEXT,
    weight_range_kg TEXT,
    
    -- Outcomes
    primary_outcomes JSONB DEFAULT '[]'::jsonb,
    secondary_outcomes JSONB DEFAULT '[]'::jsonb,
    adverse_events JSONB DEFAULT '[]'::jsonb,
    
    -- Dosage protocols extracted
    dosage_protocols_found JSONB DEFAULT '[]'::jsonb,
    
    -- Quality assessment
    quality_score DECIMAL(3,2) CHECK (quality_score BETWEEN 0 AND 5),
    bias_risk TEXT CHECK (bias_risk IN ('low', 'moderate', 'high', 'unclear')),
    evidence_strength TEXT CHECK (evidence_strength IN ('strong', 'moderate', 'weak', 'insufficient')),
    
    -- Safety data
    contraindications JSONB DEFAULT '[]'::jsonb,
    drug_interactions JSONB DEFAULT '[]'::jsonb,
    
    -- Curation workflow
    curation_status TEXT DEFAULT 'pending' CHECK (curation_status IN ('pending', 'in_review', 'approved', 'rejected', 'needs_revision')),
    curated_by UUID REFERENCES auth.users(id),
    curated_at TIMESTAMPTZ,
    curator_notes TEXT,
    
    -- AI processing metadata
    ai_confidence_score DECIMAL(3,2) CHECK (ai_confidence_score BETWEEN 0 AND 1),
    ai_processing_version TEXT,
    ai_flags JSONB DEFAULT '[]'::jsonb,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    uploaded_by UUID REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_study_findings_doi ON public.study_findings(doi) WHERE doi IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_study_findings_pmid ON public.study_findings(pmid) WHERE pmid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_study_findings_curation_status ON public.study_findings(curation_status);
CREATE INDEX IF NOT EXISTS idx_study_findings_publication_year ON public.study_findings(publication_year);
CREATE INDEX IF NOT EXISTS idx_study_findings_quality_score ON public.study_findings(quality_score);

-- GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_study_findings_nutraceuticals ON public.study_findings USING GIN (nutraceuticals_mentioned);
CREATE INDEX IF NOT EXISTS idx_study_findings_conditions ON public.study_findings USING GIN (conditions_mentioned);

-- Enable RLS
ALTER TABLE public.study_findings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage all study findings"
    ON public.study_findings
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Veterinarians can view approved study findings"
    ON public.study_findings
    FOR SELECT
    TO authenticated
    USING (
        curation_status = 'approved'
        AND EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'veterinarian')
        )
    );
`
  },
  {
    id: '003',
    name: 'Enrich nutraceutical_conditions',
    sql: `
-- Migration 003: Enrich nutraceutical_conditions table with advanced scientific metadata
DO $$
BEGIN
    -- Add study convergence analysis
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nutraceutical_conditions' AND column_name = 'study_count') THEN
        ALTER TABLE public.nutraceutical_conditions ADD COLUMN study_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nutraceutical_conditions' AND column_name = 'convergence_score') THEN
        ALTER TABLE public.nutraceutical_conditions ADD COLUMN convergence_score DECIMAL(3,2) CHECK (convergence_score BETWEEN 0 AND 5);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nutraceutical_conditions' AND column_name = 'meta_analysis_available') THEN
        ALTER TABLE public.nutraceutical_conditions ADD COLUMN meta_analysis_available BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add sample characteristics aggregation
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nutraceutical_conditions' AND column_name = 'typical_sample_size_range') THEN
        ALTER TABLE public.nutraceutical_conditions ADD COLUMN typical_sample_size_range TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nutraceutical_conditions' AND column_name = 'breeds_studied') THEN
        ALTER TABLE public.nutraceutical_conditions ADD COLUMN breeds_studied JSONB DEFAULT '[]'::jsonb;
    END IF;

    -- Add safety profile
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nutraceutical_conditions' AND column_name = 'safety_score') THEN
        ALTER TABLE public.nutraceutical_conditions ADD COLUMN safety_score DECIMAL(3,2) CHECK (safety_score BETWEEN 0 AND 5);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nutraceutical_conditions' AND column_name = 'common_adverse_events') THEN
        ALTER TABLE public.nutraceutical_conditions ADD COLUMN common_adverse_events JSONB DEFAULT '[]'::jsonb;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nutraceutical_conditions' AND column_name = 'contraindication_summary') THEN
        ALTER TABLE public.nutraceutical_conditions ADD COLUMN contraindication_summary TEXT;
    END IF;

    -- Add curation metadata
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nutraceutical_conditions' AND column_name = 'last_curated_at') THEN
        ALTER TABLE public.nutraceutical_conditions ADD COLUMN last_curated_at TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nutraceutical_conditions' AND column_name = 'last_curated_by') THEN
        ALTER TABLE public.nutraceutical_conditions ADD COLUMN last_curated_by UUID REFERENCES auth.users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nutraceutical_conditions' AND column_name = 'curation_notes') THEN
        ALTER TABLE public.nutraceutical_conditions ADD COLUMN curation_notes TEXT;
    END IF;
END $$;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_nutraceutical_conditions_study_count ON public.nutraceutical_conditions(study_count);
CREATE INDEX IF NOT EXISTS idx_nutraceutical_conditions_convergence ON public.nutraceutical_conditions(convergence_score);
CREATE INDEX IF NOT EXISTS idx_nutraceutical_conditions_safety ON public.nutraceutical_conditions(safety_score);
CREATE INDEX IF NOT EXISTS idx_nutraceutical_conditions_meta_analysis ON public.nutraceutical_conditions(meta_analysis_available);
CREATE INDEX IF NOT EXISTS idx_nutraceutical_conditions_breeds ON public.nutraceutical_conditions USING GIN (breeds_studied);
`
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🚀 Iniciando execução automática das migrations...');
    
    const results = [];
    
    for (const migration of MIGRATIONS) {
      console.log(`\n📋 Processando Migration ${migration.id}: ${migration.name}`);
      
      // Verificar se a migration já foi aplicada verificando se as tabelas/colunas existem
      let alreadyApplied = false;
      
      try {
        if (migration.id === '001') {
          // Verificar se dosage_protocols existe
          const { error } = await supabase.from('dosage_protocols').select('id').limit(1);
          alreadyApplied = !error || !error.message.includes('relation');
        } else if (migration.id === '002') {
          // Verificar se study_findings existe
          const { error } = await supabase.from('study_findings').select('id').limit(1);
          alreadyApplied = !error || !error.message.includes('relation');
        } else if (migration.id === '003') {
          // Verificar se colunas foram adicionadas
          const { error } = await supabase.from('nutraceutical_conditions').select('study_convergence_count').limit(1);
          alreadyApplied = !error;
        }
        
        if (alreadyApplied) {
          console.log(`✅ Migration ${migration.id} já foi aplicada anteriormente`);
          results.push({
            id: migration.id,
            name: migration.name,
            success: true,
            message: 'Já aplicada anteriormente',
            timestamp: new Date().toISOString()
          });
        } else {
          console.log(`⚠️ Migration ${migration.id} precisa ser aplicada manualmente no SQL Editor`);
          results.push({
            id: migration.id,
            name: migration.name,
            success: false,
            message: 'Execute manualmente no SQL Editor do Supabase',
            sqlRequired: true,
            timestamp: new Date().toISOString()
          });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`❌ Erro ao verificar Migration ${migration.id}:`, err);
        results.push({
          id: migration.id,
          name: migration.name,
          success: false,
          error: errorMessage,
          timestamp: new Date().toISOString()
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    console.log(`\n📊 Resumo: ${successCount}/${totalCount} migrations executadas com sucesso`);

    return new Response(
      JSON.stringify({
        success: successCount === totalCount,
        results,
        summary: {
          total: totalCount,
          successful: successCount,
          failed: totalCount - successCount
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: successCount === totalCount ? 200 : 207 // 207 Multi-Status for partial success
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Erro fatal:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
