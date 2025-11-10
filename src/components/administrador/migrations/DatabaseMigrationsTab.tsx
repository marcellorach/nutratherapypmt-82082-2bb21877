import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

const MIGRATIONS = [
  {
    id: '001',
    name: 'Create dosage_protocols table',
    description: 'Tabela para protocolos de dosagem estratificados por peso/idade/raça com instruções para IA',
    sql: `-- Migration 001: Create dosage_protocols table
CREATE TABLE IF NOT EXISTS public.dosage_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nutraceutical_id UUID NOT NULL REFERENCES public.nutraceuticals(id) ON DELETE CASCADE,
  condition_id UUID NOT NULL REFERENCES public.health_conditions(id) ON DELETE CASCADE,
  
  -- Stratification criteria
  weight_min_kg DECIMAL(5,2),
  weight_max_kg DECIMAL(5,2),
  breed_specific TEXT[],
  age_min_years DECIMAL(4,1),
  age_max_years DECIMAL(4,1),
  
  -- Dosage information
  dosage_amount DECIMAL(10,2) NOT NULL,
  dosage_unit TEXT NOT NULL,
  frequency_per_day INTEGER NOT NULL,
  administration_route TEXT,
  duration_days INTEGER,
  
  -- Clinical modifiers
  severity_modifier TEXT CHECK (severity_modifier IN ('mild', 'moderate', 'severe')),
  titration_protocol TEXT,
  ai_clinical_guidance TEXT,
  
  -- Scientific backing
  based_on_study_ids UUID[],
  confidence_level TEXT NOT NULL CHECK (confidence_level IN ('low', 'medium', 'high')),
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  last_reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Constraints
  CONSTRAINT valid_weight_range CHECK (weight_min_kg IS NULL OR weight_max_kg IS NULL OR weight_min_kg <= weight_max_kg),
  CONSTRAINT valid_age_range CHECK (age_min_years IS NULL OR age_max_years IS NULL OR age_min_years <= age_max_years),
  CONSTRAINT positive_dosage CHECK (dosage_amount > 0),
  CONSTRAINT positive_frequency CHECK (frequency_per_day > 0)
);

CREATE INDEX IF NOT EXISTS idx_dosage_protocols_nutraceutical ON public.dosage_protocols(nutraceutical_id);
CREATE INDEX IF NOT EXISTS idx_dosage_protocols_condition ON public.dosage_protocols(condition_id);
CREATE INDEX IF NOT EXISTS idx_dosage_protocols_active ON public.dosage_protocols(is_active);

ALTER TABLE public.dosage_protocols ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Admins have full access to dosage_protocols"
  ON public.dosage_protocols FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY IF NOT EXISTS "Veterinarians can read dosage_protocols"
  ON public.dosage_protocols FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'veterinarian')));

COMMENT ON TABLE public.dosage_protocols IS 'Stratified dosage protocols for individualized AI analysis';
COMMENT ON COLUMN public.dosage_protocols.ai_clinical_guidance IS 'Natural language instructions for AI to consider when recommending this protocol';`
  },
  {
    id: '002',
    name: 'Create study_findings table',
    description: 'Tabela para extração estruturada de dados científicos com curadoria rigorosa',
    sql: `-- Migration 002: Create study_findings table
DO $$ BEGIN
  CREATE TYPE public.study_type AS ENUM ('RCT', 'observational', 'case-control', 'cohort', 'case-report', 'systematic-review', 'meta-analysis');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.curation_status AS ENUM ('draft', 'verified', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.extraction_confidence AS ENUM ('low', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.blinding_type AS ENUM ('double-blind', 'single-blind', 'open-label');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.study_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  study_id UUID NOT NULL REFERENCES public.scientific_studies(id) ON DELETE CASCADE,
  nutraceutical_id UUID NOT NULL REFERENCES public.nutraceuticals(id) ON DELETE CASCADE,
  condition_id UUID REFERENCES public.health_conditions(id) ON DELETE SET NULL,
  
  -- Study protocol
  dosage_tested TEXT NOT NULL,
  protocol_duration_days INTEGER,
  administration_route TEXT,
  
  -- Study characteristics
  sample_size INTEGER NOT NULL,
  species TEXT NOT NULL,
  breed_distribution TEXT[],
  age_range_years TEXT,
  
  -- Outcomes
  outcome_measured TEXT NOT NULL,
  effect_size DECIMAL(10,4),
  p_value DECIMAL(10,8),
  confidence_interval_lower DECIMAL(10,4),
  confidence_interval_upper DECIMAL(10,4),
  
  -- Quality assessment
  study_type public.study_type NOT NULL,
  study_quality_score INTEGER CHECK (study_quality_score >= 0 AND study_quality_score <= 10),
  blinding public.blinding_type,
  placebo_controlled BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Safety
  adverse_events TEXT[],
  dropout_rate DECIMAL(5,2),
  
  -- Findings
  conclusion TEXT NOT NULL,
  clinical_relevance TEXT,
  limitations TEXT,
  
  -- Curation metadata
  extracted_by UUID REFERENCES auth.users(id),
  extraction_date TIMESTAMPTZ DEFAULT NOW(),
  verified_by UUID REFERENCES auth.users(id),
  verification_date TIMESTAMPTZ,
  curation_status public.curation_status NOT NULL DEFAULT 'draft',
  extraction_confidence public.extraction_confidence NOT NULL,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT positive_sample_size CHECK (sample_size > 0),
  CONSTRAINT valid_p_value CHECK (p_value IS NULL OR (p_value >= 0 AND p_value <= 1)),
  CONSTRAINT valid_dropout_rate CHECK (dropout_rate IS NULL OR (dropout_rate >= 0 AND dropout_rate <= 100))
);

CREATE INDEX IF NOT EXISTS idx_study_findings_study ON public.study_findings(study_id);
CREATE INDEX IF NOT EXISTS idx_study_findings_nutraceutical ON public.study_findings(nutraceutical_id);
CREATE INDEX IF NOT EXISTS idx_study_findings_condition ON public.study_findings(condition_id);
CREATE INDEX IF NOT EXISTS idx_study_findings_status ON public.study_findings(curation_status);

ALTER TABLE public.study_findings ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Admins have full access to study_findings"
  ON public.study_findings FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY IF NOT EXISTS "Veterinarians can read published study_findings"
  ON public.study_findings FOR SELECT TO authenticated
  USING (curation_status = 'published' AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'veterinarian')));

COMMENT ON TABLE public.study_findings IS 'Structured extraction of scientific study data for rigorous manual curation';`
  },
  {
    id: '003',
    name: 'Enrich nutraceutical_conditions',
    description: 'Adicionar metadados científicos avançados para análise individualizada',
    sql: `-- Migration 003: Enrich nutraceutical_conditions table
ALTER TABLE public.nutraceutical_conditions
  ADD COLUMN IF NOT EXISTS study_convergence_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS weighted_effect_size DECIMAL(10,4),
  ADD COLUMN IF NOT EXISTS meta_analysis_grade TEXT,
  ADD COLUMN IF NOT EXISTS sample_characteristics JSONB,
  ADD COLUMN IF NOT EXISTS safety_profile JSONB,
  ADD COLUMN IF NOT EXISTS clinical_context TEXT,
  ADD COLUMN IF NOT EXISTS dosage_guidance TEXT,
  ADD COLUMN IF NOT EXISTS last_curated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS curated_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS curation_confidence TEXT CHECK (curation_confidence IN ('low', 'medium', 'high'));

ALTER TABLE public.nutraceutical_conditions
  ADD CONSTRAINT IF NOT EXISTS valid_study_convergence CHECK (study_convergence_count >= 0);

CREATE INDEX IF NOT EXISTS idx_nutraceutical_conditions_convergence ON public.nutraceutical_conditions(study_convergence_count);
CREATE INDEX IF NOT EXISTS idx_nutraceutical_conditions_curation ON public.nutraceutical_conditions(last_curated_at);

COMMENT ON COLUMN public.nutraceutical_conditions.study_convergence_count IS 'Number of high-quality studies supporting this relationship';
COMMENT ON COLUMN public.nutraceutical_conditions.sample_characteristics IS 'Aggregated sample characteristics from studies (breeds, ages, etc.)';`
  }
];

