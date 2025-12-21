import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Search,
  Plus,
  Trash2,
  Download,
  Upload,
  Edit3,
  Check,
  X,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface TaxonomyDictionaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: string;
  categoryLabel: string;
  initialTerms?: string[];
}

interface DictionaryTerm {
  id: string;
  term: string;
  term_normalized: string;
  source: string;
  created_at: string;
  isNew?: boolean;
}

const TaxonomyDictionaryDialog: React.FC<TaxonomyDictionaryDialogProps> = ({
  open,
  onOpenChange,
  category,
  categoryLabel,
  initialTerms = []
}) => {
  const { t } = useTranslation();
  const [terms, setTerms] = useState<DictionaryTerm[]>([]);
  const [filteredTerms, setFilteredTerms] = useState<DictionaryTerm[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newTerm, setNewTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [hasDbTerms, setHasDbTerms] = useState(false);

  const normalizeTerm = (term: string): string => {
    return term
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  };

  const loadTerms = useCallback(async () => {
    setLoading(true);
    try {
      // Primeiro tentar carregar do banco
      const { data: dbTerms, error } = await supabase
        .from('taxonomy_dictionaries')
        .select('*')
        .eq('category', category)
        .order('term', { ascending: true });

      if (error) throw error;

      if (dbTerms && dbTerms.length > 0) {
        setTerms(dbTerms);
        setHasDbTerms(true);
      } else {
        // Se não tem no banco, usar os termos iniciais (do arquivo estático)
        const staticTerms: DictionaryTerm[] = initialTerms.map((term, index) => ({
          id: `static_${index}`,
          term,
          term_normalized: normalizeTerm(term),
          source: 'static_file',
          created_at: new Date().toISOString()
        }));
        setTerms(staticTerms);
        setHasDbTerms(false);
      }
    } catch (error) {
      console.error('Erro ao carregar termos:', error);
      // Fallback para termos estáticos
      const staticTerms: DictionaryTerm[] = initialTerms.map((term, index) => ({
        id: `static_${index}`,
        term,
        term_normalized: normalizeTerm(term),
        source: 'static_file',
        created_at: new Date().toISOString()
      }));
      setTerms(staticTerms);
      setHasDbTerms(false);
    } finally {
      setLoading(false);
    }
  }, [category, initialTerms]);

  useEffect(() => {
    if (open) {
      loadTerms();
      setSearchTerm('');
      setNewTerm('');
      setEditingId(null);
    }
  }, [open, loadTerms]);

  useEffect(() => {
    if (searchTerm) {
      const normalized = normalizeTerm(searchTerm);
      setFilteredTerms(terms.filter(t => t.term_normalized.includes(normalized)));
    } else {
      setFilteredTerms(terms);
    }
  }, [searchTerm, terms]);

  const handleAddTerm = async () => {
    if (!newTerm.trim()) return;

    const normalized = normalizeTerm(newTerm);
    
    // Verificar duplicatas
    if (terms.some(t => t.term_normalized === normalized)) {
      toast.error(t('taxonomyDialog.errors.duplicate'));
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('taxonomy_dictionaries')
        .insert({
          category,
          term: newTerm.trim(),
          term_normalized: normalized,
          source: 'manual'
        })
        .select()
        .single();

      if (error) throw error;

      setTerms(prev => [...prev, { ...data, isNew: true }]);
      setNewTerm('');
      setHasDbTerms(true);
      toast.success(t('taxonomyDialog.success.added'));
    } catch (error) {
      console.error('Erro ao adicionar termo:', error);
      toast.error(t('taxonomyDialog.errors.addFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTerm = async (term: DictionaryTerm) => {
    if (term.id.startsWith('static_')) {
      toast.error(t('taxonomyDialog.errors.cannotDeleteStatic'));
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('taxonomy_dictionaries')
        .delete()
        .eq('id', term.id);

      if (error) throw error;

      setTerms(prev => prev.filter(t => t.id !== term.id));
      toast.success(t('taxonomyDialog.success.deleted'));
    } catch (error) {
      console.error('Erro ao excluir termo:', error);
      toast.error(t('taxonomyDialog.errors.deleteFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleEditTerm = async (term: DictionaryTerm) => {
    if (!editValue.trim() || editValue.trim() === term.term) {
      setEditingId(null);
      return;
    }

    if (term.id.startsWith('static_')) {
      toast.error(t('taxonomyDialog.errors.cannotEditStatic'));
      return;
    }

    const normalized = normalizeTerm(editValue);
    
    // Verificar duplicatas
    if (terms.some(t => t.term_normalized === normalized && t.id !== term.id)) {
      toast.error(t('taxonomyDialog.errors.duplicate'));
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('taxonomy_dictionaries')
        .update({
          term: editValue.trim(),
          term_normalized: normalized
        })
        .eq('id', term.id);

      if (error) throw error;

      setTerms(prev => prev.map(t => 
        t.id === term.id 
          ? { ...t, term: editValue.trim(), term_normalized: normalized }
          : t
      ));
      setEditingId(null);
      toast.success(t('taxonomyDialog.success.updated'));
    } catch (error) {
      console.error('Erro ao atualizar termo:', error);
      toast.error(t('taxonomyDialog.errors.updateFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleMigrateToDb = async () => {
    if (hasDbTerms) return;

    setSaving(true);
    try {
      const termsToInsert = terms.map(t => ({
        category,
        term: t.term,
        term_normalized: t.term_normalized,
        source: 'initial_seed'
      }));

      const { error } = await supabase
        .from('taxonomy_dictionaries')
        .insert(termsToInsert);

      if (error) throw error;

      setHasDbTerms(true);
      await loadTerms();
      toast.success(t('taxonomyDialog.success.migrated', { count: terms.length }));
    } catch (error) {
      console.error('Erro ao migrar termos:', error);
      toast.error(t('taxonomyDialog.errors.migrateFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    const exportData = {
      category,
      exported_at: new Date().toISOString(),
      terms: terms.map(t => t.term)
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taxonomy-${category}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('taxonomyDialog.success.exported'));
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.txt,.csv';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const text = await file.text();
      let importedTerms: string[] = [];

      try {
        if (file.name.endsWith('.json')) {
          const data = JSON.parse(text);
          importedTerms = Array.isArray(data) ? data : (data.terms || []);
        } else {
          // CSV ou TXT: uma linha por termo
          importedTerms = text.split('\n').map(line => line.trim()).filter(Boolean);
        }

        if (importedTerms.length === 0) {
          toast.error(t('taxonomyDialog.errors.emptyImport'));
          return;
        }

        // Filtrar duplicatas
        const existingNormalized = new Set(terms.map(t => t.term_normalized));
        const newTerms = importedTerms.filter(term => 
          !existingNormalized.has(normalizeTerm(term))
        );

        if (newTerms.length === 0) {
          toast.info(t('taxonomyDialog.info.allDuplicates'));
          return;
        }

        setSaving(true);
        const termsToInsert = newTerms.map(term => ({
          category,
          term: term.trim(),
          term_normalized: normalizeTerm(term),
          source: 'imported'
        }));

        const { error } = await supabase
          .from('taxonomy_dictionaries')
          .insert(termsToInsert);

        if (error) throw error;

        setHasDbTerms(true);
        await loadTerms();
        toast.success(t('taxonomyDialog.success.imported', { count: newTerms.length }));
      } catch (error) {
        console.error('Erro ao importar:', error);
        toast.error(t('taxonomyDialog.errors.importFailed'));
      } finally {
        setSaving(false);
      }
    };
    input.click();
  };

  const startEdit = (term: DictionaryTerm) => {
    setEditingId(term.id);
    setEditValue(term.term);
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'manual':
        return <Badge variant="outline" className="text-xs">{t('taxonomyDialog.sources.manual')}</Badge>;
      case 'imported':
        return <Badge variant="secondary" className="text-xs">{t('taxonomyDialog.sources.imported')}</Badge>;
      case 'initial_seed':
        return <Badge variant="default" className="text-xs">{t('taxonomyDialog.sources.seed')}</Badge>;
      case 'static_file':
        return <Badge variant="outline" className="text-xs text-yellow-600">{t('taxonomyDialog.sources.static')}</Badge>;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {t('taxonomyDialog.title', { category: categoryLabel })}
            <Badge variant="secondary">{terms.length}</Badge>
          </DialogTitle>
          <DialogDescription>
            {t('taxonomyDialog.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Aviso se está usando dados estáticos */}
          {!hasDbTerms && terms.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-yellow-700 dark:text-yellow-400 flex-1">
                {t('taxonomyDialog.staticWarning')}
              </span>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleMigrateToDb}
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {t('taxonomyDialog.actions.migrate')}
              </Button>
            </div>
          )}

          {/* Barra de ações */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('taxonomyDialog.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="icon" onClick={loadTerms} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="outline" size="icon" onClick={handleExport}>
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleImport} disabled={saving}>
              <Upload className="h-4 w-4" />
            </Button>
          </div>

          {/* Adicionar novo termo */}
          <div className="flex gap-2">
            <Input
              placeholder={t('taxonomyDialog.addPlaceholder')}
              value={newTerm}
              onChange={(e) => setNewTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTerm()}
            />
            <Button onClick={handleAddTerm} disabled={!newTerm.trim() || saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {t('taxonomyDialog.actions.add')}
            </Button>
          </div>

          <Separator />

          {/* Lista de termos */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ScrollArea className="flex-1 min-h-0">
              <div className="space-y-1 pr-4">
                {filteredTerms.map(term => (
                  <div 
                    key={term.id} 
                    className={`flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors ${
                      term.isNew ? 'bg-green-500/10' : ''
                    }`}
                  >
                    {editingId === term.id ? (
                      <>
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="flex-1 h-8"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEditTerm(term);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                        />
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8"
                          onClick={() => handleEditTerm(term)}
                        >
                          <Check className="h-4 w-4 text-green-500" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8"
                          onClick={() => setEditingId(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm">{term.term}</span>
                        {getSourceBadge(term.source)}
                        {!term.id.startsWith('static_') && (
                          <>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8"
                              onClick={() => startEdit(term)}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteTerm(term)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                ))}
                {filteredTerms.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    {searchTerm 
                      ? t('taxonomyDialog.noResults') 
                      : t('taxonomyDialog.empty')
                    }
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mr-auto">
            {t('taxonomyDialog.footer.showing', { 
              filtered: filteredTerms.length, 
              total: terms.length 
            })}
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TaxonomyDictionaryDialog;
