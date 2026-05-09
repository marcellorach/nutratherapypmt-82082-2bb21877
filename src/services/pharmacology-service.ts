import { supabase } from '@/integrations/supabase/client';

export interface DrugSubstance {
  id: string;
  inn_name: string;
  inn_name_en: string | null;
  drug_class: string | null;
  drug_class_en: string | null;
  atc_vet_code: string | null;
  mechanism: string | null;
  mechanism_en: string | null;
  common_routes: string[] | null;
  pediatric_geriatric_notes: string | null;
  contraindicated_breeds: string[] | null;
  contraindicated_conditions: string[] | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DrugBrand {
  id: string;
  brand_name: string;
  manufacturer: string | null;
  country: string;
  substance_id: string;
  dose_form: string | null;
  strengths: string[] | null;
  vet_label: boolean;
  registration_code: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  substance?: DrugSubstance | null;
}

export interface DrugInteraction {
  id: string;
  substance_a_id: string;
  substance_b_id: string | null;
  nutraceutical_id: string | null;
  condition_id: string | null;
  severity: 'info' | 'caution' | 'major' | 'contraindicated';
  mechanism: string | null;
  recommendation: string | null;
  evidence_grade: string | null;
  citations: any;
  created_at: string;
  updated_at: string;
  substance_a?: DrugSubstance | null;
  substance_b?: DrugSubstance | null;
}

export interface DrugLookupResult {
  brand?: DrugBrand;
  substance?: DrugSubstance;
  matchType: 'brand' | 'substance' | 'none';
  query: string;
}

export const PharmacologyService = {
  async listSubstances(): Promise<DrugSubstance[]> {
    const { data, error } = await (supabase as any)
      .from('drug_substances')
      .select('*')
      .order('inn_name');
    if (error) throw error;
    return data || [];
  },

  async listBrands(): Promise<DrugBrand[]> {
    const { data, error } = await (supabase as any)
      .from('drug_brands')
      .select('*, substance:drug_substances(*)')
      .order('brand_name');
    if (error) throw error;
    return data || [];
  },

  async listInteractions(): Promise<DrugInteraction[]> {
    const { data, error } = await (supabase as any)
      .from('drug_interactions')
      .select('*, substance_a:drug_substances!substance_a_id(*), substance_b:drug_substances!substance_b_id(*)')
      .order('severity', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  /** Resolve free-text medication name (e.g. "Previcox 57mg") to substance + class. */
  async lookup(rawName: string): Promise<DrugLookupResult> {
    const query = (rawName || '').trim();
    if (!query) return { matchType: 'none', query };
    const token = query.split(/\s|\//)[0].toLowerCase();
    if (!token) return { matchType: 'none', query };

    // Try brand first (most common case for vets writing comercial names)
    const { data: brands } = await (supabase as any)
      .from('drug_brands')
      .select('*, substance:drug_substances(*)')
      .ilike('brand_name', `${token}%`)
      .limit(1);
    if (brands && brands.length > 0) {
      return { brand: brands[0], substance: brands[0].substance, matchType: 'brand', query };
    }

    // Fallback: try substance INN
    const { data: subs } = await (supabase as any)
      .from('drug_substances')
      .select('*')
      .or(`inn_name.ilike.${token}%,inn_name_en.ilike.${token}%`)
      .limit(1);
    if (subs && subs.length > 0) {
      return { substance: subs[0], matchType: 'substance', query };
    }

    return { matchType: 'none', query };
  },

  /** Search for autocomplete (brands + substances) */
  async search(term: string, limit = 10): Promise<Array<{
    type: 'brand' | 'substance';
    label: string;
    sublabel: string;
    substance_id: string;
    brand_id?: string;
  }>> {
    const q = (term || '').trim();
    if (q.length < 2) return [];

    const [brandsRes, subsRes] = await Promise.all([
      (supabase as any)
        .from('drug_brands')
        .select('id, brand_name, substance:drug_substances(id, inn_name, drug_class)')
        .ilike('brand_name', `%${q}%`)
        .limit(limit),
      (supabase as any)
        .from('drug_substances')
        .select('id, inn_name, drug_class')
        .or(`inn_name.ilike.%${q}%,inn_name_en.ilike.%${q}%`)
        .limit(limit),
    ]);

    const out: Array<any> = [];
    (brandsRes.data || []).forEach((b: any) => {
      out.push({
        type: 'brand',
        label: b.brand_name,
        sublabel: `${b.substance?.inn_name ?? '?'}${b.substance?.drug_class ? ` · ${b.substance.drug_class}` : ''}`,
        substance_id: b.substance?.id,
        brand_id: b.id,
      });
    });
    (subsRes.data || []).forEach((s: any) => {
      out.push({
        type: 'substance',
        label: s.inn_name,
        sublabel: s.drug_class || '',
        substance_id: s.id,
      });
    });
    return out.slice(0, limit);
  },
};