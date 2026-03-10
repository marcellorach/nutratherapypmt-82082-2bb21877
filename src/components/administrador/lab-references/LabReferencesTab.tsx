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
import { TestTube, Search, Plus, Loader2, Pencil, Trash2, FlaskConical } from 'lucide-react';
import { toast } from 'sonner';

interface LabRef {
  id: string;
  test_name: string;
  species: string;
  unit: string | null;
  min_normal: number | null;
  max_normal: number | null;
  age_group: string | null;
  clinical_significance: string | null;
}

const LabReferencesTab: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [ageFilter, setAgeFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LabRef | null>(null);
  const [form, setForm] = useState<Partial<LabRef>>({
    test_name: '', species: 'canine', unit: '', min_normal: undefined, max_normal: undefined, age_group: 'adult', clinical_significance: ''
  });

  const { data: refs, isLoading } = useQuery({
    queryKey: ['lab-reference-ranges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lab_reference_ranges')
        .select('*')
        .order('test_name');
      if (error) throw error;
      return data as LabRef[];
    }
  });

  const upsertMutation = useMutation({
    mutationFn: async (data: Partial<LabRef>) => {
      if (editing) {
        const { error } = await supabase.from('lab_reference_ranges').update({
          test_name: data.test_name!,
          species: data.species!,
          unit: data.unit || null,
          min_normal: data.min_normal ?? null,
          max_normal: data.max_normal ?? null,
          age_group: data.age_group || 'adult',
          clinical_significance: data.clinical_significance || null,
        }).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('lab_reference_ranges').insert({
          test_name: data.test_name!,
          species: data.species || 'canine',
          unit: data.unit || null,
          min_normal: data.min_normal ?? null,
          max_normal: data.max_normal ?? null,
          age_group: data.age_group || 'adult',
          clinical_significance: data.clinical_significance || null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-reference-ranges'] });
      setDialogOpen(false);
      setEditing(null);
      toast.success(editing ? t('admin.labReferences.updated') : t('admin.labReferences.added'));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('lab_reference_ranges').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-reference-ranges'] });
      toast.success(t('admin.labReferences.deleted'));
    },
  });

  const openAdd = () => {
    setEditing(null);
    setForm({ test_name: '', species: 'canine', unit: '', min_normal: undefined, max_normal: undefined, age_group: 'adult', clinical_significance: '' });
    setDialogOpen(true);
  };

  const openEdit = (ref: LabRef) => {
    setEditing(ref);
    setForm(ref);
    setDialogOpen(true);
  };

  const filtered = refs?.filter(r => {
    const matchSearch = !search || r.test_name.toLowerCase().includes(search.toLowerCase());
    const matchAge = ageFilter === 'all' || r.age_group === ageFilter;
    return matchSearch && matchAge;
  }) || [];

  const uniqueTests = new Set(refs?.map(r => r.test_name) || []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FlaskConical className="h-6 w-6" />
            {t('admin.labReferences.title')}
          </h2>
          <p className="text-muted-foreground">{t('admin.labReferences.description')}</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />
          {t('admin.labReferences.addReference')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{refs?.length || 0}</p><p className="text-sm text-muted-foreground">{t('admin.labReferences.totalRanges')}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{uniqueTests.size}</p><p className="text-sm text-muted-foreground">{t('admin.labReferences.uniqueTests')}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{refs?.filter(r => r.age_group === 'senior').length || 0}</p><p className="text-sm text-muted-foreground">{t('admin.labReferences.seniorSpecific')}</p></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t('admin.labReferences.searchPlaceholder')} value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={ageFilter} onValueChange={setAgeFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin.labReferences.allAges')}</SelectItem>
            <SelectItem value="puppy">{t('admin.labReferences.agePuppy')}</SelectItem>
            <SelectItem value="adult">{t('admin.labReferences.ageAdult')}</SelectItem>
            <SelectItem value="senior">{t('admin.labReferences.ageSenior')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">{t('admin.labReferences.testName')}</th>
                <th className="text-left p-3 font-medium">{t('admin.labReferences.unit')}</th>
                <th className="text-center p-3 font-medium">{t('admin.labReferences.range')}</th>
                <th className="text-center p-3 font-medium">{t('admin.labReferences.ageGroup')}</th>
                <th className="text-left p-3 font-medium">{t('admin.labReferences.significance')}</th>
                <th className="text-right p-3 font-medium">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(ref => (
                <tr key={ref.id} className="border-t hover:bg-muted/30">
                  <td className="p-3 font-medium">{ref.test_name}</td>
                  <td className="p-3 text-muted-foreground">{ref.unit || '-'}</td>
                  <td className="p-3 text-center">
                    {ref.min_normal != null && ref.max_normal != null
                      ? `${ref.min_normal} – ${ref.max_normal}`
                      : ref.min_normal != null ? `≥ ${ref.min_normal}` : ref.max_normal != null ? `≤ ${ref.max_normal}` : '-'}
                  </td>
                  <td className="p-3 text-center"><Badge variant="outline">{ref.age_group}</Badge></td>
                  <td className="p-3 text-muted-foreground text-xs max-w-[200px] truncate">{ref.clinical_significance || '-'}</td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(ref)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(ref.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? t('admin.labReferences.editReference') : t('admin.labReferences.addReference')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>{t('admin.labReferences.testName')}</Label><Input value={form.test_name || ''} onChange={e => setForm(p => ({ ...p, test_name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{t('admin.labReferences.unit')}</Label><Input value={form.unit || ''} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} /></div>
              <div><Label>{t('admin.labReferences.ageGroup')}</Label>
                <Select value={form.age_group || 'adult'} onValueChange={v => setForm(p => ({ ...p, age_group: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="puppy">{t('admin.labReferences.agePuppy')}</SelectItem>
                    <SelectItem value="adult">{t('admin.labReferences.ageAdult')}</SelectItem>
                    <SelectItem value="senior">{t('admin.labReferences.ageSenior')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{t('admin.labReferences.minNormal')}</Label><Input type="number" step="0.01" value={form.min_normal ?? ''} onChange={e => setForm(p => ({ ...p, min_normal: e.target.value ? parseFloat(e.target.value) : undefined }))} /></div>
              <div><Label>{t('admin.labReferences.maxNormal')}</Label><Input type="number" step="0.01" value={form.max_normal ?? ''} onChange={e => setForm(p => ({ ...p, max_normal: e.target.value ? parseFloat(e.target.value) : undefined }))} /></div>
            </div>
            <div><Label>{t('admin.labReferences.significance')}</Label><Textarea value={form.clinical_significance || ''} onChange={e => setForm(p => ({ ...p, clinical_significance: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={() => upsertMutation.mutate(form)} disabled={!form.test_name || upsertMutation.isPending}>
              {upsertMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editing ? t('common.save') : t('common.add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LabReferencesTab;
