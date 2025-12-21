import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  AlertTriangle, 
  RefreshCw, 
  Merge,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { getTaxonomyTerms, TAXONOMY_CATEGORIES } from '@/data/biomedical-taxonomy';

interface DuplicateEntry {
  term: string;
  term_normalized: string;
  categories: { key: string; source: 'static' | 'database'; id?: string }[];
}

const TaxonomyDuplicateChecker: React.FC = () => {
  const { t } = useTranslation();
  const [duplicates, setDuplicates] = useState<DuplicateEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDuplicates, setSelectedDuplicates] = useState<Set<string>>(new Set());
  const [showIgnored, setShowIgnored] = useState(false);
  const [ignoredTerms, setIgnoredTerms] = useState<Set<string>>(new Set());

  const findDuplicates = useCallback(async () => {
    setLoading(true);
    try {
      // Load all terms from all categories
      const allTerms: Map<string, { key: string; source: 'static' | 'database'; id?: string }[]> = new Map();

      // Load static terms
      for (const category of TAXONOMY_CATEGORIES) {
        const terms = getTaxonomyTerms(category.key);
        terms.forEach(term => {
          const normalized = term.toLowerCase().trim();
          if (!allTerms.has(normalized)) {
            allTerms.set(normalized, []);
          }
          allTerms.get(normalized)!.push({ key: category.key, source: 'static' });
        });
      }

      // Load database terms
      const { data: dbTerms, error } = await supabase
        .from('taxonomy_dictionaries')
        .select('id, category, term, term_normalized');

      if (error) throw error;

      dbTerms?.forEach(dbTerm => {
        const normalized = dbTerm.term_normalized;
        if (!allTerms.has(normalized)) {
          allTerms.set(normalized, []);
        }
        // Avoid adding duplicate category entries
        const existing = allTerms.get(normalized)!;
        if (!existing.some(e => e.key === dbTerm.category && e.source === 'database')) {
          allTerms.get(normalized)!.push({ 
            key: dbTerm.category, 
            source: 'database', 
            id: dbTerm.id 
          });
        }
      });

      // Find duplicates (terms appearing in multiple categories)
      const foundDuplicates: DuplicateEntry[] = [];
      allTerms.forEach((categories, normalized) => {
        // Get unique category keys
        const uniqueCategories = [...new Set(categories.map(c => c.key))];
        if (uniqueCategories.length > 1) {
          // Find original term (prefer database version)
          const dbTerm = dbTerms?.find(t => t.term_normalized === normalized);
          foundDuplicates.push({
            term: dbTerm?.term || normalized,
            term_normalized: normalized,
            categories
          });
        }
      });

      // Sort by number of categories (most conflicts first)
      foundDuplicates.sort((a, b) => 
        new Set(b.categories.map(c => c.key)).size - new Set(a.categories.map(c => c.key)).size
      );

      setDuplicates(foundDuplicates);
      console.log(`🔍 Found ${foundDuplicates.length} cross-category duplicates`);
    } catch (error) {
      console.error('Error finding duplicates:', error);
      toast.error(t('ontologyAudit.duplicates.errorLoading'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    findDuplicates();
  }, [findDuplicates]);

  const handleResolve = async (duplicate: DuplicateEntry, keepCategory: string) => {
    try {
      // 1. Check if an override already exists for this term in the chosen category
      const { data: existing } = await supabase
        .from('taxonomy_dictionaries')
        .select('id')
        .eq('term_normalized', duplicate.term_normalized)
        .eq('category', keepCategory)
        .maybeSingle();

      // 2. If no override exists, insert one with source='override'
      if (!existing) {
        const { error: insertError } = await supabase
          .from('taxonomy_dictionaries')
          .insert({
            category: keepCategory,
            term: duplicate.term,
            term_normalized: duplicate.term_normalized,
            source: 'override'
          });
        if (insertError) throw insertError;
      }

      // 3. Remove from other database categories (if any)
      const categoriesToRemove = duplicate.categories.filter(
        c => c.key !== keepCategory && c.source === 'database' && c.id
      );

      for (const cat of categoriesToRemove) {
        const { error } = await supabase
          .from('taxonomy_dictionaries')
          .delete()
          .eq('id', cat.id);
        
        if (error) throw error;
      }

      // 4. Add to ignored list so it disappears from duplicates view
      setIgnoredTerms(prev => new Set([...prev, duplicate.term_normalized]));

      toast.success(t('ontologyAudit.duplicates.resolved', { term: duplicate.term, category: keepCategory }));
      findDuplicates();
    } catch (error) {
      console.error('Error resolving duplicate:', error);
      toast.error(t('ontologyAudit.duplicates.errorResolving'));
    }
  };

  const handleIgnore = (term: string) => {
    setIgnoredTerms(prev => new Set([...prev, term]));
    toast.info(t('ontologyAudit.duplicates.ignored', { term }));
  };

  const toggleSelection = (term: string) => {
    setSelectedDuplicates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(term)) {
        newSet.delete(term);
      } else {
        newSet.add(term);
      }
      return newSet;
    });
  };

  const visibleDuplicates = showIgnored 
    ? duplicates 
    : duplicates.filter(d => !ignoredTerms.has(d.term_normalized));

  const getCategoryColor = (key: string) => {
    const category = TAXONOMY_CATEGORIES.find(c => c.key === key);
    return category?.color || 'bg-gray-500';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Merge className="h-5 w-5" />
              {t('ontologyAudit.duplicates.title')}
            </CardTitle>
            <CardDescription>
              {t('ontologyAudit.duplicates.description')}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowIgnored(!showIgnored)}
            >
              {showIgnored ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showIgnored ? t('ontologyAudit.duplicates.hideIgnored') : t('ontologyAudit.duplicates.showIgnored')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={findDuplicates}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {t('ontologyAudit.actions.refresh')}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : visibleDuplicates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 text-green-500 mb-2" />
            <p>{t('ontologyAudit.duplicates.noDuplicates')}</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-2">
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {visibleDuplicates.length} {t('ontologyAudit.duplicates.conflictsFound')}
              </Badge>
            </div>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {visibleDuplicates.map((duplicate) => {
                  const uniqueCategories = [...new Set(duplicate.categories.map(c => c.key))];
                  const isIgnored = ignoredTerms.has(duplicate.term_normalized);
                  
                  return (
                    <div 
                      key={duplicate.term_normalized}
                      className={`p-4 border rounded-lg ${isIgnored ? 'opacity-50' : ''} ${
                        selectedDuplicates.has(duplicate.term_normalized) ? 'bg-muted/50 border-primary' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedDuplicates.has(duplicate.term_normalized)}
                            onCheckedChange={() => toggleSelection(duplicate.term_normalized)}
                          />
                          <div>
                            <p className="font-medium">{duplicate.term}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {uniqueCategories.map(cat => (
                                <Badge 
                                  key={cat} 
                                  variant="outline"
                                  className={`${getCategoryColor(cat)} text-white border-0 text-xs`}
                                >
                                  {cat.replace('_', ' ')}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {uniqueCategories.map(cat => (
                            <Button
                              key={cat}
                              variant="outline"
                              size="sm"
                              onClick={() => handleResolve(duplicate, cat)}
                              className="text-xs"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {t('ontologyAudit.duplicates.keepIn', { category: cat.replace('_', ' ') })}
                            </Button>
                          ))}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleIgnore(duplicate.term_normalized)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TaxonomyDuplicateChecker;
