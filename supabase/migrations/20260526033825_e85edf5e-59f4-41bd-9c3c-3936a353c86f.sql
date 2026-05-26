
CREATE TABLE IF NOT EXISTS public.prioritization_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT NOT NULL,
  note TEXT,
  moved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prioritization_history_card_id
  ON public.prioritization_history(card_id, moved_at DESC);

ALTER TABLE public.prioritization_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view prioritization history"
  ON public.prioritization_history FOR SELECT USING (true);

CREATE POLICY "Anyone can insert prioritization history"
  ON public.prioritization_history FOR INSERT WITH CHECK (true);

-- Marcar card #1 como entregue
INSERT INTO public.prioritization_overrides (card_id, status, sort_order)
VALUES ('role-view-layer', 'done', 1)
ON CONFLICT (card_id) DO UPDATE SET status = 'done';

-- Seed do histórico do #1
INSERT INTO public.prioritization_history (card_id, from_status, to_status, note, moved_at)
VALUES
  ('role-view-layer', NULL, 'in_progress', 'Card criado', '2026-05-25 00:00:00+00'),
  ('role-view-layer', 'in_progress', 'done', 'Entregue — filtro de perfis sobre sidebar e tabs admin implementado', now());

-- Seed criação dos demais cards (para o log ter ponto de partida)
INSERT INTO public.prioritization_history (card_id, from_status, to_status, note, moved_at)
SELECT card_id, NULL, status, 'Card criado', '2026-05-25 00:00:00+00'
FROM (VALUES
  ('prioritization-panel', 'in_progress'),
  ('cohort-request-generator', 'in_progress'),
  ('population-insights-skeleton', 'next'),
  ('real-vet-pilot', 'next'),
  ('internal-skills-3', 'backlog'),
  ('population-insights-real', 'backlog'),
  ('investigate-clinical-question-skill', 'backlog'),
  ('real-rls-roles', 'backlog'),
  ('meta-kg-phase-b', 'backlog')
) AS seed(card_id, status)
WHERE NOT EXISTS (
  SELECT 1 FROM public.prioritization_history h WHERE h.card_id = seed.card_id
);
