import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PetConsultationRow {
  id: string;
  pet_id: string;
  consultation_date: string;
  veterinarian_name?: string | null;
  chief_complaint?: string | null;
  clinical_exam?: string | null;
  weight_kg_at_visit?: number | null;
  body_condition_score?: number | null;
  assessment?: string | null;
  plan?: string | null;
  is_latest: boolean;
}

export interface PetConsultationBundle extends PetConsultationRow {
  conditions: any[];
  medications: any[];
  exams: any[];
  notes: any[];
}

/**
 * Loads all consultations for a pet, then fans out the linked
 * pet_conditions / pet_medications / pet_exams / pet_clinical_notes
 * (joined via consultation_id) so the UI can render a longitudinal
 * timeline with each visit's own findings.
 */
export function usePetConsultations(petId?: string) {
  return useQuery({
    queryKey: ['pet-consultations', petId],
    enabled: !!petId,
    queryFn: async (): Promise<PetConsultationBundle[]> => {
      if (!petId) return [];
      const consultsRes = await (supabase as any)
        .from('pet_consultations')
        .select('*')
        .eq('pet_id', petId)
        .order('consultation_date', { ascending: false });
      if (consultsRes.error) throw consultsRes.error;
      const consultations: PetConsultationRow[] = consultsRes.data ?? [];
      if (consultations.length === 0) return [];

      const [condRes, medRes, examRes, noteRes] = await Promise.all([
        (supabase as any).from('pet_conditions').select('*').eq('pet_id', petId),
        (supabase as any).from('pet_medications').select('*').eq('pet_id', petId),
        (supabase as any).from('pet_exams').select('*').eq('pet_id', petId),
        (supabase as any).from('pet_clinical_notes').select('*').eq('pet_id', petId),
      ]);

      const groupBy = (rows: any[]) => {
        const m = new Map<string, any[]>();
        for (const r of rows ?? []) {
          const k = r.consultation_id ?? '__unlinked__';
          if (!m.has(k)) m.set(k, []);
          m.get(k)!.push(r);
        }
        return m;
      };
      const cMap = groupBy(condRes.data);
      const mMap = groupBy(medRes.data);
      const eMap = groupBy(examRes.data);
      const nMap = groupBy(noteRes.data);

      return consultations.map((c) => ({
        ...c,
        conditions: cMap.get(c.id) ?? [],
        medications: mMap.get(c.id) ?? [],
        exams: eMap.get(c.id) ?? [],
        notes: nMap.get(c.id) ?? [],
      }));
    },
  });
}

export interface PetNutritionSnapshot {
  id: string;
  pet_id: string;
  consultation_id?: string | null;
  diet_type: string;
  daily_amount_g?: number | null;
  meals_per_day?: number | null;
  treats_frequency?: string | null;
  water_intake?: string | null;
  restrictions?: string[] | null;
  notes?: string | null;
  is_current: boolean;
  started_at?: string | null;
  items: Array<{
    id: string;
    raw_brand_text?: string | null;
    raw_product_text?: string | null;
    share_percent?: number | null;
    daily_amount_g_per_item?: number | null;
    product_id?: string | null;
  }>;
}

export function usePetNutrition(petId?: string) {
  return useQuery({
    queryKey: ['pet-nutrition', petId],
    enabled: !!petId,
    queryFn: async (): Promise<PetNutritionSnapshot[]> => {
      if (!petId) return [];
      const nRes = await (supabase as any)
        .from('pet_nutrition')
        .select('*')
        .eq('pet_id', petId)
        .order('created_at', { ascending: false });
      if (nRes.error) throw nRes.error;
      const nutritions = nRes.data ?? [];
      if (nutritions.length === 0) return [];
      const ids = nutritions.map((n: any) => n.id);
      const itemsRes = await (supabase as any)
        .from('pet_nutrition_items')
        .select('*')
        .in('nutrition_id', ids);
      const itemsByN = new Map<string, any[]>();
      for (const it of itemsRes.data ?? []) {
        if (!itemsByN.has(it.nutrition_id)) itemsByN.set(it.nutrition_id, []);
        itemsByN.get(it.nutrition_id)!.push(it);
      }
      return nutritions.map((n: any) => ({ ...n, items: itemsByN.get(n.id) ?? [] }));
    },
  });
}