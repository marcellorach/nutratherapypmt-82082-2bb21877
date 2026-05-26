UPDATE public.pet_profiles
SET breed = 'SRD'
WHERE is_synthetic = true
  AND breed IS NOT NULL
  AND (
    breed ILIKE '%srd%'
    OR breed ILIKE '%sem raça definida%'
    OR breed ILIKE '%sem raca definida%'
    OR breed ILIKE '%vira-lata%'
    OR breed ILIKE '%vira lata%'
    OR breed ILIKE '%mongrel%'
    OR breed ILIKE '%mixed breed%'
    OR breed ILIKE '%mutt%'
  )
  AND breed <> 'SRD';