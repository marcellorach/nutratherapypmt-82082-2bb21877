import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Search, 
  Edit3, 
  Merge, 
  Trash2,
  Download,
  Filter,
  BarChart3,
  AlertCircle,
  ChevronRight,
  Play,
  Settings2,
  Sparkles,
  Brain
} from 'lucide-react';
import { classifyEntity, TYPE_TO_LAYER, getTaxonomyStats, getTaxonomyTerms, TAXONOMY_CATEGORIES } from '@/data/biomedical-taxonomy';
import TaxonomyDictionaryDialog from './TaxonomyDictionaryDialog';
import TaxonomyDuplicateChecker from './TaxonomyDuplicateChecker';
import AISuggestionPanel from './AISuggestionPanel';

interface EntityAuditItem {
  id: string;
  name: string;
  current_type: string;
  current_layer: string;
  suggested_type: string;
  suggested_layer: string;
  confidence: number;
  source: 'triplet_subject' | 'triplet_object' | 'ontology';
  source_id: string;
  needs_review: boolean;
  matchedDictionary?: string;
  matchedPattern?: string;
}

interface AuditStats {
  total_entities: number;
  correctly_classified: number;
  needs_review: number;
  by_type: Record<string, number>;
  misclassified_types: Record<string, { current: string; suggested: string; count: number }[]>;
}

