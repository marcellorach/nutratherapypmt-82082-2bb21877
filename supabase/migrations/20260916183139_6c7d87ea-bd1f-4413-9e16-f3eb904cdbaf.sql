-- Torna o versionado igual ao banco vivo para o papel `scientist`.
-- Idempotente: reaplicar nao altera o estado atual (47 tab.* em view + admin.access, zero op.*).
DO $$
DECLARE
  v_tabs text[] := ARRAY[
    'tab.about-senex','tab.access-requests','tab.actions','tab.ai-insights','tab.analytics',
    'tab.breeds-management','tab.clinical-monitoring','tab.compliance-dashboard','tab.config-ia',
    'tab.custo-beneficio','tab.design-conventions','tab.dosage-curation','tab.estudos',
    'tab.estudos-andamento','tab.estudos-concluidos','tab.estudos-planejados','tab.evidence-conflicts',
    'tab.external-sources','tab.fundamentos','tab.gapfill-diagnostics','tab.import',
    'tab.knowledge-graph','tab.lab-references','tab.modelos','tab.nutraceuticals-unified',
    'tab.ontology-audit','tab.organograma','tab.pesquisa-estudos','tab.pet-food-catalog',
    'tab.pet-food-coverage','tab.pet-management','tab.pharmacology','tab.predictive-analysis-settings',
    'tab.priorizacoes','tab.prompts','tab.relacoes','tab.research-settings','tab.sugestoes-ai',
    'tab.technical-audits','tab.translation-audit','tab.translation-manager','tab.translations',
    'tab.triplet-curation','tab.tutorial-ia','tab.verification-runs','tab.veterinary-targets',
    'tab.visualization'
  ];
  v_key text;
BEGIN
  -- admin.access mantido (nao e tocado por esta migracao)
  INSERT INTO public.role_permissions (role, permission_key, level)
  SELECT 'scientist', 'admin.access', 'edit'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.role_permissions
    WHERE role = 'scientist' AND permission_key = 'admin.access'
  );

  FOREACH v_key IN ARRAY v_tabs LOOP
    IF EXISTS (SELECT 1 FROM public.permissions WHERE key = v_key) THEN
      INSERT INTO public.role_permissions (role, permission_key, level)
      VALUES ('scientist', v_key, 'view')
      ON CONFLICT (role, permission_key) DO UPDATE SET level = 'view'
      WHERE public.role_permissions.level IS DISTINCT FROM 'view';
    END IF;
  END LOOP;

  DELETE FROM public.role_permissions
  WHERE role = 'scientist' AND permission_key LIKE 'op.%';
END $$;