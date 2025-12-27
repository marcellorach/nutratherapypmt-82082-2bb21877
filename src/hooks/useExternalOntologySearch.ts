import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ExternalOntologyResult {
  external_id: string;
  name: string;
  name_en?: string;
  synonyms: string[];
  description?: string;
  chemical_formula?: string;
  molecular_weight?: number;
  source: string;
  external_url?: string;
  source_metadata?: Record<string, unknown>;
}

export type OntologySource = 'all' | 'chebi' | 'pubchem' | 'kegg' | 'mesh';

export function useExternalOntologySearch() {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<ExternalOntologyResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const search = async (
    query: string, 
    source: OntologySource = 'all', 
    limit: number = 10
  ) => {
    if (!query || query.length < 2) {
      setError('Query must be at least 2 characters');
      return [];
    }

    setIsSearching(true);
    setError(null);
    setResults([]);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('fetch-external-ontologies', {
        body: { query, source, limit }
      });

      if (fnError) {
        throw fnError;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const searchResults = data.results || [];
      setResults(searchResults);
      
      if (searchResults.length === 0) {
        toast.info(`Nenhum resultado encontrado para "${query}"`);
      }

      return searchResults;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      toast.error(`Erro na busca: ${errorMessage}`);
      return [];
    } finally {
      setIsSearching(false);
    }
  };

  const clearResults = () => {
    setResults([]);
    setError(null);
  };

  return {
    search,
    isSearching,
    results,
    error,
    clearResults
  };
}
