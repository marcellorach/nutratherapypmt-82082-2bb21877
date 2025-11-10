-- Fix Security Definer View issue by recreating clean_seed_data view without SECURITY DEFINER
DROP VIEW IF EXISTS clean_seed_data;

CREATE OR REPLACE VIEW clean_seed_data AS
SELECT 
  n.id,
  n.name,
  n.description,
  n.chemical_compound,
  n.source,
  n.dosage,
  n.created_at,
  n.updated_at,
  (
    SELECT json_agg(
      json_build_object(
        'condition_id', nc.condition_id,
        'condition_name', hc.name,
        'relationship_type', nc.relationship_type,
        'efficacy_score', nc.efficacy_score
      )
    )
    FROM nutraceutical_conditions nc
    JOIN health_conditions hc ON hc.id = nc.condition_id
    WHERE nc.nutraceutical_id = n.id
  ) as conditions,
  (
    SELECT json_agg(
      json_build_object(
        'study_id', ns.study_id,
        'title', ss.title,
        'relevance_score', ns.relevance_score
      )
    )
    FROM nutraceutical_studies ns
    JOIN scientific_studies ss ON ss.id = ns.study_id
    WHERE ns.nutraceutical_id = n.id
  ) as studies
FROM nutraceuticals n;