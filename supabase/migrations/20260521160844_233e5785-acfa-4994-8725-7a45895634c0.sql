
-- ============================================================
-- Fase 1: Governança de modelos AI por tarefa
-- ============================================================

-- 1) Versões de prompt por tarefa+modelo
CREATE TABLE public.ai_prompt_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id TEXT NOT NULL,
  model_id TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  system_prompt TEXT,
  user_prompt TEXT,
  optimized_for_model BOOLEAN NOT NULL DEFAULT false,
  optimization_notes TEXT,
  highlighted_segments JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT false,
  source TEXT NOT NULL DEFAULT 'manual',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_apv_task_active ON public.ai_prompt_versions (task_id, is_active);
CREATE INDEX idx_apv_task_model_version ON public.ai_prompt_versions (task_id, model_id, version DESC);
CREATE UNIQUE INDEX idx_apv_task_model_version_unique
  ON public.ai_prompt_versions (task_id, COALESCE(model_id, ''), version);

ALTER TABLE public.ai_prompt_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage ai_prompt_versions"
  ON public.ai_prompt_versions
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TRIGGER trg_apv_updated_at
  BEFORE UPDATE ON public.ai_prompt_versions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Execuções de teste manual
CREATE TABLE public.ai_prompt_test_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id TEXT NOT NULL,
  prompt_version_id UUID REFERENCES public.ai_prompt_versions(id) ON DELETE SET NULL,
  model_id TEXT NOT NULL,
  input_text TEXT,
  output_text TEXT,
  latency_ms INTEGER,
  tokens_in INTEGER,
  tokens_out INTEGER,
  cost_estimate NUMERIC(10,6),
  error TEXT,
  run_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_aptr_task_created ON public.ai_prompt_test_runs (task_id, created_at DESC);

ALTER TABLE public.ai_prompt_test_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage ai_prompt_test_runs"
  ON public.ai_prompt_test_runs
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 3) Radar de modelos descobertos
CREATE TABLE public.ai_model_radar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL,
  model_id TEXT NOT NULL,
  display_name TEXT,
  discovered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  capabilities JSONB NOT NULL DEFAULT '{}'::jsonb,
  context_window INTEGER,
  pricing JSONB NOT NULL DEFAULT '{}'::jsonb,
  suggested_for_tasks TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'new',
  recommendation_note TEXT,
  dismissed_reason TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_amr_provider_model ON public.ai_model_radar (provider, model_id);
CREATE INDEX idx_amr_status ON public.ai_model_radar (status, discovered_at DESC);

ALTER TABLE public.ai_model_radar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage ai_model_radar"
  ON public.ai_model_radar
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TRIGGER trg_amr_updated_at
  BEFORE UPDATE ON public.ai_model_radar
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Validação de status (via trigger, não CHECK, para flexibilidade futura)
CREATE OR REPLACE FUNCTION public.validate_ai_model_radar_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status NOT IN ('new','review','adopted','dismissed') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_amr_validate_status
  BEFORE INSERT OR UPDATE ON public.ai_model_radar
  FOR EACH ROW EXECUTE FUNCTION public.validate_ai_model_radar_status();
