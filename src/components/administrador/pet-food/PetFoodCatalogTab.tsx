import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Apple, CheckCircle2, Clock, XCircle, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  CANINE_NUTRIENT_REQUIREMENTS,
  LIFE_STAGE_LABEL,
  SIZE_LABEL,
  NUTRITION_TOPICS,
  type LifeStage,
  type SizeGroup,
} from '@/data/nutritionRequirementsCanine';

type Brand = { id: string; name: string; manufacturer: string | null; country: string | null; website: string | null };
type NutritionRow = Record<string, any> & {
  id: string;
  completeness_score: number | null;
  confidence: number | null;
  verified: boolean;
  source?: string | null;
};
type Product = {
  id: string; brand_id: string; name: string; line: string | null;
  species: string; life_stage: string | null; size_target: string | null;
  food_form: string | null; is_prescription: boolean;
  prescription_indication: string[] | null;
  submission_status: 'pending' | 'approved' | 'rejected';
  pet_food_brands?: { name: string };
  pet_food_nutrition?: NutritionRow[];
};

const STATUS_ICON: Record<string, JSX.Element> = {
  approved: <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />,
  pending: <Clock className="h-3.5 w-3.5 text-amber-500" />,
  rejected: <XCircle className="h-3.5 w-3.5 text-red-600" />,
};

// --- Nutrient tag rendering -------------------------------------------------
// Maps DB columns to short bilingual labels + units. Only non-null values
// surface as <Badge> tags inline on each product card (no clicks).
const NUTRIENT_TAGS: Array<{ key: string; pt: string; en: string; unit: string }> = [
  { key: 'protein_pct', pt: 'Prot', en: 'Prot', unit: '%' },
  { key: 'fat_pct', pt: 'Gord', en: 'Fat', unit: '%' },
  { key: 'fiber_pct', pt: 'Fibra', en: 'Fiber', unit: '%' },
  { key: 'moisture_pct', pt: 'Umid', en: 'Moist', unit: '%' },
  { key: 'ash_pct', pt: 'Cinz', en: 'Ash', unit: '%' },
  { key: 'kcal_per_kg', pt: 'kcal/kg', en: 'kcal/kg', unit: '' },
  { key: 'calcium_pct', pt: 'Ca', en: 'Ca', unit: '%' },
  { key: 'phosphorus_pct', pt: 'P', en: 'P', unit: '%' },
  { key: 'ca_p_ratio', pt: 'Ca:P', en: 'Ca:P', unit: '' },
  { key: 'sodium_pct', pt: 'Na', en: 'Na', unit: '%' },
  { key: 'potassium_pct', pt: 'K', en: 'K', unit: '%' },
  { key: 'magnesium_pct', pt: 'Mg', en: 'Mg', unit: '%' },
  { key: 'omega3_pct', pt: 'n3', en: 'n3', unit: '%' },
  { key: 'omega6_pct', pt: 'n6', en: 'n6', unit: '%' },
  { key: 'omega6_omega3_ratio', pt: 'n6:n3', en: 'n6:n3', unit: '' },
  { key: 'epa_pct', pt: 'EPA', en: 'EPA', unit: '%' },
  { key: 'dha_pct', pt: 'DHA', en: 'DHA', unit: '%' },
  { key: 'lysine_pct', pt: 'Lis', en: 'Lys', unit: '%' },
  { key: 'methionine_pct', pt: 'Met', en: 'Met', unit: '%' },
  { key: 'taurine_mg_per_kg', pt: 'Tau', en: 'Tau', unit: 'mg/kg' },
  { key: 'l_carnitine_mg_per_kg', pt: 'L-Carn', en: 'L-Carn', unit: 'mg/kg' },
  { key: 'glucosamine_mg_per_kg', pt: 'Glico', en: 'Gluco', unit: 'mg/kg' },
  { key: 'chondroitin_mg_per_kg', pt: 'Cond', en: 'Chond', unit: 'mg/kg' },
  { key: 'vit_a_iu_per_kg', pt: 'Vit A', en: 'Vit A', unit: 'UI/kg' },
  { key: 'vit_d3_iu_per_kg', pt: 'Vit D3', en: 'Vit D3', unit: 'UI/kg' },
  { key: 'vit_e_iu_per_kg', pt: 'Vit E', en: 'Vit E', unit: 'UI/kg' },
  { key: 'zinc_mg_per_kg', pt: 'Zn', en: 'Zn', unit: 'mg/kg' },
  { key: 'iron_mg_per_kg', pt: 'Fe', en: 'Fe', unit: 'mg/kg' },
  { key: 'copper_mg_per_kg', pt: 'Cu', en: 'Cu', unit: 'mg/kg' },
];