const OntologyAuditTab: React.FC = () => {
  const { t } = useTranslation();
  const [entities, setEntities] = useState<EntityAuditItem[]>([]);
  const [filteredEntities, setFilteredEntities] = useState<EntityAuditItem[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('needs_review');
  const [selectedEntities, setSelectedEntities] = useState<Set<string>>(new Set());
  const [reclassifyDialogOpen, setReclassifyDialogOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<EntityAuditItem | null>(null);
  const [newType, setNewType] = useState('');
  const [processing, setProcessing] = useState(false);
  
  // Taxonomy dictionary dialog state
  const [taxonomyDialogOpen, setTaxonomyDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<{ key: string; label: string } | null>(null);

  const taxonomyStats = getTaxonomyStats();

  const entityTypes = [
    'Nutraceutical', 'Drug', 'ChemicalCompound',
    'Enzyme', 'Receptor', 'GeneProtein', 'Pathway',
    'Mechanism', 'SignalingCascade',
    'BiologicalProcess', 'BiologicalEffect', 'SideEffect',
    'ClinicalOutcome', 'Condition', 'Disease',
    'Cell', 'CellComponent',
    'Breed', 'Species', 'AgeGroup'
  ];

  const loadEntities = useCallback(async () => {
    setLoading(true);
    try {
      // Carregar triplets para auditoria
      const { data: triplets, error } = await supabase
        .from('triplet_extractions')
        .select('id, subject_name, subject_type, subject_layer, object_name, object_type, object_layer, curation_status')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      const auditItems: EntityAuditItem[] = [];
      const seenEntities = new Set<string>();

      triplets?.forEach(triplet => {
        // Auditar subject
        const subjectKey = `${triplet.subject_name}_subject`;
        if (!seenEntities.has(subjectKey)) {
          seenEntities.add(subjectKey);
          const classification = classifyEntity(triplet.subject_name);
          const needsReview = classification.type !== triplet.subject_type || 
                              classification.confidence < 0.7 ||
                              triplet.subject_type === 'Nutraceutical' && !['Nutraceutical', 'Drug', 'ChemicalCompound'].includes(classification.type);
          
          auditItems.push({
            id: `${triplet.id}_subject`,
            name: triplet.subject_name,
            current_type: triplet.subject_type || 'Unknown',
            current_layer: triplet.subject_layer || 'unknown',
            suggested_type: classification.type,
            suggested_layer: classification.layer,
            confidence: classification.confidence,
            source: 'triplet_subject',
            source_id: triplet.id,
            needs_review: needsReview,
            matchedDictionary: classification.matchedDictionary,
            matchedPattern: classification.matchedPattern
          });
        }

        // Auditar object
        const objectKey = `${triplet.object_name}_object`;
        if (!seenEntities.has(objectKey)) {
          seenEntities.add(objectKey);
          const classification = classifyEntity(triplet.object_name);
          const needsReview = classification.type !== triplet.object_type || 
                              classification.confidence < 0.7 ||
                              triplet.object_type === 'Nutraceutical' && !['Nutraceutical', 'Drug', 'ChemicalCompound'].includes(classification.type);
          
          auditItems.push({
            id: `${triplet.id}_object`,
            name: triplet.object_name,
            current_type: triplet.object_type || 'Unknown',
            current_layer: triplet.object_layer || 'unknown',
            suggested_type: classification.type,
            suggested_layer: classification.layer,
            confidence: classification.confidence,
            source: 'triplet_object',
            source_id: triplet.id,
            needs_review: needsReview,
            matchedDictionary: classification.matchedDictionary,
            matchedPattern: classification.matchedPattern
          });
        }
      });

      setEntities(auditItems);
      
      // Calcular estatísticas
      const statsData: AuditStats = {
        total_entities: auditItems.length,
        correctly_classified: auditItems.filter(e => !e.needs_review).length,
        needs_review: auditItems.filter(e => e.needs_review).length,
        by_type: {},
        misclassified_types: {}
      };

      auditItems.forEach(item => {
        statsData.by_type[item.current_type] = (statsData.by_type[item.current_type] || 0) + 1;
        
        if (item.needs_review && item.current_type !== item.suggested_type) {
          const key = item.current_type;
          if (!statsData.misclassified_types[key]) {
            statsData.misclassified_types[key] = [];
          }
          const existing = statsData.misclassified_types[key].find(
            m => m.current === item.current_type && m.suggested === item.suggested_type
          );
          if (existing) {
            existing.count++;
          } else {
            statsData.misclassified_types[key].push({
              current: item.current_type,
              suggested: item.suggested_type,
              count: 1
            });
          }
        }
      });

      setStats(statsData);
    } catch (error) {
      console.error('Erro ao carregar entidades:', error);
      toast.error(t('ontologyAudit.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadEntities();
  }, [loadEntities]);

  useEffect(() => {
    let filtered = [...entities];
    
    if (searchTerm) {
      filtered = filtered.filter(e => 
        e.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterType !== 'all') {
      filtered = filtered.filter(e => e.current_type === filterType);
    }
    
    if (filterStatus === 'needs_review') {
      filtered = filtered.filter(e => e.needs_review);
    } else if (filterStatus === 'correct') {
      filtered = filtered.filter(e => !e.needs_review);
    }
    
    setFilteredEntities(filtered);
  }, [entities, searchTerm, filterType, filterStatus]);

  const handleReclassify = async (entity: EntityAuditItem, newType: string) => {
    setProcessing(true);
    try {
      const newLayer = TYPE_TO_LAYER[newType] || 'unknown';
      
      // Determinar qual campo atualizar baseado na fonte
      const updateData = entity.source === 'triplet_subject' 
        ? { subject_type: newType, subject_layer: newLayer }
        : { object_type: newType, object_layer: newLayer };

      const { error } = await supabase
        .from('triplet_extractions')
        .update(updateData)
        .eq('id', entity.source_id);

      if (error) throw error;

      toast.success(t('ontologyAudit.success.reclassified', { name: entity.name, type: newType }));
      setReclassifyDialogOpen(false);
      loadEntities();
    } catch (error) {
      console.error('Erro ao reclassificar:', error);
      toast.error(t('ontologyAudit.errors.reclassifyFailed'));
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkReclassify = async () => {
    if (selectedEntities.size === 0) return;
    
    setProcessing(true);
    let successCount = 0;
    let errorCount = 0;

    for (const entityId of selectedEntities) {
      const entity = entities.find(e => e.id === entityId);
      if (!entity || entity.current_type === entity.suggested_type) continue;

      try {
        const newLayer = TYPE_TO_LAYER[entity.suggested_type] || 'unknown';
        const updateData = entity.source === 'triplet_subject'
          ? { subject_type: entity.suggested_type, subject_layer: newLayer }
          : { object_type: entity.suggested_type, object_layer: newLayer };

        const { error } = await supabase
          .from('triplet_extractions')
          .update(updateData)
          .eq('id', entity.source_id);

        if (error) throw error;
        successCount++;
      } catch (error) {
        console.error('Erro ao reclassificar:', error);
        errorCount++;
      }
    }

    toast.success(t('ontologyAudit.success.bulkReclassified', { count: successCount }));
    if (errorCount > 0) {
      toast.error(t('ontologyAudit.errors.bulkPartialFailed', { count: errorCount }));
    }
    
    setSelectedEntities(new Set());
    setProcessing(false);
    loadEntities();
  };

  const handleApplySuggestion = async (entity: EntityAuditItem) => {
    await handleReclassify(entity, entity.suggested_type);
  };

  const toggleEntitySelection = (entityId: string) => {
    const newSelection = new Set(selectedEntities);
    if (newSelection.has(entityId)) {
      newSelection.delete(entityId);
    } else {
      newSelection.add(entityId);
    }
    setSelectedEntities(newSelection);
  };

  const selectAllFiltered = () => {
    const needsReviewIds = filteredEntities
      .filter(e => e.needs_review)
      .map(e => e.id);
    setSelectedEntities(new Set(needsReviewIds));
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) return <Badge variant="default" className="bg-green-500">{(confidence * 100).toFixed(0)}%</Badge>;
    if (confidence >= 0.7) return <Badge variant="default" className="bg-yellow-500">{(confidence * 100).toFixed(0)}%</Badge>;
    return <Badge variant="destructive">{(confidence * 100).toFixed(0)}%</Badge>;
  };

  const exportAuditReport = () => {
    const report = {
      generated_at: new Date().toISOString(),
      stats,
      entities_needing_review: entities.filter(e => e.needs_review).map(e => ({
        name: e.name,
        current_type: e.current_type,
        suggested_type: e.suggested_type,
        confidence: e.confidence
      }))
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ontology-audit-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('ontologyAudit.success.exported'));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('ontologyAudit.title')}</h1>
          <p className="text-muted-foreground">{t('ontologyAudit.description')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportAuditReport}>
            <Download className="h-4 w-4 mr-2" />
            {t('ontologyAudit.actions.export')}
          </Button>
          <Button onClick={loadEntities} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {t('ontologyAudit.actions.refresh')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('ontologyAudit.stats.totalEntities')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_entities || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('ontologyAudit.stats.correct')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold text-green-600">{stats?.correctly_classified || 0}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('ontologyAudit.stats.needsReview')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold text-yellow-600">{stats?.needs_review || 0}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('ontologyAudit.stats.taxonomySize')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.values(taxonomyStats).reduce((a, b) => a + b, 0)}</div>
            <p className="text-xs text-muted-foreground">{t('ontologyAudit.stats.knownEntities')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Taxonomy Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {t('ontologyAudit.taxonomy.title')}
          </CardTitle>
          <CardDescription>
            {t('ontologyAudit.taxonomy.description')}
            <span className="ml-2 text-xs text-primary">{t('ontologyAudit.taxonomy.clickToManage')}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Object.entries(taxonomyStats)
              .filter(([key]) => key !== 'total')
              .map(([key, count]) => {
                const categoryMeta = TAXONOMY_CATEGORIES.find(c => c.key === key);
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedCategory({ 
                        key, 
                        label: t(`ontologyAudit.taxonomy.categories.${key}`, key.replace('_', ' '))
                      });
                      setTaxonomyDialogOpen(true);
                    }}
                    className="p-3 rounded-lg border bg-card hover:bg-accent hover:border-primary/50 transition-all cursor-pointer text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-semibold">{count}</div>
                      <Settings2 className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-xs text-muted-foreground capitalize">{key.replace('_', ' ')}</div>
                    {categoryMeta && (
                      <div className={`w-full h-1 rounded-full mt-2 ${categoryMeta.color} opacity-50`} />
                    )}
                  </button>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Taxonomy Dictionary Dialog */}
      <TaxonomyDictionaryDialog
        open={taxonomyDialogOpen}
        onOpenChange={setTaxonomyDialogOpen}
        category={selectedCategory?.key || ''}
        categoryLabel={selectedCategory?.label || ''}
        initialTerms={selectedCategory ? getTaxonomyTerms(selectedCategory.key) : []}
      />

      <Tabs defaultValue="review" className="w-full">
        <TabsList>
          <TabsTrigger value="review" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {t('ontologyAudit.tabs.review')}
            {stats?.needs_review ? <Badge variant="destructive">{stats.needs_review}</Badge> : null}
          </TabsTrigger>
          <TabsTrigger value="all">
            {t('ontologyAudit.tabs.allEntities')}
          </TabsTrigger>
          <TabsTrigger value="misclassifications">
            {t('ontologyAudit.tabs.misclassifications')}
          </TabsTrigger>
          <TabsTrigger value="duplicates" className="flex items-center gap-2">
            <Merge className="h-4 w-4" />
            {t('ontologyAudit.tabs.duplicates')}
          </TabsTrigger>
          <TabsTrigger value="ai-suggestions" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            {t('ontologyAudit.tabs.aiSuggestions')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="review" className="space-y-4">
          {/* Filters & Bulk Actions */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t('ontologyAudit.filters.searchPlaceholder')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder={t('ontologyAudit.filters.type')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('ontologyAudit.filters.allTypes')}</SelectItem>
                    {entityTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={selectAllFiltered}
                    disabled={filteredEntities.filter(e => e.needs_review).length === 0}
                  >
                    {t('ontologyAudit.actions.selectAll')}
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={handleBulkReclassify}
                    disabled={selectedEntities.size === 0 || processing}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {t('ontologyAudit.actions.applySelected', { count: selectedEntities.size })}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Entities Table */}
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>{t('ontologyAudit.table.entityName')}</TableHead>
                      <TableHead>{t('ontologyAudit.table.currentType')}</TableHead>
                      <TableHead>{t('ontologyAudit.table.suggestedType')}</TableHead>
                      <TableHead>{t('ontologyAudit.table.confidence')}</TableHead>
                      <TableHead>{t('ontologyAudit.table.method')}</TableHead>
                      <TableHead className="text-right">{t('ontologyAudit.table.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntities.filter(e => e.needs_review).map((entity) => (
                      <TableRow key={entity.id} className={selectedEntities.has(entity.id) ? 'bg-muted/50' : ''}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedEntities.has(entity.id)}
                            onChange={() => toggleEntitySelection(entity.id)}
                            className="h-4 w-4"
                          />
                        </TableCell>
                        <TableCell className="font-medium">{entity.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            {entity.current_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              {entity.suggested_type}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>{getConfidenceBadge(entity.confidence)}</TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">{entity.matchedDictionary || entity.matchedPattern || '-'}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleApplySuggestion(entity)}
                              disabled={processing}
                            >
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            </Button>
                            <Dialog open={reclassifyDialogOpen && selectedEntity?.id === entity.id} onOpenChange={(open) => {
                              setReclassifyDialogOpen(open);
                              if (open) {
                                setSelectedEntity(entity);
                                setNewType(entity.suggested_type);
                              }
                            }}>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>{t('ontologyAudit.dialog.reclassifyTitle')}</DialogTitle>
                                  <DialogDescription>
                                    {t('ontologyAudit.dialog.reclassifyDescription', { name: entity.name })}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div>
                                    <label className="text-sm font-medium">{t('ontologyAudit.dialog.currentType')}</label>
                                    <p className="text-muted-foreground">{entity.current_type}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">{t('ontologyAudit.dialog.newType')}</label>
                                    <Select value={newType} onValueChange={setNewType}>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {entityTypes.map(type => (
                                          <SelectItem key={type} value={type}>{type}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setReclassifyDialogOpen(false)}>
                                    {t('common.cancel')}
                                  </Button>
                                  <Button onClick={() => handleReclassify(entity, newType)} disabled={processing}>
                                    {processing ? t('common.processing') : t('ontologyAudit.dialog.apply')}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredEntities.filter(e => e.needs_review).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                          {t('ontologyAudit.empty.noReviewNeeded')}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('ontologyAudit.table.entityName')}</TableHead>
                      <TableHead>{t('ontologyAudit.table.type')}</TableHead>
                      <TableHead>{t('ontologyAudit.table.layer')}</TableHead>
                      <TableHead>{t('ontologyAudit.table.status')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntities.slice(0, 100).map((entity) => (
                      <TableRow key={entity.id}>
                        <TableCell className="font-medium">{entity.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{entity.current_type}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{entity.current_layer}</TableCell>
                        <TableCell>
                          {entity.needs_review ? (
                            <Badge variant="destructive">{t('ontologyAudit.status.needsReview')}</Badge>
                          ) : (
                            <Badge variant="default" className="bg-green-500">{t('ontologyAudit.status.correct')}</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="misclassifications">
          <Card>
            <CardHeader>
              <CardTitle>{t('ontologyAudit.misclassifications.title')}</CardTitle>
              <CardDescription>{t('ontologyAudit.misclassifications.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.misclassified_types && Object.entries(stats.misclassified_types).map(([type, items]) => (
                  <div key={type} className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">{type}</h3>
                    <div className="space-y-2">
                      {items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <Badge variant="outline" className="bg-red-50">{item.current}</Badge>
                          <ChevronRight className="h-4 w-4" />
                          <Badge variant="outline" className="bg-green-50">{item.suggested}</Badge>
                          <span className="text-muted-foreground">({item.count} {t('ontologyAudit.misclassifications.occurrences')})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {(!stats?.misclassified_types || Object.keys(stats.misclassified_types).length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                    {t('ontologyAudit.empty.noMisclassifications')}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="duplicates">
          <TaxonomyDuplicateChecker />
        </TabsContent>

        <TabsContent value="ai-suggestions">
          <AISuggestionPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OntologyAuditTab;
