import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EnrichmentLookupInput {
  brand_name: string;
  product_name: string;
  species?: 'dog' | 'cat';
  life_stage?: string | null;
}

export interface EnrichmentParsed {
  species?: string | null;
  life_stage?: string | null;
  confidence?: number | null;
  notes?: string | null;
  nutrition?: Record<string, any>;
  [k: string]: any;
}

export interface EnrichmentLookupResult {
  ok: boolean;
  parsed: EnrichmentParsed;
  product_id: string | null;
}

/**
 * Hook (admin-only) para buscar e/ou incorporar uma ração ao catálogo via
 * edge `enrich-pet-food-product`. Mantém estado do último lookup para que o
 * botão "Incorporar" só apareça depois de uma busca com confiança suficiente.
 */
export function usePetFoodEnrichment(petId?: string) {
  const qc = useQueryClient();
  const [lastLookup, setLastLookup] = useState<EnrichmentLookupResult | null>(null);

  const lookup = useMutation({
    mutationFn: async (input: EnrichmentLookupInput) => {
      const { data, error } = await supabase.functions.invoke('enrich-pet-food-product', {
        body: { ...input, persist: false },
      });
      if (error) throw error;
      const res = data as EnrichmentLookupResult;
      setLastLookup(res);
      return res;
    },
  });

  const incorporate = useMutation({
    mutationFn: async (
      input: EnrichmentLookupInput & { link_to_item_id?: string },
    ) => {
      const { data, error } = await supabase.functions.invoke('enrich-pet-food-product', {
        body: { ...input, persist: true },
      });
      if (error) throw error;
      return data as EnrichmentLookupResult;
    },
    onSuccess: () => {
      // Invalida queries dependentes para que a análise re-rode.
      if (petId) {
        qc.invalidateQueries({ queryKey: ['nutrition-gap', petId] });
        qc.invalidateQueries({ queryKey: ['pet-nutrition', petId] });
      }
    },
  });

  return { lookup, incorporate, lastLookup, resetLookup: () => setLastLookup(null) };
}

export default usePetFoodEnrichment;