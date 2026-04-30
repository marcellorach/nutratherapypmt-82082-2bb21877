-- 1) Backfill pet_conditions.condition_id from health_conditions canonical match
UPDATE public.pet_conditions pc
SET condition_id = hc.id
FROM public.health_conditions hc
WHERE pc.condition_id IS NULL
  AND (
    lower(btrim(pc.condition_name)) = lower(btrim(hc.name))
    OR lower(btrim(pc.condition_name)) = lower(btrim(hc.name_en))
  );

-- 2) Backfill nutraceuticals.name_en for known compounds
UPDATE public.nutraceuticals SET name_en = 'Alpha-Lipoic Acid' WHERE name = 'Ácido Alfa-Lipóico' AND (name_en IS NULL OR btrim(name_en) = '');
UPDATE public.nutraceuticals SET name_en = 'Allicin' WHERE name = 'Allicina' AND (name_en IS NULL OR btrim(name_en) = '');
UPDATE public.nutraceuticals SET name_en = 'Alpha-Ketoglutarate (Alpha-AKG)' WHERE name = 'Alpha-AKG (Alfa-Cetoglutarato)' AND (name_en IS NULL OR btrim(name_en) = '');
UPDATE public.nutraceuticals SET name_en = 'Apigenin' WHERE name = 'Apigenina' AND (name_en IS NULL OR btrim(name_en) = '');
UPDATE public.nutraceuticals SET name_en = 'Astaxanthin' WHERE name = 'Astaxantina' AND (name_en IS NULL OR btrim(name_en) = '');
UPDATE public.nutraceuticals SET name_en = 'Astragalus' WHERE name = 'Astragalus' AND (name_en IS NULL OR btrim(name_en) = '');
UPDATE public.nutraceuticals SET name_en = 'Beta-Glucans' WHERE name = 'Beta-Glucanas' AND (name_en IS NULL OR btrim(name_en) = '');
UPDATE public.nutraceuticals SET name_en = 'Coenzyme Q10' WHERE name = 'Coenzima Q10' AND (name_en IS NULL OR btrim(name_en) = '');
UPDATE public.nutraceuticals SET name_en = 'Chondroitin Sulfate' WHERE name = 'Condroitina' AND (name_en IS NULL OR btrim(name_en) = '');
UPDATE public.nutraceuticals SET name_en = 'Curcumin' WHERE name = 'Curcumina' AND (name_en IS NULL OR btrim(name_en) = '');
UPDATE public.nutraceuticals SET name_en = 'EPA (Eicosapentaenoic Acid)' WHERE name = 'EPA (Ácido eicosapentaenoico)' AND (name_en IS NULL OR btrim(name_en) = '');
UPDATE public.nutraceuticals SET name_en = 'Echinacea' WHERE name = 'Equinácea' AND (name_en IS NULL OR btrim(name_en) = '');
UPDATE public.nutraceuticals SET name_en = 'Glucosamine' WHERE name = 'Glucosamina' AND (name_en IS NULL OR btrim(name_en) = '');
UPDATE public.nutraceuticals SET name_en = 'L-Carnitine' WHERE name = 'L-carnitina' AND (name_en IS NULL OR btrim(name_en) = '');
UPDATE public.nutraceuticals SET name_en = 'Bee Pollen' WHERE name = 'Pólen de Abelha' AND (name_en IS NULL OR btrim(name_en) = '');
UPDATE public.nutraceuticals SET name_en = 'Prebiotics' WHERE name = 'Prebióticos' AND (name_en IS NULL OR btrim(name_en) = '');
UPDATE public.nutraceuticals SET name_en = 'Green Propolis' WHERE name = 'Própolis Verde' AND (name_en IS NULL OR btrim(name_en) = '');
UPDATE public.nutraceuticals SET name_en = 'Quercetin' WHERE name = 'Quercetina' AND (name_en IS NULL OR btrim(name_en) = '');
UPDATE public.nutraceuticals SET name_en = 'Chitosan' WHERE name = 'Quitosana' AND (name_en IS NULL OR btrim(name_en) = '');
UPDATE public.nutraceuticals SET name_en = 'Resveratrol' WHERE name = 'Resveratrol' AND (name_en IS NULL OR btrim(name_en) = '');
UPDATE public.nutraceuticals SET name_en = 'Silymarin' WHERE name = 'Silimarina' AND (name_en IS NULL OR btrim(name_en) = '');
UPDATE public.nutraceuticals SET name_en = 'Vitamin E' WHERE name = 'Vitamina E' AND (name_en IS NULL OR btrim(name_en) = '');