function NutrientTags({ n, lang }: { n: NutritionRow | undefined; lang: 'pt' | 'en' }) {
  if (!n) return null;
  const tags = NUTRIENT_TAGS
    .map((t) => ({ ...t, value: n[t.key] }))
    .filter((t) => t.value != null && t.value !== '');
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {tags.map((t) => (
        <Badge key={t.key} variant="outline" className="text-[10px] font-normal px-1.5 py-0">
          {(lang === 'en' ? t.en : t.pt)} {t.value}{t.unit ? ` ${t.unit}` : ''}
        </Badge>
      ))}
    </div>
  );
}

export default function PetFoodCatalogTab() {
  const { i18n, t } = useTranslation();
  const lang = (i18n.language?.startsWith('en') ? 'en' : 'pt') as 'pt' | 'en';
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const brandsQuery = useQuery({
    queryKey: ['pet-food-brands'],
    queryFn: async () => {
      const { data, error } = await supabase.from('pet_food_brands').select('*').order('name');
      if (error) throw error;
      return data as Brand[];
    },
  });

  const productsQuery = useQuery({
    queryKey: ['pet-food-products', statusFilter, search],
    queryFn: async () => {
      let q = supabase
        .from('pet_food_products')
        .select('*, pet_food_brands(name), pet_food_nutrition(*)')
        .order('created_at', { ascending: false })
        .limit(500);
      if (statusFilter !== 'all') q = q.eq('submission_status', statusFilter);
      if (search) q = q.ilike('name', `%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as Product[];
    },
  });

  // ---- Background auto-enrichment ----------------------------------------
  // Any product without nutrition or with completeness <0.4 is enriched once
  // per session (set of tried IDs avoids infinite loops).
  const triedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const list = productsQuery.data;
    if (!list || list.length === 0) return;
    const needs = list.filter((p) => {
      if (triedRef.current.has(p.id)) return false;
      const n = p.pet_food_nutrition?.[0];
      const score = n?.completeness_score ?? 0;
      return !n || score < 0.4;
    });
    if (needs.length === 0) return;
    (async () => {
      for (let i = 0; i < needs.length; i += 3) {
        const batch = needs.slice(i, i + 3);
        await Promise.all(
          batch.map(async (p) => {
            triedRef.current.add(p.id);
            try {
              await supabase.functions.invoke('enrich-pet-food-product', { body: { product_id: p.id } });
            } catch {
              // silent; tag will simply stay missing
            }
          }),
        );
      }
      qc.invalidateQueries({ queryKey: ['pet-food-products'] });
    })();
  }, [productsQuery.data, qc]);

  const enrichingCount = useMemo(() => {
    if (!productsQuery.data) return 0;
    return productsQuery.data.filter((p) => {
      const n = p.pet_food_nutrition?.[0];
      return triedRef.current.has(p.id) && (!n || (n.completeness_score ?? 0) < 0.4);
    }).length;
  }, [productsQuery.data]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Apple className="h-5 w-5" /> {t('admin.nutrition.title', 'Nutrition')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('admin.nutrition.subtitle', 'Catálogo de rações, tabela oficial de requisitos nutricionais caninos e questões nutricionais relevantes.')}
          </p>
        </div>
      </div>

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">{t('admin.nutrition.tabs.products', 'Rações')}</TabsTrigger>
          <TabsTrigger value="requirements">{t('admin.nutrition.tabs.requirements', 'Tabela nutricional (raça · porte · idade)')}</TabsTrigger>
          <TabsTrigger value="other">{t('admin.nutrition.tabs.other', 'Outras questões nutricionais')}</TabsTrigger>
        </TabsList>

        {/* ============== TAB 1: PRODUCTS ============== */}
        <TabsContent value="products" className="space-y-3">
          <div className="flex gap-2 items-center justify-between flex-wrap">
            <div className="flex gap-2 items-center">
              <Input placeholder={t('admin.nutrition.searchPlaceholder', 'Buscar produto...')} value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin.nutrition.statusAll', 'Todos os status')}</SelectItem>
                  <SelectItem value="approved">{t('admin.nutrition.statusApproved', 'Aprovados')}</SelectItem>
                  <SelectItem value="pending">{t('admin.nutrition.statusPending', 'Pendentes')}</SelectItem>
                  <SelectItem value="rejected">{t('admin.nutrition.statusRejected', 'Rejeitados')}</SelectItem>
                </SelectContent>
              </Select>
              {enrichingCount > 0 && (
                <Badge variant="secondary" className="text-[10px] gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {t('admin.nutrition.enriching', 'Enriquecendo {{n}} em background…', { n: enrichingCount })}
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <NewBrandDialog onCreated={() => qc.invalidateQueries({ queryKey: ['pet-food-brands'] })} />
              <NewProductDialog
                brands={brandsQuery.data ?? []}
                onCreated={(id) => {
                  qc.invalidateQueries({ queryKey: ['pet-food-products'] });
                  if (id) {
                    triedRef.current.add(id);
                    supabase.functions.invoke('enrich-pet-food-product', { body: { product_id: id } })
                      .then(() => qc.invalidateQueries({ queryKey: ['pet-food-products'] }))
                      .catch(() => {});
                  }
                }}
              />
            </div>
          </div>

          {productsQuery.isLoading && <p className="text-sm text-muted-foreground">{t('admin.nutrition.loading', 'Carregando…')}</p>}
          {productsQuery.data?.length === 0 && (
            <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">
              {t('admin.nutrition.emptyProducts', 'Nenhum produto cadastrado ainda. Use "Novo Produto" para começar a popular o catálogo.')}
            </CardContent></Card>
          )}

          <div className="grid gap-2">
            {productsQuery.data?.map((p) => {
              const n = p.pet_food_nutrition?.[0];
              const score = n?.completeness_score ?? 0;
              return (
                <Card key={p.id}>
                  <CardContent className="py-3 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {STATUS_ICON[p.submission_status]}
                        <span className="font-medium">{p.pet_food_brands?.name}</span>
                        <span className="text-muted-foreground">·</span>
                        <span>{p.name}</span>
                        {p.is_prescription && <Badge variant="destructive" className="text-[10px]">{t('admin.nutrition.prescription', 'Prescrição')}</Badge>}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1 flex-wrap">
                        <Badge variant="outline" className="text-[10px]">{p.species}</Badge>
                        {p.life_stage && <Badge variant="outline" className="text-[10px]">{p.life_stage}</Badge>}
                        {p.size_target && <Badge variant="outline" className="text-[10px]">{p.size_target}</Badge>}
                        {p.food_form && <Badge variant="outline" className="text-[10px]">{p.food_form}</Badge>}
                        {p.prescription_indication?.map((i) => (
                          <Badge key={i} variant="secondary" className="text-[10px]">{i}</Badge>
                        ))}
                        {n && (
                          <Badge variant="secondary" className="text-[10px]">
                            {Math.round(score * 100)}% {t('admin.nutrition.composition', 'composição')}
                            {n.confidence != null && ` · conf ${Math.round((n.confidence ?? 0) * 100)}%`}
                          </Badge>
                        )}
                        {!n && triedRef.current.has(p.id) && (
                          <Badge variant="outline" className="text-[10px] gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            {t('admin.nutrition.fetchingNutrients', 'buscando nutrientes…')}
                          </Badge>
                        )}
                      </div>
                      <NutrientTags n={n} lang={lang} />
                    </div>
                    <ProductActions product={p} onChanged={() => qc.invalidateQueries({ queryKey: ['pet-food-products'] })} />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ============== TAB 2: REQUIREMENTS ============== */}
        <TabsContent value="requirements">
          <RequirementsTable lang={lang} />
        </TabsContent>

        {/* ============== TAB 3: OTHER ============== */}
        <TabsContent value="other">
          <div className="grid gap-3 md:grid-cols-2">
            {NUTRITION_TOPICS.map((topic) => (
              <Card key={topic.id}>
                <CardHeader className="pb-2"><CardTitle className="text-base">{lang === 'en' ? topic.title_en : topic.title}</CardTitle></CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {lang === 'en' ? topic.body_en : topic.body}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// --- Requirements table (static AAFCO/FEDIAF/NRC reference) ----------------
function RequirementsTable({ lang }: { lang: 'pt' | 'en' }) {
  const { t } = useTranslation();
  const [stage, setStage] = useState<LifeStage | 'all'>('adult');
  const [size, setSize] = useState<SizeGroup | 'all_filter'>('all_filter');

  const rows = useMemo(() => {
    return CANINE_NUTRIENT_REQUIREMENTS.filter((r) => {
      if (stage !== 'all' && r.stage !== stage) return false;
      if (size !== 'all_filter' && r.size !== size && r.size !== 'all') return false;
      return true;
    });
  }, [stage, size]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={stage} onValueChange={(v) => setStage(v as any)}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin.nutrition.allStages', 'Todos os estágios')}</SelectItem>
            {(['puppy', 'adult', 'gestation_lactation', 'senior'] as LifeStage[]).map((s) => (
              <SelectItem key={s} value={s}>{LIFE_STAGE_LABEL[s][lang]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={size} onValueChange={(v) => setSize(v as any)}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all_filter">{t('admin.nutrition.allSizes', 'Todos os portes')}</SelectItem>
            {(['small', 'medium', 'large', 'giant'] as SizeGroup[]).map((s) => (
              <SelectItem key={s} value={s}>{SIZE_LABEL[s][lang]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs">
              <tr>
                <th className="text-left px-3 py-2">{t('admin.nutrition.col.nutrient', 'Nutriente')}</th>
                <th className="text-left px-3 py-2">{t('admin.nutrition.col.stage', 'Estágio')}</th>
                <th className="text-left px-3 py-2">{t('admin.nutrition.col.size', 'Porte')}</th>
                <th className="text-right px-3 py-2">{t('admin.nutrition.col.min', 'Mín')}</th>
                <th className="text-right px-3 py-2">{t('admin.nutrition.col.max', 'Máx')}</th>
                <th className="text-left px-3 py-2">{t('admin.nutrition.col.unit', 'Unidade')}</th>
                <th className="text-left px-3 py-2">{t('admin.nutrition.col.source', 'Fonte')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={idx} className="border-t">
                  <td className="px-3 py-2 font-medium">
                    {lang === 'en' ? r.nutrient_en : r.nutrient}
                    {(r.note || r.note_en) && (
                      <div className="text-[11px] text-muted-foreground font-normal italic">
                        {lang === 'en' ? r.note_en : r.note}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{LIFE_STAGE_LABEL[r.stage][lang]}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{SIZE_LABEL[r.size][lang]}</td>
                  <td className="px-3 py-2 text-right">{r.min ?? '—'}</td>
                  <td className="px-3 py-2 text-right">{r.max ?? '—'}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{r.unit}</td>
                  <td className="px-3 py-2"><Badge variant="outline" className="text-[10px]">{r.source}</Badge></td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={7} className="px-3 py-6 text-center text-sm text-muted-foreground">
                  {t('admin.nutrition.noRows', 'Nenhum requisito para os filtros selecionados.')}
                </td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <p className="text-[11px] text-muted-foreground">
        {t('admin.nutrition.sources', 'Fontes: AAFCO 2024 Dog Food Nutrient Profiles · FEDIAF Nutritional Guidelines 2024 · NRC Nutrient Requirements of Dogs and Cats (2006).')}
      </p>
    </div>
  );
}

function ProductActions({ product, onChanged }: { product: Product; onChanged: () => void }) {
  const { t } = useTranslation();
  const setStatus = async (status: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('pet_food_products')
      .update({ submission_status: status, reviewed_at: new Date().toISOString() })
      .eq('id', product.id);
    if (error) toast.error(error.message);
    else { toast.success(status === 'approved' ? t('admin.nutrition.approved', 'Produto aprovado') : t('admin.nutrition.rejected', 'Produto rejeitado')); onChanged(); }
  };
  if (product.submission_status !== 'pending') return null;
  return (
    <div className="flex gap-1 shrink-0">
      <Button size="sm" variant="outline" onClick={() => setStatus('approved')}>{t('admin.nutrition.approve', 'Aprovar')}</Button>
      <Button size="sm" variant="ghost" onClick={() => setStatus('rejected')}>{t('admin.nutrition.reject', 'Rejeitar')}</Button>
    </div>
  );
}

function NewBrandDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [country, setCountry] = useState('');
  const [website, setWebsite] = useState('');
  const submit = async () => {
    if (!name.trim()) return;
    const { error } = await supabase.from('pet_food_brands').insert({
      name: name.trim(), manufacturer: manufacturer || null, country: country || null, website: website || null,
    });
    if (error) toast.error(error.message);
    else { toast.success('Marca criada'); setOpen(false); setName(''); setManufacturer(''); setCountry(''); setWebsite(''); onCreated(); }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline"><Plus className="h-4 w-4 mr-1" />Marca</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Nova marca</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome*</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label>Fabricante</Label><Input value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} /></div>
          <div><Label>País</Label><Input value={country} onChange={(e) => setCountry(e.target.value)} /></div>
          <div><Label>Website</Label><Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." /></div>
        </div>
        <DialogFooter><Button onClick={submit}>Salvar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewProductDialog({ brands, onCreated }: { brands: Brand[]; onCreated: (newId?: string) => void }) {
  const [open, setOpen] = useState(false);
  const [brandId, setBrandId] = useState('');
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('dog');
  const [lifeStage, setLifeStage] = useState<string>('adult');
  const [foodForm, setFoodForm] = useState<string>('dry_kibble');
  const [isPrescription, setIsPrescription] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!brandId || !name.trim()) { toast.error('Marca e nome são obrigatórios'); return; }
    setBusy(true);
    try {
      const { data: prod, error } = await supabase.from('pet_food_products').insert({
        brand_id: brandId, name: name.trim(), species, life_stage: lifeStage, food_form: foodForm,
        is_prescription: isPrescription, submission_status: 'approved',
      }).select('id').single();
      if (error) { toast.error(error.message); return; }
      toast.success('Produto criado — buscando composição com IA…');
      setOpen(false);
      onCreated(prod.id);
      setBrandId(''); setName('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Produto</Button></DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> Novo produto
          </DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          Apenas informações básicas — a composição nutricional completa será buscada automaticamente via IA após o cadastro.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>Marca*</Label>
            <Select value={brandId} onValueChange={setBrandId}>
              <SelectTrigger><SelectValue placeholder="Selecione a marca" /></SelectTrigger>
              <SelectContent>{brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="col-span-2"><Label>Nome do produto*</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Maxi Adult" /></div>
          <div>
            <Label>Espécie</Label>
            <Select value={species} onValueChange={setSpecies}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="dog">Cão</SelectItem>
                <SelectItem value="cat">Gato</SelectItem>
                <SelectItem value="both">Ambos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Fase de vida</Label>
            <Select value={lifeStage} onValueChange={setLifeStage}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="puppy">Filhote</SelectItem>
                <SelectItem value="adult">Adulto</SelectItem>
                <SelectItem value="senior">Sênior</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Forma</Label>
            <Select value={foodForm} onValueChange={setFoodForm}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="dry_kibble">Ração seca</SelectItem>
                <SelectItem value="wet">Úmida/sachê</SelectItem>
                <SelectItem value="semi_moist">Semi-úmida</SelectItem>
                <SelectItem value="raw">Crua/BARF</SelectItem>
                <SelectItem value="freeze_dried">Liofilizada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <input type="checkbox" id="rx" checked={isPrescription} onChange={(e) => setIsPrescription(e.target.checked)} />
            <Label htmlFor="rx">Linha terapêutica (prescrição)</Label>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
            Salvar e buscar composição
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
