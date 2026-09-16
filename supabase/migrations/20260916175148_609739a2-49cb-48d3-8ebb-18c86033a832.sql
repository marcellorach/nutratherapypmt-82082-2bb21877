-- Grade de permissões por papel (idempotente)
DO $$
DECLARE
  v_scientist_edit text[] := ARRAY[
    'admin.access',
    'tab.estudos','tab.nutraceuticals-unified','tab.veterinary-targets','tab.relacoes',
    'tab.ai-insights','tab.triplet-curation','tab.verification-runs','tab.knowledge-graph',
    'tab.evidence-conflicts','tab.breeds-management','tab.lab-references','tab.pet-food-catalog',
    'tab.pet-food-coverage','tab.dosage-curation','tab.external-sources','tab.gapfill-diagnostics',
    'tab.ontology-audit','tab.pharmacology',
    'tab.estudos-planejados','tab.estudos-andamento','tab.estudos-concluidos','tab.pesquisa-estudos',
    'tab.sugestoes-ai','tab.priorizacoes','tab.research-settings',
    'tab.modelos','tab.custo-beneficio','tab.predictive-analysis-settings',
    'tab.import','tab.visualization','tab.actions','tab.analytics',
    'op.parse_study','op.gemini_file_search','op.extract_study_entities','op.generate_triplets',
    'op.enrich_knowledge_graph','op.force_reextract','op.curate_approve'
  ];
  v_scientist_view text[] := ARRAY[
    'tab.organograma','tab.fundamentos','tab.about-senex','tab.compliance-dashboard',
    'tab.technical-audits','tab.config-ia','tab.prompts'
  ];
  v_vetcoord_edit text[] := ARRAY[
    'tab.pet-management','tab.clinical-monitoring','tab.dosage-curation'
  ];
  v_vetcoord_view text[] := ARRAY[
    'admin.access','tab.estudos','tab.nutraceuticals-unified','tab.veterinary-targets','tab.relacoes',
    'tab.knowledge-graph','tab.breeds-management','tab.lab-references','tab.pet-food-catalog',
    'tab.pet-food-coverage','tab.pharmacology','tab.ai-insights','tab.about-senex','tab.organograma'
  ];
  v_vet_edit text[] := ARRAY['tab.pet-management'];
  v_vet_view text[] := ARRAY[
    'admin.access','tab.clinical-monitoring','tab.nutraceuticals-unified','tab.veterinary-targets',
    'tab.breeds-management','tab.lab-references','tab.pet-food-catalog','tab.knowledge-graph',
    'tab.about-senex'
  ];
  r record;
BEGIN
  FOR r IN
    SELECT 'scientist'::text AS role, unnest(v_scientist_edit) AS k, 'edit'::text AS lvl
    UNION ALL SELECT 'scientist', unnest(v_scientist_view), 'view'
    UNION ALL SELECT 'vet_coordinator', unnest(v_vetcoord_edit), 'edit'
    UNION ALL SELECT 'vet_coordinator', unnest(v_vetcoord_view), 'view'
    UNION ALL SELECT 'veterinarian', unnest(v_vet_edit), 'edit'
    UNION ALL SELECT 'veterinarian', unnest(v_vet_view), 'view'
  LOOP
    IF NOT EXISTS (SELECT 1 FROM public.permissions p WHERE p.key = r.k) THEN
      RAISE EXCEPTION 'Permissão inexistente no catálogo: %', r.k;
    END IF;
    INSERT INTO public.role_permissions (role, permission_key, level)
    VALUES (r.role, r.k, r.lvl)
    ON CONFLICT (role, permission_key) DO UPDATE SET level = EXCLUDED.level;
  END LOOP;

  -- Tutor e usuário não acessam o painel administrativo
  DELETE FROM public.role_permissions WHERE role IN ('tutor','user');
END $$;