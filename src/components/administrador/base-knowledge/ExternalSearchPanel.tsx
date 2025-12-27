import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Database, Plus, Loader2, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useExternalOntologySearch, OntologySource, ExternalOntologyResult } from '@/hooks/useExternalOntologySearch';
import { useCreateCandidate } from '@/hooks/useBaseKnowledgeCandidates';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { findMatches, suggestHarmonization } from '@/services/name-harmonization-service';

const ExternalSearchPanel: React.FC = () => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [source, setSource] = useState<OntologySource>('all');
  const [entityType, setEntityType] = useState<string>('nutraceutical');
  
  const { search, isSearching, results, clearResults } = useExternalOntologySearch();
  const createCandidate = useCreateCandidate();

  // Fetch existing nutraceuticals for harmonization check
  const { data: existingNutraceuticals } = useQuery({
    queryKey: ['nutraceuticals-for-harmonization'],
    queryFn: async () => {
      const { data } = await supabase
        .from('nutraceuticals')
        .select('id, name, name_en');
      return data || [];
    }
  });

  const handleSearch = async () => {
    if (query.trim().length >= 2) {
      await search(query, source, 15);
    }
  };

  const handleAddCandidate = async (result: ExternalOntologyResult) => {
    // Check for existing matches
    const matches = existingNutraceuticals 
      ? findMatches(result.name, existingNutraceuticals, 'nutraceuticals')
      : [];
    const suggestion = suggestHarmonization(result.name, matches);

    await createCandidate.mutateAsync({
      entity_name: result.name,
      entity_name_en: result.name_en || result.name,
      entity_type: entityType,
      external_source: result.source,
      external_id: result.external_id,
      external_url: result.external_url,
      chemical_formula: result.chemical_formula,
      molecular_weight: result.molecular_weight,
      description: result.description,
      synonyms: result.synonyms,
      source_metadata: result.source_metadata,
      matched_existing_id: matches[0]?.id,
      similarity_score: matches[0]?.similarity,
      harmonization_suggestion: suggestion.reason
    });
  };

  const sourceColors: Record<string, string> = {
    'ChEBI': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'PubChem': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'KEGG': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    'MeSH': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          {t('admin.baseKnowledge.externalSearch.title', 'Buscar em Ontologias Externas')}
        </CardTitle>
        <CardDescription>
          {t('admin.baseKnowledge.externalSearch.description', 'Busque compostos, condições e entidades em bases de dados científicas')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder={t('admin.baseKnowledge.externalSearch.placeholder', 'Digite o nome do composto ou condição...')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Select value={source} onValueChange={(v) => setSource(v as OntologySource)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Fonte" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.baseKnowledge.sources.all', 'Todas')}</SelectItem>
              <SelectItem value="chebi">ChEBI</SelectItem>
              <SelectItem value="pubchem">PubChem</SelectItem>
              <SelectItem value="kegg">KEGG</SelectItem>
              <SelectItem value="mesh">MeSH</SelectItem>
            </SelectContent>
          </Select>
          <Select value={entityType} onValueChange={setEntityType}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nutraceutical">{t('admin.baseKnowledge.types.nutraceutical', 'Nutracêutico')}</SelectItem>
              <SelectItem value="condition">{t('admin.baseKnowledge.types.condition', 'Condição')}</SelectItem>
              <SelectItem value="compound">{t('admin.baseKnowledge.types.compound', 'Composto')}</SelectItem>
              <SelectItem value="pathway">{t('admin.baseKnowledge.types.pathway', 'Via Metabólica')}</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleSearch} disabled={isSearching || query.length < 2}>
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            <span className="ml-2 hidden sm:inline">{t('common.search', 'Buscar')}</span>
          </Button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {t('admin.baseKnowledge.externalSearch.resultsCount', '{{count}} resultados encontrados', { count: results.length })}
              </p>
              <Button variant="ghost" size="sm" onClick={clearResults}>
                {t('common.clear', 'Limpar')}
              </Button>
            </div>
            
            <div className="grid gap-3 max-h-[400px] overflow-y-auto">
              {results.map((result, index) => (
                <div
                  key={`${result.external_id}-${index}`}
                  className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">{result.name}</span>
                      <Badge className={sourceColors[result.source] || 'bg-gray-100 text-gray-800'}>
                        {result.source}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-0.5">
                      {result.external_id && (
                        <p className="truncate">ID: {result.external_id}</p>
                      )}
                      {result.chemical_formula && (
                        <p>Fórmula: {result.chemical_formula}</p>
                      )}
                      {result.molecular_weight && (
                        <p>Peso molecular: {result.molecular_weight.toFixed(2)}</p>
                      )}
                      {result.synonyms.length > 0 && (
                        <p className="truncate">Sinônimos: {result.synonyms.slice(0, 3).join(', ')}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    {result.external_url && (
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                      >
                        <a href={result.external_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => handleAddCandidate(result)}
                      disabled={createCandidate.isPending}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      {t('admin.baseKnowledge.externalSearch.addToQueue', 'Adicionar')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isSearching && results.length === 0 && query.length > 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{t('admin.baseKnowledge.externalSearch.noResults', 'Nenhum resultado encontrado')}</p>
            <p className="text-sm mt-1">
              {t('admin.baseKnowledge.externalSearch.tryDifferent', 'Tente um termo diferente ou outra fonte')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExternalSearchPanel;
