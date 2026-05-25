CREATE OR REPLACE FUNCTION public.get_cohort_stats(p_cohort_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
  v_total int;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can read cohort stats';
  END IF;

  SELECT COUNT(*) INTO v_total
  FROM pet_profiles
  WHERE cohort_id = p_cohort_id AND is_synthetic = true;

  IF v_total = 0 THEN
    RETURN jsonb_build_object('total', 0);
  END IF;

  WITH pets AS (
    SELECT * FROM pet_profiles WHERE cohort_id = p_cohort_id AND is_synthetic = true
  ),
  demo AS (
    SELECT
      COUNT(*)::int AS total,
      ROUND(AVG(age_years)::numeric, 1) AS avg_age,
      ROUND(AVG(weight_kg)::numeric, 1) AS avg_weight,
      COUNT(*) FILTER (WHERE sex = 'male')::int AS male_n,
      COUNT(*) FILTER (WHERE sex = 'female')::int AS female_n,
      COUNT(*) FILTER (WHERE neutered)::int AS neutered_n
    FROM pets
  ),
  breeds AS (
    SELECT breed, COUNT(*)::int AS n
    FROM pets GROUP BY breed ORDER BY n DESC LIMIT 5
  ),
  conds AS (
    SELECT
      pc.condition_name,
      COUNT(*)::int AS n,
      COUNT(*) FILTER (WHERE pc.severity = 'mild')::int AS mild,
      COUNT(*) FILTER (WHERE pc.severity = 'moderate')::int AS moderate,
      COUNT(*) FILTER (WHERE pc.severity = 'severe')::int AS severe
    FROM pet_conditions pc
    WHERE pc.pet_id IN (SELECT id FROM pets)
    GROUP BY pc.condition_name
    ORDER BY n DESC LIMIT 8
  ),
  coverage AS (
    SELECT
      (SELECT COUNT(DISTINCT pet_id) FROM pet_conditions WHERE pet_id IN (SELECT id FROM pets))::int AS pets_with_cond,
      (SELECT COUNT(DISTINCT pet_id) FROM pet_exams WHERE pet_id IN (SELECT id FROM pets))::int AS pets_with_exam,
      (SELECT COUNT(DISTINCT pet_id) FROM pet_consultations WHERE pet_id IN (SELECT id FROM pets))::int AS pets_with_consult,
      (SELECT COUNT(*) FROM pet_exams WHERE pet_id IN (SELECT id FROM pets))::int AS exam_total,
      (SELECT COUNT(*) FROM pet_consultations WHERE pet_id IN (SELECT id FROM pets))::int AS consult_total,
      (SELECT COUNT(*) FROM pet_medications WHERE pet_id IN (SELECT id FROM pets))::int AS med_total
  ),
  flags AS (
    SELECT flag, COUNT(*)::int AS n FROM (
      SELECT UNNEST(flags_abnormal) AS flag
      FROM pet_exams WHERE pet_id IN (SELECT id FROM pets) AND flags_abnormal IS NOT NULL
    ) f
    WHERE flag IS NOT NULL AND flag <> ''
    GROUP BY flag ORDER BY n DESC LIMIT 5
  )
  SELECT jsonb_build_object(
    'total', (SELECT total FROM demo),
    'demographics', jsonb_build_object(
      'avg_age', (SELECT avg_age FROM demo),
      'avg_weight', (SELECT avg_weight FROM demo),
      'male_n', (SELECT male_n FROM demo),
      'female_n', (SELECT female_n FROM demo),
      'neutered_n', (SELECT neutered_n FROM demo)
    ),
    'top_breeds', COALESCE((SELECT jsonb_agg(jsonb_build_object('breed', breed, 'n', n)) FROM breeds), '[]'::jsonb),
    'top_conditions', COALESCE((SELECT jsonb_agg(jsonb_build_object(
      'name', condition_name, 'n', n, 'mild', mild, 'moderate', moderate, 'severe', severe
    )) FROM conds), '[]'::jsonb),
    'coverage', jsonb_build_object(
      'pets_with_condition', (SELECT pets_with_cond FROM coverage),
      'pets_with_exam', (SELECT pets_with_exam FROM coverage),
      'pets_with_consultation', (SELECT pets_with_consult FROM coverage),
      'avg_exams_per_pet', ROUND(((SELECT exam_total FROM coverage)::numeric / NULLIF((SELECT total FROM demo), 0)), 2),
      'avg_consultations_per_pet', ROUND(((SELECT consult_total FROM coverage)::numeric / NULLIF((SELECT total FROM demo), 0)), 2),
      'medications_total', (SELECT med_total FROM coverage)
    ),
    'top_flags', COALESCE((SELECT jsonb_agg(jsonb_build_object('flag', flag, 'n', n)) FROM flags), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_cohort_stats(uuid) TO authenticated;