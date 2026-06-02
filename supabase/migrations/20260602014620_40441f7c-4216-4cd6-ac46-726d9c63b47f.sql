-- Card #2: validation_status + abstained em ai_task_invocations
-- Permite distinguir ok / abstained / schema_fail / repair_ok / repair_fail
-- e habilita métricas de hallucination_rate vs abstention_rate.

ALTER TABLE public.ai_task_invocations
  ADD COLUMN IF NOT EXISTS validation_status text NULL,
  ADD COLUMN IF NOT EXISTS abstained boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS abstain_reason text NULL;

-- Constraint nomeada (idempotente via DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ai_task_invocations_validation_status_check'
  ) THEN
    ALTER TABLE public.ai_task_invocations
      ADD CONSTRAINT ai_task_invocations_validation_status_check
      CHECK (
        validation_status IS NULL
        OR validation_status IN ('ok','abstained','schema_fail','repair_ok','repair_fail')
      );
  END IF;
END $$;

-- Índices parciais para os dashboards de hallucination/abstention.
CREATE INDEX IF NOT EXISTS idx_ai_task_invocations_validation_status
  ON public.ai_task_invocations (task_id, validation_status)
  WHERE validation_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ai_task_invocations_abstained
  ON public.ai_task_invocations (task_id)
  WHERE abstained = true;

COMMENT ON COLUMN public.ai_task_invocations.validation_status IS
  'Resultado da validação do output estruturado: ok | abstained | schema_fail | repair_ok | repair_fail. NULL = chamada legada sem contrato de schema (pré-card #3).';
COMMENT ON COLUMN public.ai_task_invocations.abstained IS
  'true quando o modelo emitiu abstain=true legítimo (input insuficiente). NÃO marca KG-vazio — abstain ≠ ausência de evidência curada.';
COMMENT ON COLUMN public.ai_task_invocations.abstain_reason IS
  'Razão textual da abstenção quando abstained=true. Usado para auditar critérios de abstenção e detectar sub-abstenção.';