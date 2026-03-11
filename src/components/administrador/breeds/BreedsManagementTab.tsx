import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PawPrint, Search, Plus, ChevronDown, ChevronRight, Loader2, AlertTriangle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import BreedPredispositionsPanel from './BreedPredispositionsPanel';
import PredispositionTag from '@/components/administrador/tags/PredispositionTag';

interface Breed {
  id: string;
  name: string;
  name_en: string;
  description: string | null;
  description_en: string | null;
  size_category: string | null;
  average_weight_kg: number | null;
  average_lifespan_years: number | null;
  breed_group_id: string;
}

const BreedsManagementTab: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [sizeFilter, setSizeFilter] = useState<string>('all');
  const [expandedBreed, setExpandedBreed] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newBreed, setNewBreed] = useState({ name: '', name_en: '', size_category: 'medium', description: '' });

  // Fetch breeds with full predisposition data for inline tags
  const { data: breeds, isLoading } = useQuery({
    queryKey: ['admin-breeds'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('breeds')
        .select('*, breed_predispositions(id, risk_factor, evidence_grade, notes, health_conditions:condition_id(id, name, name_en))')
        .order('name');
      if (error) throw error;
      return data as (Breed & { breed_predispositions: any[] })[];
    }
  });

  // Fetch breed groups for the add dialog
  const { data: breedGroups } = useQuery({
    queryKey: ['breed-groups'],
    queryFn: async () => {
      const { data, error } = await supabase.from('breed_groups').select('*').order('name');
      if (error) throw error;
      return data;
    }
  });

  const addBreedMutation = useMutation({
    mutationFn: async (breed: typeof newBreed & { breed_group_id: string }) => {
      const { error } = await supabase.from('breeds').insert({
        name: breed.name,
        name_en: breed.name_en || breed.name,
        size_category: breed.size_category,
        description: breed.description || null,
        breed_group_id: breed.breed_group_id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-breeds'] });
      setAddDialogOpen(false);
      setNewBreed({ name: '', name_en: '', size_category: 'medium', description: '' });
      toast.success(t('admin.breeds.addSuccess'));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = breeds?.filter(b => {
    const matchSearch = !search || b.name.toLowerCase().includes(search.toLowerCase()) || b.name_en.toLowerCase().includes(search.toLowerCase());
    const matchSize = sizeFilter === 'all' || b.size_category === sizeFilter;
    return matchSearch && matchSize;
  }) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <PawPrint className="h-6 w-6" />
            {t('admin.breeds.title')}
          </h2>
          <p className="text-muted-foreground">{t('admin.breeds.description')}</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('admin.breeds.addBreed')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('admin.breeds.searchPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={sizeFilter} onValueChange={setSizeFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={t('admin.breeds.allSizes')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin.breeds.allSizes')}</SelectItem>
            <SelectItem value="small">{t('admin.breeds.sizeSmall')}</SelectItem>
            <SelectItem value="medium">{t('admin.breeds.sizeMedium')}</SelectItem>
            <SelectItem value="large">{t('admin.breeds.sizeLarge')}</SelectItem>
            <SelectItem value="giant">{t('admin.breeds.sizeGiant')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{breeds?.length || 0}</p><p className="text-sm text-muted-foreground">{t('admin.breeds.totalBreeds')}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{breeds?.filter(b => b.size_category === 'small').length || 0}</p><p className="text-sm text-muted-foreground">{t('admin.breeds.sizeSmall')}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{breeds?.filter(b => b.size_category === 'large').length || 0}</p><p className="text-sm text-muted-foreground">{t('admin.breeds.sizeLarge')}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{breeds?.reduce((sum, b) => sum + (b.breed_predispositions?.[0]?.count || 0), 0) || 0}</p><p className="text-sm text-muted-foreground">{t('admin.breeds.totalPredispositions')}</p></CardContent></Card>
      </div>

      {/* Breed List */}
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">{t('admin.breeds.noResults')}</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(breed => {
            const isExpanded = expandedBreed === breed.id;
            const preds = breed.breed_predispositions || [];
            const predCount = preds.length;
            // Sort by risk_factor descending
            const sortedPreds = [...preds].sort((a, b) => (b.risk_factor || 0) - (a.risk_factor || 0));
            return (
              <Card key={breed.id}>
                <CardContent className="p-0">
                  <div className="p-4 space-y-3">
                    {/* Header row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <PawPrint className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{breed.name}</p>
                          <p className="text-sm text-muted-foreground">{breed.name_en}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {breed.size_category && (
                          <Badge variant="outline">{breed.size_category}</Badge>
                        )}
                        {breed.average_weight_kg && (
                          <span className="text-sm text-muted-foreground">{breed.average_weight_kg}kg</span>
                        )}
                      </div>
                    </div>

                    {/* Inline predisposition tags */}
                    {predCount > 0 && (
                      <div className="flex flex-wrap gap-2 pl-8">
                        {sortedPreds.map((pred: any) => (
                          <PredispositionTag
                            key={pred.id}
                            conditionName={pred.health_conditions?.name || t('common.unknown')}
                            riskFactor={pred.risk_factor}
                            evidenceGrade={pred.evidence_grade}
                            conditionId={pred.health_conditions?.id}
                            notes={pred.notes}
                            navigable
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Expand for management */}
                  <button
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 border-t text-xs text-muted-foreground hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedBreed(isExpanded ? null : breed.id)}
                  >
                    {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    {isExpanded ? t('common.collapse') : t('admin.breeds.managePredispositions', { count: predCount })}
                  </button>
                  {isExpanded && (
                    <div className="border-t p-4">
                      <BreedPredispositionsPanel breedId={breed.id} breedName={breed.name} />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Breed Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.breeds.addBreed')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('admin.breeds.form.name')}</Label>
              <Input value={newBreed.name} onChange={e => setNewBreed(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <Label>{t('admin.breeds.form.nameEn')}</Label>
              <Input value={newBreed.name_en} onChange={e => setNewBreed(p => ({ ...p, name_en: e.target.value }))} />
            </div>
            <div>
              <Label>{t('admin.breeds.form.size')}</Label>
              <Select value={newBreed.size_category} onValueChange={v => setNewBreed(p => ({ ...p, size_category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">{t('admin.breeds.sizeSmall')}</SelectItem>
                  <SelectItem value="medium">{t('admin.breeds.sizeMedium')}</SelectItem>
                  <SelectItem value="large">{t('admin.breeds.sizeLarge')}</SelectItem>
                  <SelectItem value="giant">{t('admin.breeds.sizeGiant')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('admin.breeds.form.breedGroup')}</Label>
              <Select onValueChange={v => setNewBreed(p => ({ ...p, breed_group_id: v } as any))}>
                <SelectTrigger><SelectValue placeholder={t('admin.breeds.form.selectGroup')} /></SelectTrigger>
                <SelectContent>
                  {breedGroups?.map(g => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('common.description')}</Label>
              <Textarea value={newBreed.description} onChange={e => setNewBreed(p => ({ ...p, description: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button
              onClick={() => addBreedMutation.mutate({ ...newBreed, breed_group_id: (newBreed as any).breed_group_id })}
              disabled={!newBreed.name || !(newBreed as any).breed_group_id || addBreedMutation.isPending}
            >
              {addBreedMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('common.add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BreedsManagementTab;