export default function DatabaseMigrationsTab() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, migrationId: string) => {
    navigator.clipboard.writeText(text);
    setCopied(migrationId);
    toast({
      title: "SQL copiado",
      description: "Cole no SQL Editor do Supabase"
    });
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Database Migrations</h2>
        <p className="text-muted-foreground">
          Sistema de Análise Individualizada por IA - Infraestrutura de dados
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Instruções:</strong> Execute estas migrations no SQL Editor do Supabase na ordem apresentada.
          Após executar todas, clique em "Cloud" → "Database" → "Generate Types" para atualizar os tipos TypeScript.
        </AlertDescription>
      </Alert>

      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={() => window.open('https://supabase.com/dashboard/project/_/sql', '_blank')}
          className="gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          Abrir SQL Editor
        </Button>
        <Button
          variant="outline"
          onClick={() => window.open('/administrador?tab=knowledge-base-settings', '_self')}
          className="gap-2"
        >
          Regenerar Tipos
        </Button>
      </div>

      <Tabs defaultValue={MIGRATIONS[0].id} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {MIGRATIONS.map((migration) => (
            <TabsTrigger key={migration.id} value={migration.id}>
              Migration {migration.id}
            </TabsTrigger>
          ))}
        </TabsList>

        {MIGRATIONS.map((migration) => (
          <TabsContent key={migration.id} value={migration.id} className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{migration.name}</CardTitle>
                    <CardDescription className="mt-2">{migration.description}</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(migration.sql, migration.id)}
                    className="gap-2"
                  >
                    {copied === migration.id ? (
                      <><CheckCircle2 className="h-4 w-4 text-green-600" /> Copiado</>
                    ) : (
                      <><Copy className="h-4 w-4" /> Copiar SQL</>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{migration.sql}</code>
                </pre>
              </CardContent>
            </Card>

            <Alert>
              <AlertDescription>
                <strong>Após executar:</strong> Verifique no SQL Editor se a migration foi aplicada sem erros antes de prosseguir para a próxima.
              </AlertDescription>
            </Alert>
          </TabsContent>
        ))}
      </Tabs>

      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="text-lg">Próximos Passos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">Após executar todas as migrations:</p>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Regenere os tipos TypeScript do Supabase</li>
            <li>Os serviços de dosagem e study findings serão criados automaticamente</li>
            <li>As interfaces de curadoria estarão disponíveis no Gerenciamento de Nutracêuticos</li>
            <li>Dados de demonstração Stanford serão populados</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
