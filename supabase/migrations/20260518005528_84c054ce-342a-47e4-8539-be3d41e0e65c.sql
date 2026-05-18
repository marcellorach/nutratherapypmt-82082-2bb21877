-- Reload PostgREST schema cache so that columns confidence,
-- completeness_score and data_filled_at on pet_food_nutrition (added in a
-- previous migration) become visible to supabase-js inserts again.
NOTIFY pgrst, 'reload schema';