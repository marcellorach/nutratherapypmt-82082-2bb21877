
CREATE OR REPLACE FUNCTION public.get_conditions_with_treatability_v2()
RETURNS TABLE (
  id uuid,
  name text,
  name_en text,
  description text,
  description_en text,
  category text,
  category_en text,
  severity_level text,
  created_at timestamptz,
  updated_at timestamptz,
  nutraceutical_count bigint,
  avg_efficacy numeric,
  treatment_count bigint,
  prevention_count bigint,
  support_count bigint,
  breed_predisposition_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    hc.id,
    hc.name,
    hc.name_en,
    hc.description,
    hc.description_en,
    hc.category,
    hc.category_en,
    hc.severity_level,
    hc.created_at,
    hc.updated_at,
    COUNT(DISTINCT nc.nutraceutical_id) AS nutraceutical_count,
    ROUND(AVG(nc.efficacy_score)::numeric, 2) AS avg_efficacy,
    COUNT(DISTINCT nc.id) FILTER (WHERE nc.relationship_type = 'treatment') AS treatment_count,
    COUNT(DISTINCT nc.id) FILTER (WHERE nc.relationship_type = 'prevention') AS prevention_count,
    COUNT(DISTINCT nc.id) FILTER (WHERE nc.relationship_type = 'support') AS support_count,
    (SELECT COUNT(*) FROM breed_predispositions bp WHERE bp.condition_id = hc.id) AS breed_predisposition_count
  FROM health_conditions hc
  LEFT JOIN nutraceutical_conditions nc ON nc.condition_id = hc.id
  GROUP BY hc.id, hc.name, hc.name_en, hc.description, hc.description_en, 
           hc.category, hc.category_en, hc.severity_level, hc.created_at, hc.updated_at
  ORDER BY hc.name;
$$;
