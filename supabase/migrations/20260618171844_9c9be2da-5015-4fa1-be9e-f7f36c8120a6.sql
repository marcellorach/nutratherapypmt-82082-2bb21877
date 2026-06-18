
-- 1) Snapshots históricos do inventário
CREATE TABLE IF NOT EXISTS public.ai_model_inventory_snapshots (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  captured_at timestamptz NOT NULL DEFAULT now(),
  source      text NOT NULL DEFAULT 'manual',
  snapshot    jsonb NOT NULL,
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

GRANT SELECT, INSERT ON public.ai_model_inventory_snapshots TO authenticated;
GRANT ALL ON public.ai_model_inventory_snapshots TO service_role;

ALTER TABLE public.ai_model_inventory_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read inventory snapshots"
  ON public.ai_model_inventory_snapshots FOR SELECT
  TO authenticated USING (public.is_admin());

CREATE POLICY "Admins insert inventory snapshots"
  ON public.ai_model_inventory_snapshots FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

-- 2) Aliases por tarefa
CREATE TABLE IF NOT EXISTS public.ai_task_aliases (
  task_id         text PRIMARY KEY,
  real_model      text NOT NULL,
  alias_label_pt  text NOT NULL,
  alias_label_en  text NOT NULL,
  description     text,
  updated_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ai_task_aliases TO authenticated;
GRANT ALL    ON public.ai_task_aliases TO service_role;

ALTER TABLE public.ai_task_aliases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read aliases"
  ON public.ai_task_aliases FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins insert aliases"
  ON public.ai_task_aliases FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "Admins update aliases"
  ON public.ai_task_aliases FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins delete aliases"
  ON public.ai_task_aliases FOR DELETE
  TO authenticated USING (public.is_admin());

CREATE TRIGGER trg_ai_task_aliases_updated_at
  BEFORE UPDATE ON public.ai_task_aliases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Seed inicial
INSERT INTO public.ai_task_aliases (task_id, real_model, alias_label_pt, alias_label_en, description) VALUES
  ('extraction_stage1',        'google/gemini-3-pro-preview',   'Modelo de Extração A',                'Extraction Model A',           'Estágio 1 — entidades biomédicas'),
  ('extraction_stage2',        'google/gemini-3-pro-preview',   'Modelo de Extração B',                'Extraction Model B',           'Estágio 2 — relações'),
  ('extraction_stage3',        'google/gemini-3-pro-preview',   'Modelo de Extração C',                'Extraction Model C',           'Estágio 3 — qualificadores'),
  ('triplet_extraction',       'google/gemini-2.5-pro',         'Modelo de Triplets A',                'Triplet Model A',              'Pipeline consolidado de triplets'),
  ('triplet_enrichment',       'google/gemini-2.5-pro',         'Modelo de Enriquecimento A',          'Enrichment Model A',           'Enriquecimento retroativo de triplets'),
  ('meta_study_analysis',      'openai/gpt-5.4',                'Modelo de Meta-análise',              'Meta-analysis Model',          'Comparação contra Regras-Core'),
  ('relations_auditor',        'openai/gpt-5.4',                'Modelo de Auditoria de Relações',     'Relations Auditor Model',      'Auditor conversacional do KG'),
  ('study_tagging',            'google/gemini-2.5-flash',       'Modelo de Classificação Rápida',      'Fast Classifier Model',        'Auto-tag de estudos'),
  ('geroprotector_stack',      'openai/gpt-5.4',                'Modelo Clínico A',                    'Clinical Model A',             'Stack geroprotetor'),
  ('lab_driven_adjustment',    'openai/gpt-5.4',                'Modelo Clínico B',                    'Clinical Model B',             'Ajuste por exames laboratoriais'),
  ('treatment_proposal_12m',   'openai/gpt-5.4',                'Modelo Clínico C',                    'Clinical Model C',             'Proposta de tratamento 12 meses'),
  ('trajectory_projection',    'openai/gpt-5.4',                'Modelo de Projeção',                  'Projection Model',             'Projeção de trajetória do pet'),
  ('clinical_data_extraction', 'google/gemini-2.5-pro',         'Modelo de Extração Clínica',          'Clinical Extraction Model',    'Conversão de texto livre clínico'),
  ('lab_pdf_parsing',          'google/gemini-2.5-pro',         'Modelo de Leitura de Exames',         'Lab PDF Reader',               'Parsing de PDF de exames'),
  ('kg_gap_fill',              'google/gemini-2.5-pro',         'Modelo de Preenchimento de KG',       'KG Gap-fill Model',            'Lacunas do Knowledge Graph'),
  ('clinical_chat_factual',    'google/gemini-2.5-pro',         'Modelo de Chat Factual',              'Factual Chat Model',           'Q&A factual sobre estudos'),
  ('clinical_chat_critical',   'openai/gpt-5.4',                'Modelo de Chat Crítico',              'Critical Chat Model',          'Segunda opinião adversarial'),
  ('translation_generic',      'google/gemini-2.5-flash',       'Modelo de Tradução Rápida',           'Fast Translation Model',       'Tradução PT/EN geral'),
  ('translation_conditions',   'google/gemini-2.5-pro',         'Modelo de Tradução Clínica',          'Clinical Translation Model',   'Tradução de condições clínicas'),
  ('taxonomy_suggestion',      'google/gemini-2.5-pro',         'Modelo de Taxonomia',                 'Taxonomy Model',               'Sugestão de termos SNOMED/UMLS'),
  ('dosage_web_lookup',        'google/gemini-2.5-pro',         'Modelo de Pesquisa de Dosagens',      'Dosage Research Model',        'Busca de dosagens em fontes web'),
  ('food_enrichment',          'google/gemini-2.5-pro',         'Modelo de Enriquecimento Nutricional','Nutrition Enrichment Model',   'Enriquecimento de produtos de ração'),
  ('spreadsheet_enrichment',   'google/gemini-2.5-pro',         'Modelo de Processamento em Lote',     'Batch Processing Model',       'Planilhas de nutracêuticos'),
  ('__embeddings__',           'google/gemini-embedding-001',   'Modelo de Embeddings',                'Embeddings Model',             'Vetorização de estudos (pgvector)'),
  ('__perplexity_search__',    'perplexity/sonar',              'Modelo de Pesquisa Externa',          'External Research Model',      'Perplexity / busca científica')
ON CONFLICT (task_id) DO NOTHING;
