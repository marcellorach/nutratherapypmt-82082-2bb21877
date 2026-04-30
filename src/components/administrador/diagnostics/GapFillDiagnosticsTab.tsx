import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, CheckCircle2, Search, Database, RefreshCw, ExternalLink, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

/** Diagnostic view for inspecting the data that feeds the KG Evidence Gap-Fill pipeline */
const GapFillDiagnosticsTab: React.FC = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  // ---- Conditions with their condition_id & name_en status ----
  const conditionsQ = useQuery({
    queryKey: ['gapfill-diag-conditions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('health_conditions')
        .select('id, name, name_en')
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });

  // ---- Nutraceuticals with name_en status ----
  const nutraQ = useQuery({
    queryKey: ['gapfill-diag-nutraceuticals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nutraceuticals')
        .select('id, name, name_en')
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });

  // ---- Pet conditions with join to health_conditions ----
  const petCondsQ = useQuery({
    queryKey: ['gapfill-diag-pet-conditions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pet_conditions')
        .select('id, pet_id, condition_id, condition_name, health_conditions(id, name, name_en)')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
  });

  // ---- Pending gap-fill triplets ----
  const tripletsQ = useQuery({
    queryKey: ['gapfill-diag-pending-triplets'],
    queryFn: async () => {
      const sources = ['pubmed_gap_fill', 'perplexity_gap_fill'];
      const all: any[] = [];
      for (const src of sources) {
        const { data, error } = await supabase
          .from('triplet_extractions')
          .select('id, subject_name, predicate, object_name, extraction_confidence, evidence_level, curation_status, approval_chain, created_at')
          .contains('approval_chain', { source: src })
          .order('created_at', { ascending: false })
          .limit(200);
        if (error) throw error;
        if (data) all.push(...data);
      }
      return all;
    },
  });

  const refetchAll = () => {
    conditionsQ.refetch();
    nutraQ.refetch();
    petCondsQ.refetch();
    tripletsQ.refetch();
  };

  const conditions = conditionsQ.data || [];
  const nutraceuticals = nutraQ.data || [];
  const petConditions = petCondsQ.data || [];
  const triplets = tripletsQ.data || [];

  const condsMissingEn = conditions.filter(c => !c.name_en);
  const nutraMissingEn = nutraceuticals.filter(n => !n.name_en);
  const petCondsMissingLink = petConditions.filter((pc: any) => !pc.condition_id || !pc.health_conditions);

  const filterFn = (item: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return Object.values(item).some(v => String(v || '').toLowerCase().includes(s));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{t('gapFillDiag.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('gapFillDiag.subtitle')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={refetchAll}>
          <RefreshCw className="h-4 w-4 mr-2" /> {t('common.refresh', 'Atualizar')}
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">{t('gapFillDiag.totalConditions')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conditions.length}</div>
            {condsMissingEn.length > 0 && (
              <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                <AlertTriangle className="h-3 w-3" /> {condsMissingEn.length} {t('gapFillDiag.missingNameEn')}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">{t('gapFillDiag.totalNutraceuticals')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nutraceuticals.length}</div>
            {nutraMissingEn.length > 0 && (
              <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                <AlertTriangle className="h-3 w-3" /> {nutraMissingEn.length} {t('gapFillDiag.missingNameEn')}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">{t('gapFillDiag.petConditions')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{petConditions.length}</div>
            {petCondsMissingLink.length > 0 && (
              <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                <XCircle className="h-3 w-3" /> {petCondsMissingLink.length} {t('gapFillDiag.missingConditionId')}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">{t('gapFillDiag.gapFillTriplets')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{triplets.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {triplets.filter((t: any) => t.curation_status === 'pending').length} {t('gapFillDiag.pending')} · {triplets.filter((t: any) => t.curation_status === 'approved').length} {t('gapFillDiag.approved')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder={t('gapFillDiag.searchPlaceholder')}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="conditions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="conditions">
            {t('gapFillDiag.tabConditions')}
            {condsMissingEn.length > 0 && <Badge variant="destructive" className="ml-1.5 text-[9px] h-4 px-1">{condsMissingEn.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="nutraceuticals">
            {t('gapFillDiag.tabNutraceuticals')}
            {nutraMissingEn.length > 0 && <Badge variant="destructive" className="ml-1.5 text-[9px] h-4 px-1">{nutraMissingEn.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="pet-conditions">
            {t('gapFillDiag.tabPetConditions')}
            {petCondsMissingLink.length > 0 && <Badge variant="destructive" className="ml-1.5 text-[9px] h-4 px-1">{petCondsMissingLink.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="triplets">
            {t('gapFillDiag.tabTriplets')}
          </TabsTrigger>
        </TabsList>

        {/* Conditions */}
        <TabsContent value="conditions">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('gapFillDiag.conditionsTitle')}</CardTitle>
              <CardDescription>{t('gapFillDiag.conditionsDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md max-h-[500px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>{t('gapFillDiag.namePt')}</TableHead>
                      <TableHead>name_en</TableHead>
                      <TableHead>{t('gapFillDiag.statusCol')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conditions.filter(filterFn).map((c: any) => (
                      <TableRow key={c.id} className={!c.name_en ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''}>
                        <TableCell className="font-mono text-[10px]">{c.id?.slice(0, 8)}</TableCell>
                        <TableCell>{c.name}</TableCell>
                        <TableCell>{c.name_en || <span className="text-amber-600 italic">{t('gapFillDiag.missing')}</span>}</TableCell>
                        <TableCell>
                          {c.name_en
                            ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            : <AlertTriangle className="h-4 w-4 text-amber-500" />}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Nutraceuticals */}
        <TabsContent value="nutraceuticals">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('gapFillDiag.nutraTitle')}</CardTitle>
              <CardDescription>{t('gapFillDiag.nutraDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md max-h-[500px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>{t('gapFillDiag.namePt')}</TableHead>
                      <TableHead>name_en</TableHead>
                      <TableHead>{t('gapFillDiag.statusCol')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nutraceuticals.filter(filterFn).map((n: any) => (
                      <TableRow key={n.id} className={!n.name_en ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''}>
                        <TableCell className="font-mono text-[10px]">{n.id?.slice(0, 8)}</TableCell>
                        <TableCell>{n.name}</TableCell>
                        <TableCell>{n.name_en || <span className="text-amber-600 italic">{t('gapFillDiag.missing')}</span>}</TableCell>
                        <TableCell>
                          {n.name_en
                            ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            : <AlertTriangle className="h-4 w-4 text-amber-500" />}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pet Conditions */}
        <TabsContent value="pet-conditions">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('gapFillDiag.petCondsTitle')}</CardTitle>
              <CardDescription>{t('gapFillDiag.petCondsDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md max-h-[500px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>pet_id</TableHead>
                      <TableHead>{t('gapFillDiag.conditionName')}</TableHead>
                      <TableHead>condition_id</TableHead>
                      <TableHead>{t('gapFillDiag.linkedCondition')}</TableHead>
                      <TableHead>{t('gapFillDiag.statusCol')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {petConditions.filter(filterFn).map((pc: any) => {
                      const linked = pc.health_conditions;
                      const ok = !!pc.condition_id && !!linked;
                      return (
                        <TableRow key={pc.id} className={!ok ? 'bg-red-50/50 dark:bg-red-950/20' : ''}>
                          <TableCell className="font-mono text-[10px]">{pc.pet_id?.slice(0, 8)}</TableCell>
                          <TableCell>{pc.condition_name || '—'}</TableCell>
                          <TableCell className="font-mono text-[10px]">{pc.condition_id?.slice(0, 8) || <span className="text-destructive">NULL</span>}</TableCell>
                          <TableCell>
                            {linked ? (
                              <span>{linked.name} {linked.name_en ? <Badge variant="outline" className="text-[9px] ml-1">{linked.name_en}</Badge> : <Badge variant="destructive" className="text-[9px] ml-1">no name_en</Badge>}</span>
                            ) : (
                              <span className="text-destructive italic">{t('gapFillDiag.notLinked')}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {ok ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-destructive" />}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gap-Fill Triplets */}
        <TabsContent value="triplets">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('gapFillDiag.tripletsTitle')}</CardTitle>
              <CardDescription>{t('gapFillDiag.tripletsDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md max-h-[500px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('gapFillDiag.subject')}</TableHead>
                      <TableHead>{t('gapFillDiag.predicate')}</TableHead>
                      <TableHead>{t('gapFillDiag.object')}</TableHead>
                      <TableHead>{t('gapFillDiag.source')}</TableHead>
                      <TableHead>{t('gapFillDiag.confidence')}</TableHead>
                      <TableHead>{t('gapFillDiag.statusCol')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {triplets.filter(filterFn).map((tr: any) => {
                      const src = (tr.approval_chain as any)?.source || '?';
                      return (
                        <TableRow key={tr.id}>
                          <TableCell className="font-medium">{tr.subject_name}</TableCell>
                          <TableCell><Badge variant="outline" className="text-[9px]">{tr.predicate}</Badge></TableCell>
                          <TableCell>{tr.object_name}</TableCell>
                          <TableCell>
                            <Badge variant={src.includes('perplexity') ? 'default' : 'secondary'} className="text-[9px]">
                              {src.replace('_gap_fill', '')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">{((tr.extraction_confidence || 0) * 100).toFixed(0)}%</TableCell>
                          <TableCell>
                            <Badge variant={tr.curation_status === 'approved' ? 'default' : tr.curation_status === 'pending' ? 'secondary' : 'destructive'} className="text-[9px]">
                              {tr.curation_status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {triplets.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          {t('gapFillDiag.noTriplets')}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GapFillDiagnosticsTab;