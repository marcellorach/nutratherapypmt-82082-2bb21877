-- Create function to get conditions with treatability metrics
CREATE OR REPLACE FUNCTION get_conditions_with_treatability()
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
  support_count bigint
) AS $$
BEGIN
  RETURN QUERY
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
    COUNT(DISTINCT nc.nutraceutical_id) as nutraceutical_count,
    AVG(nc.efficacy_score) as avg_efficacy,
    COUNT(DISTINCT CASE WHEN nc.relationship_type = 'treatment' THEN nc.id END) as treatment_count,
    COUNT(DISTINCT CASE WHEN nc.relationship_type = 'prevention' THEN nc.id END) as prevention_count,
    COUNT(DISTINCT CASE WHEN nc.relationship_type = 'support' THEN nc.id END) as support_count
  FROM health_conditions hc
  LEFT JOIN nutraceutical_conditions nc ON hc.id = nc.condition_id
  GROUP BY hc.id, hc.name, hc.name_en, hc.description, hc.description_en, 
           hc.category, hc.category_en, hc.severity_level, hc.created_at, hc.updated_at
  ORDER BY hc.name;
END;
$$ LANGUAGE plpgsql;