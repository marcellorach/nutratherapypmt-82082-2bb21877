import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search, Database, AlertTriangle, CheckCircle2, XCircle,
  Loader2, ExternalLink, Wand2, Shield, Clock, User, Stethoscope
} from 'lucide-react';
import {
  getMappingStats,
  batchMapUnmapped,
  searchStandardMappings,
  checkDuplicateMapping,
  saveMapping,
  checkApiStatus,
  type MappingPreview,
  type MappingStats,
  type MappingResult
} from '@/services/ontology-mapping-service';

type MappableTable = 'health_conditions' | 'nutraceuticals';
type FilterMode = 'all' | 'mapped' | 'unmapped';

const OntologyMappingTab: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [, setSearchParams] = useSearchParams();
  const [activeTable, setActiveTable] = useState<MappableTable>('health_conditions');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [batchPreviews, setBatchPreviews] = useState<MappingPreview[]>([]);
  const [isBatchLoading, setIsBatchLoading] = useState(false);
  const [manualSearchEntity, setManualSearchEntity] = useState<string | null>(null);
  const [manualSearchQuery, setManualSearchQuery] = useState('');
  const [manualResults, setManualResults] = useState<MappingResult[]>([]);
  const [isManualSearching, setIsManualSearching] = useState(false);

  // API status
  const { data: apiStatus } = useQuery({
    queryKey: ['ontology-api-status'],
    queryFn: checkApiStatus,
    staleTime: 5 * 60 * 1000
  });

  // Mapping stats
  const { data: stats } = useQuery({
    queryKey: ['ontology-mapping-stats', activeTable],
    queryFn: () => getMappingStats(activeTable)
  });

  // Entities list
  const { data: entities, isLoading } = useQuery({
    queryKey: ['ontology-entities', activeTable, filter, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from(activeTable)
        .select('id, name, name_en, snomed_code, umls_cui, ontology_mapped_at, ontology_mapped_by, ontology_mapping_source')
        .order('name');

      if (filter === 'mapped') {
        query = query.or('snomed_code.not.is.null,umls_cui.not.is.null');
      } else if (filter === 'unmapped') {
        query = query.is('snomed_code', null).is('umls_cui', null);
      }

      if (searchQuery.length >= 2) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });

  // Save mapping mutation
  const saveMappingMutation = useMutation({
    mutationFn: async ({ entityId, snomedCode, umlsCui, source }: {
      entityId: string; snomedCode: string | null; umlsCui: string | null; source: string;
    }) => {
      // Check duplicate first
      const dupCheck = await checkDuplicateMapping(activeTable, snomedCode, umlsCui, entityId);
      if (dupCheck.isDuplicate) {
        throw new Error(`${dupCheck.existingEntity?.codeType} ${dupCheck.existingEntity?.code} ${t('ontologyMapping.duplicateAlert')} "${dupCheck.existingEntity?.name}"`);
      }
      await saveMapping(entityId, activeTable, snomedCode, umlsCui, source);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ontology-entities'] });
      queryClient.invalidateQueries({ queryKey: ['ontology-mapping-stats'] });
      toast.success(t('ontologyMapping.mappingSaved'));
      setManualSearchEntity(null);
      setManualResults([]);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    }
  });

  // Batch auto-map
  const handleAutoMap = async () => {
    setIsBatchLoading(true);
    try {
      const previews = await batchMapUnmapped(activeTable, 10);
      setBatchPreviews(previews);
      if (previews.length === 0) {
        toast.info(t('ontologyMapping.autoMap.noUnmapped'));
      }
    } catch (err) {
      toast.error(t('ontologyMapping.autoMap.error'));
    } finally {
      setIsBatchLoading(false);
    }
  };

  // Confirm batch mapping
  const confirmBatchMapping = async (preview: MappingPreview) => {
    if (preview.status === 'duplicate') {
      toast.error(preview.duplicateWarning || t('ontologyMapping.duplicateAlert'));
      return;
    }
    await saveMappingMutation.mutateAsync({
      entityId: preview.entityId,
      snomedCode: preview.suggestedSnomed,
      umlsCui: preview.suggestedUmls,
      source: 'auto_map_umls'
    });
    setBatchPreviews(prev => prev.filter(p => p.entityId !== preview.entityId));
  };

  // Manual search
  const handleManualSearch = async () => {
    if (!manualSearchQuery || manualSearchQuery.length < 2) return;
    setIsManualSearching(true);
    try {
      const results = await searchStandardMappings(manualSearchQuery, 'umls', 10);
      setManualResults(results);
      if (results.length === 0) {
        toast.info(t('ontologyMapping.noResults'));
      }
    } catch {
      toast.error(t('ontologyMapping.searchError'));
    } finally {
      setIsManualSearching(false);
    }
  };

  const umlsConfigured = apiStatus?.umls?.configured ?? false;

  return (
    <div className="space-y-6">
      {/* Explainer banner */}
      <div className="rounded-md border border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900/40 p-3 text-sm text-blue-900 dark:text-blue-100">
        <p className="font-medium mb-1">{t('ontologyMapping.explainerTitle')}</p>
        <p className="text-blue-800/80 dark:text-blue-200/80 leading-relaxed">
          {t('ontologyMapping.explainerBody')}
        </p>
      </div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{t('ontologyMapping.title')}</h2>
          <p className="text-muted-foreground">{t('ontologyMapping.description')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={umlsConfigured ? 'default' : 'secondary'} className="gap-1">
            {umlsConfigured ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
            UMLS API: {umlsConfigured ? t('ontologyMapping.umls.configured') : t('ontologyMapping.umls.notConfigured')}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setSearchParams({ tab: 'gapfill-diagnostics' })}
            title={t('ontologyMapping.advancedDiagnostics.tooltip')}
          >
            <Stethoscope className="h-4 w-4" />
            {t('ontologyMapping.advancedDiagnostics.button')}
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card><CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <div className="text-xs text-muted-foreground">{t('ontologyMapping.stats.total')}</div>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.mapped}</div>
            <div className="text-xs text-muted-foreground">{t('ontologyMapping.stats.mapped')}</div>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-orange-500">{stats.unmapped}</div>
            <div className="text-xs text-muted-foreground">{t('ontologyMapping.stats.unmapped')}</div>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-blue-500">{stats.both}</div>
            <div className="text-xs text-muted-foreground">{t('ontologyMapping.stats.both')}</div>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-foreground">
              {stats.total > 0 ? Math.round((stats.mapped / stats.total) * 100) : 0}%
            </div>
            <div className="text-xs text-muted-foreground">{t('ontologyMapping.stats.coverage')}</div>
          </CardContent></Card>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={activeTable} onValueChange={(v) => setActiveTable(v as MappableTable)}>
          <TabsList>
            <TabsTrigger value="health_conditions">{t('ontologyMapping.tables.healthConditions')}</TabsTrigger>
            <TabsTrigger value="nutraceuticals">{t('ontologyMapping.tables.nutraceuticals')}</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-1">
          {(['all', 'mapped', 'unmapped'] as FilterMode[]).map(f => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {t(`ontologyMapping.filters.${f}`)}
            </Button>
          ))}
        </div>

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('ontologyMapping.searchPlaceholder')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Button
          onClick={handleAutoMap}
          disabled={isBatchLoading || !umlsConfigured}
          variant="outline"
          className="gap-2"
        >
          {isBatchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          {t('ontologyMapping.autoMap.button')}
        </Button>
      </div>

      {/* Batch Preview */}
      {batchPreviews.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-blue-600" />
              {t('ontologyMapping.autoMap.previewTitle')} ({batchPreviews.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('ontologyMapping.columns.name')}</TableHead>
                  <TableHead>{t('ontologyMapping.columns.suggestedCUI')}</TableHead>
                  <TableHead>{t('ontologyMapping.columns.suggestedName')}</TableHead>
                  <TableHead>{t('ontologyMapping.columns.status')}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batchPreviews.map(p => (
                  <TableRow key={p.entityId} className={p.status === 'duplicate' ? 'bg-red-50' : ''}>
                    <TableCell className="font-medium">{p.entityName}</TableCell>
                    <TableCell className="font-mono text-sm">{p.suggestedUmls || '—'}</TableCell>
                    <TableCell className="text-sm">{p.suggestedName || '—'}</TableCell>
                    <TableCell>
                      {p.status === 'duplicate' && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" /> {t('ontologyMapping.autoMap.duplicate')}
                        </Badge>
                      )}
                      {p.status === 'new' && (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" /> {t('ontologyMapping.autoMap.ready')}
                        </Badge>
                      )}
                      {p.status === 'no_match' && (
                        <Badge variant="secondary">{t('ontologyMapping.autoMap.noMatch')}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {p.status === 'new' && (
                        <Button size="sm" onClick={() => confirmBatchMapping(p)}>
                          {t('ontologyMapping.autoMap.confirm')}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-end mt-3 gap-2">
              <Button variant="outline" size="sm" onClick={() => setBatchPreviews([])}>
                {t('ontologyMapping.autoMap.dismiss')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('ontologyMapping.columns.name')}</TableHead>
                  <TableHead>SNOMED</TableHead>
                  <TableHead>UMLS CUI</TableHead>
                  <TableHead>{t('ontologyMapping.columns.mappedBy')}</TableHead>
                  <TableHead>{t('ontologyMapping.columns.date')}</TableHead>
                  <TableHead>{t('ontologyMapping.columns.source')}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entities?.map(entity => (
                  <React.Fragment key={entity.id}>
                    <TableRow>
                      <TableCell className="font-medium">
                        {entity.name}
                        {entity.name_en && entity.name_en !== entity.name && (
                          <span className="text-xs text-muted-foreground ml-1">({entity.name_en})</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {entity.snomed_code ? (
                          <Badge variant="outline" className="font-mono text-xs">{entity.snomed_code}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {entity.umls_cui ? (
                          <Badge variant="outline" className="font-mono text-xs">{entity.umls_cui}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {entity.ontology_mapped_by ? (
                          <span className="flex items-center gap-1"><User className="h-3 w-3" /> {entity.ontology_mapped_by.slice(0, 8)}...</span>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {entity.ontology_mapped_at ? (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(entity.ontology_mapped_at).toLocaleDateString()}
                          </span>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-xs">
                        {entity.ontology_mapping_source ? (
                          <Badge variant="secondary" className="text-xs">{entity.ontology_mapping_source}</Badge>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setManualSearchEntity(entity.id);
                            setManualSearchQuery(entity.name);
                            setManualResults([]);
                          }}
                          disabled={!umlsConfigured}
                        >
                          <Search className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>

                    {/* Inline manual search */}
                    {manualSearchEntity === entity.id && (
                      <TableRow className="bg-muted/30">
                        <TableCell colSpan={7}>
                          <div className="p-3 space-y-3">
                            <div className="flex gap-2">
                              <Input
                                value={manualSearchQuery}
                                onChange={e => setManualSearchQuery(e.target.value)}
                                placeholder={t('ontologyMapping.manualSearch.placeholder')}
                                className="max-w-md"
                                onKeyDown={e => e.key === 'Enter' && handleManualSearch()}
                              />
                              <Button onClick={handleManualSearch} disabled={isManualSearching} size="sm">
                                {isManualSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => { setManualSearchEntity(null); setManualResults([]); }}>
                                ✕
                              </Button>
                            </div>
                            {manualResults.length > 0 && (
                              <div className="space-y-1">
                                {manualResults.map((r, idx) => (
                                  <div key={idx} className="flex items-center justify-between p-2 bg-background rounded border text-sm">
                                    <div>
                                      <span className="font-medium">{r.name}</span>
                                      <span className="ml-2 text-muted-foreground font-mono text-xs">
                                        {r.cui && `CUI: ${r.cui}`} {r.snomed_code && `SNOMED: ${r.snomed_code}`}
                                      </span>
                                      <Badge variant="outline" className="ml-2 text-xs">{r.source}</Badge>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => saveMappingMutation.mutate({
                                        entityId: entity.id,
                                        snomedCode: r.snomed_code || null,
                                        umlsCui: r.cui || null,
                                        source: `manual_${r.source.toLowerCase()}`
                                      })}
                                    >
                                      {t('ontologyMapping.manualSearch.apply')}
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
                {entities?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {t('ontologyMapping.noEntities')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OntologyMappingTab;
