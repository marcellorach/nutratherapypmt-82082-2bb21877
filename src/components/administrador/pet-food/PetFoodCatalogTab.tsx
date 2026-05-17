import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Database, CheckCircle2, Clock, XCircle, Sparkles, Loader2, FlaskConical } from 'lucide-react';
import { toast } from 'sonner';

type Brand = { id: string; name: string; manufacturer: string | null; country: string | null; website: string | null };
type Product = {
  id: string; brand_id: string; name: string; line: string | null;
  species: string; life_stage: string | null; size_target: string | null;
  food_form: string | null; is_prescription: boolean;
  prescription_indication: string[] | null;
  submission_status: 'pending' | 'approved' | 'rejected';
  pet_food_brands?: { name: string };
  pet_food_nutrition?: Array<{ id: string; protein_pct: number | null; fat_pct: number | null; kcal_per_kg: number | null; ca_p_ratio: number | null; verified: boolean; completeness_score: number | null; confidence: number | null }>;
};

const STATUS_ICON: Record<string, JSX.Element> = {
  approved: <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />,
  pending: <Clock className="h-3.5 w-3.5 text-amber-500" />,
  rejected: <XCircle className="h-3.5 w-3.5 text-red-600" />,
};

export default function PetFoodCatalogTab() {
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
        .select('*, pet_food_brands(name), pet_food_nutrition(id, protein_pct, fat_pct, kcal_per_kg, ca_p_ratio, verified, completeness_score, confidence)')
        .order('created_at', { ascending: false })
        .limit(500);
      if (statusFilter !== 'all') q = q.eq('submission_status', statusFilter);
      if (search) q = q.ilike('name', `%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as Product[];
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Database className="h-5 w-5" /> Catálogo de Rações
          </h2>
          <p className="text-sm text-muted-foreground">
            Banco editável de marcas, produtos e perfis nutricionais. Usado pelo motor de recomendação para análise de gap nutricional.
          </p>
        </div>
        <div className="flex gap-2">
          <NewBrandDialog onCreated={() => qc.invalidateQueries({ queryKey: ['pet-food-brands'] })} />
          <NewProductDialog brands={brandsQuery.data ?? []} onCreated={() => qc.invalidateQueries({ queryKey: ['pet-food-products'] })} />
        </div>
      </div>

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">Produtos ({productsQuery.data?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="brands">Marcas ({brandsQuery.data?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-3">
          <div className="flex gap-2 items-center">
            <Input placeholder="Buscar produto..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="approved">Aprovados</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="rejected">Rejeitados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {productsQuery.isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
          {productsQuery.data?.length === 0 && (
            <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">
              Nenhum produto cadastrado ainda. Use "Novo Produto" para começar a popular o catálogo.
            </CardContent></Card>
          )}

          <div className="grid gap-2">
            {productsQuery.data?.map((p) => (
              <Card key={p.id}>
                <CardContent className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {STATUS_ICON[p.submission_status]}
                      <span className="font-medium">{p.pet_food_brands?.name}</span>
                      <span className="text-muted-foreground">·</span>
                      <span>{p.name}</span>
                      {p.is_prescription && <Badge variant="destructive" className="text-[10px]">Prescrição</Badge>}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1 flex-wrap">
                      <Badge variant="outline" className="text-[10px]">{p.species}</Badge>
                      {p.life_stage && <Badge variant="outline" className="text-[10px]">{p.life_stage}</Badge>}
                      {p.size_target && <Badge variant="outline" className="text-[10px]">{p.size_target}</Badge>}
                      {p.food_form && <Badge variant="outline" className="text-[10px]">{p.food_form}</Badge>}
                      {p.prescription_indication?.map((i) => (
                        <Badge key={i} variant="secondary" className="text-[10px]">{i}</Badge>
                      ))}
                    </div>
                    {p.pet_food_nutrition?.[0] && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Proteína {p.pet_food_nutrition[0].protein_pct ?? '?'}% · Gordura {p.pet_food_nutrition[0].fat_pct ?? '?'}% · {p.pet_food_nutrition[0].kcal_per_kg ?? '?'} kcal/kg
                        {p.pet_food_nutrition[0].ca_p_ratio && ` · Ca:P ${p.pet_food_nutrition[0].ca_p_ratio}`}
                        {!p.pet_food_nutrition[0].verified && <Badge variant="outline" className="ml-2 text-[10px]">não verificado</Badge>}
                      </div>
                    )}
                    {p.pet_food_nutrition?.[0]?.completeness_score != null && (
                      <div className="mt-1 flex items-center gap-2">
                        <div className="h-1.5 w-32 bg-muted rounded overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${Math.round((p.pet_food_nutrition[0].completeness_score ?? 0) * 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {Math.round((p.pet_food_nutrition[0].completeness_score ?? 0) * 100)}% composição
                          {p.pet_food_nutrition[0].confidence != null && ` · conf. ${Math.round(p.pet_food_nutrition[0].confidence * 100)}%`}
                        </span>
                      </div>
                    )}
                  </div>
                  <ProductActions product={p} onChanged={() => qc.invalidateQueries({ queryKey: ['pet-food-products'] })} />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="brands">
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {brandsQuery.data?.map((b) => (
              <Card key={b.id}>
                <CardHeader className="pb-2"><CardTitle className="text-base">{b.name}</CardTitle></CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-0.5">
                  {b.manufacturer && <div>{b.manufacturer}</div>}
                  {b.country && <div>{b.country}</div>}
                  {b.website && <a href={b.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">site</a>}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProductActions({ product, onChanged }: { product: Product; onChanged: () => void }) {
  const [enriching, setEnriching] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const setStatus = async (status: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('pet_food_products')
      .update({ submission_status: status, reviewed_at: new Date().toISOString() })
      .eq('id', product.id);
    if (error) toast.error(error.message); else { toast.success(`Produto ${status === 'approved' ? 'aprovado' : 'rejeitado'}`); onChanged(); }
  };
  const enrich = async () => {
    setEnriching(true);
    try {
      const { data, error } = await supabase.functions.invoke('enrich-pet-food-product', {
        body: { product_id: product.id },
      });
      if (error) throw error;
      const conf = (data as any)?.parsed?.confidence;
      toast.success(`Composição enriquecida${conf != null ? ` (confiança ${Math.round(conf * 100)}%)` : ''}`);
      onChanged();
    } catch (e: any) {
      toast.error(`Falha ao enriquecer: ${e?.message ?? e}`);
    } finally {
      setEnriching(false);
    }
  };
  return (
    <div className="flex gap-1 shrink-0">
      <Button size="sm" variant="ghost" onClick={() => setDetailsOpen(true)} title="Ver composição completa">
        <FlaskConical className="h-3.5 w-3.5 mr-1" /> Composição
      </Button>
      <Button size="sm" variant="outline" onClick={enrich} disabled={enriching}>
        {enriching ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
        Enriquecer com IA
      </Button>
      {product.submission_status === 'pending' && (
        <>
          <Button size="sm" variant="outline" onClick={() => setStatus('approved')}>Aprovar</Button>
          <Button size="sm" variant="ghost" onClick={() => setStatus('rejected')}>Rejeitar</Button>
        </>
      )}
      <NutritionDetailsDialog open={detailsOpen} onOpenChange={setDetailsOpen} product={product} />
    </div>
  );
}

function NutritionDetailsDialog({
  open, onOpenChange, product,
}: { open: boolean; onOpenChange: (v: boolean) => void; product: Product }) {
  const { data, isLoading } = useQuery({
    enabled: open,
    queryKey: ['pet-food-nutrition-full', product.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pet_food_nutrition')
        .select('*')
        .eq('product_id', product.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as Record<string, any> | null;
    },
  });

  const groups: Array<{ title: string; fields: Array<{ key: string; label: string; unit?: string }> }> = [
    {
      title: 'Macronutrientes',
      fields: [
        { key: 'protein_pct', label: 'Proteína', unit: '%' },
        { key: 'fat_pct', label: 'Gordura', unit: '%' },
        { key: 'fiber_pct', label: 'Fibra', unit: '%' },
        { key: 'moisture_pct', label: 'Umidade', unit: '%' },
        { key: 'ash_pct', label: 'Cinzas', unit: '%' },
        { key: 'nfe_pct', label: 'ENN/Carbs', unit: '%' },
        { key: 'kcal_per_kg', label: 'Energia', unit: 'kcal/kg' },
      ],
    },
    {
      title: 'Minerais maiores',
      fields: [
        { key: 'calcium_pct', label: 'Cálcio', unit: '%' },
        { key: 'phosphorus_pct', label: 'Fósforo', unit: '%' },
        { key: 'ca_p_ratio', label: 'Ca:P' },
        { key: 'sodium_pct', label: 'Sódio', unit: '%' },
        { key: 'potassium_pct', label: 'Potássio', unit: '%' },
        { key: 'magnesium_pct', label: 'Magnésio', unit: '%' },
        { key: 'chloride_pct', label: 'Cloro', unit: '%' },
      ],
    },
    {
      title: 'Minerais traço',
      fields: [
        { key: 'iron_mg_per_kg', label: 'Ferro', unit: 'mg/kg' },
        { key: 'copper_mg_per_kg', label: 'Cobre', unit: 'mg/kg' },
        { key: 'zinc_mg_per_kg', label: 'Zinco', unit: 'mg/kg' },
        { key: 'manganese_mg_per_kg', label: 'Manganês', unit: 'mg/kg' },
        { key: 'selenium_mg_per_kg', label: 'Selênio', unit: 'mg/kg' },
        { key: 'iodine_mg_per_kg', label: 'Iodo', unit: 'mg/kg' },
      ],
    },
    {
      title: 'Vitaminas',
      fields: [
        { key: 'vit_a_iu_per_kg', label: 'Vit A', unit: 'UI/kg' },
        { key: 'vit_d3_iu_per_kg', label: 'Vit D3', unit: 'UI/kg' },
        { key: 'vit_e_iu_per_kg', label: 'Vit E', unit: 'UI/kg' },
        { key: 'vit_k_mg_per_kg', label: 'Vit K', unit: 'mg/kg' },
        { key: 'vit_b1_mg_per_kg', label: 'B1', unit: 'mg/kg' },
        { key: 'vit_b2_mg_per_kg', label: 'B2', unit: 'mg/kg' },
        { key: 'vit_b3_mg_per_kg', label: 'B3', unit: 'mg/kg' },
        { key: 'vit_b5_mg_per_kg', label: 'B5', unit: 'mg/kg' },
        { key: 'vit_b6_mg_per_kg', label: 'B6', unit: 'mg/kg' },
        { key: 'vit_b9_mg_per_kg', label: 'B9', unit: 'mg/kg' },
        { key: 'vit_b12_mg_per_kg', label: 'B12', unit: 'mg/kg' },
        { key: 'biotin_mg_per_kg', label: 'Biotina', unit: 'mg/kg' },
        { key: 'choline_mg_per_kg', label: 'Colina', unit: 'mg/kg' },
      ],
    },
    {
      title: 'Ácidos graxos',
      fields: [
        { key: 'omega3_pct', label: 'Ômega-3', unit: '%' },
        { key: 'omega6_pct', label: 'Ômega-6', unit: '%' },
        { key: 'omega6_omega3_ratio', label: 'n6:n3' },
        { key: 'epa_pct', label: 'EPA', unit: '%' },
        { key: 'dha_pct', label: 'DHA', unit: '%' },
        { key: 'ara_pct', label: 'ARA', unit: '%' },
      ],
    },
    {
      title: 'Aminoácidos essenciais',
      fields: [
        { key: 'lysine_pct', label: 'Lisina', unit: '%' },
        { key: 'methionine_pct', label: 'Metionina', unit: '%' },
        { key: 'tryptophan_pct', label: 'Triptofano', unit: '%' },
        { key: 'threonine_pct', label: 'Treonina', unit: '%' },
        { key: 'arginine_pct', label: 'Arginina', unit: '%' },
        { key: 'taurine_mg_per_kg', label: 'Taurina', unit: 'mg/kg' },
        { key: 'l_carnitine_mg_per_kg', label: 'L-Carnitina', unit: 'mg/kg' },
      ],
    },
    {
      title: 'Articulares',
      fields: [
        { key: 'glucosamine_mg_per_kg', label: 'Glucosamina', unit: 'mg/kg' },
        { key: 'chondroitin_mg_per_kg', label: 'Condroitina', unit: 'mg/kg' },
      ],
    },
  ];

  const fmt = (v: any, unit?: string) => v == null || v === '' ? '—' : `${v}${unit ? ' ' + unit : ''}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4" />
            Composição completa — {product.pet_food_brands?.name} · {product.name}
          </DialogTitle>
        </DialogHeader>
        {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
        {!isLoading && !data && (
          <p className="text-sm text-muted-foreground">
            Nenhum perfil nutricional gravado ainda. Use <strong>Enriquecer com IA</strong> para gerar uma composição estimada.
          </p>
        )}
        {data && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="outline">Fonte: {data.source ?? '—'}</Badge>
              {data.verified ? <Badge variant="default">Verificado</Badge> : <Badge variant="outline">Não verificado</Badge>}
              {data.completeness_score != null && <Badge variant="secondary">{Math.round(data.completeness_score * 100)}% completo</Badge>}
              {data.confidence != null && <Badge variant="secondary">Confiança {Math.round(data.confidence * 100)}%</Badge>}
              {data.meets_aafco_complete && <Badge variant="default">AAFCO completo</Badge>}
              {data.fediaf_compliant && <Badge variant="default">FEDIAF</Badge>}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {groups.map((g) => (
                <div key={g.title}>
                  <h4 className="text-sm font-semibold mb-1">{g.title}</h4>
                  <div className="divide-y border rounded">
                    {g.fields.map((f) => (
                      <div key={f.key} className="flex justify-between px-2 py-1 text-xs">
                        <span className="text-muted-foreground">{f.label}</span>
                        <span className={data[f.key] == null ? 'text-muted-foreground' : 'font-medium'}>{fmt(data[f.key], f.unit)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {data.aafco_statement && (
              <p className="text-xs text-muted-foreground italic border-t pt-2">{data.aafco_statement}</p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
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

function NewProductDialog({ brands, onCreated }: { brands: Brand[]; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [brandId, setBrandId] = useState('');
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('dog');
  const [lifeStage, setLifeStage] = useState<string>('adult');
  const [foodForm, setFoodForm] = useState<string>('dry_kibble');
  const [isPrescription, setIsPrescription] = useState(false);
  // nutrition
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [kcal, setKcal] = useState('');
  const [calcium, setCalcium] = useState('');
  const [phosphorus, setPhosphorus] = useState('');
  const [omega3, setOmega3] = useState('');
  const [omega6, setOmega6] = useState('');

  const submit = async () => {
    if (!brandId || !name.trim()) { toast.error('Marca e nome são obrigatórios'); return; }
    const { data: prod, error } = await supabase.from('pet_food_products').insert({
      brand_id: brandId, name: name.trim(), species, life_stage: lifeStage, food_form: foodForm,
      is_prescription: isPrescription, submission_status: 'approved',
    }).select('id').single();
    if (error) { toast.error(error.message); return; }
    const num = (v: string) => v.trim() === '' ? null : Number(v);
    const ca = num(calcium); const p = num(phosphorus);
    const o3 = num(omega3); const o6 = num(omega6);
    const { error: nErr } = await supabase.from('pet_food_nutrition').insert({
      product_id: prod.id, source: 'manufacturer_label', verified: false,
      protein_pct: num(protein), fat_pct: num(fat), kcal_per_kg: num(kcal),
      calcium_pct: ca, phosphorus_pct: p, ca_p_ratio: ca && p ? Number((ca / p).toFixed(2)) : null,
      omega3_pct: o3, omega6_pct: o6, omega6_omega3_ratio: o6 && o3 ? Number((o6 / o3).toFixed(2)) : null,
    });
    if (nErr) toast.warning(`Produto criado, mas falhou ao salvar nutrição: ${nErr.message}`);
    else toast.success('Produto e perfil nutricional criados');
    setOpen(false); onCreated();
    setBrandId(''); setName(''); setProtein(''); setFat(''); setKcal('');
    setCalcium(''); setPhosphorus(''); setOmega3(''); setOmega6('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Produto</Button></DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Novo produto</DialogTitle></DialogHeader>
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
          <div className="col-span-2 border-t pt-3">
            <h4 className="text-sm font-medium mb-2">Composição garantida (% matéria seca)</h4>
            <div className="grid grid-cols-3 gap-2">
              <div><Label className="text-xs">Proteína %</Label><Input value={protein} onChange={(e) => setProtein(e.target.value)} /></div>
              <div><Label className="text-xs">Gordura %</Label><Input value={fat} onChange={(e) => setFat(e.target.value)} /></div>
              <div><Label className="text-xs">kcal/kg</Label><Input value={kcal} onChange={(e) => setKcal(e.target.value)} /></div>
              <div><Label className="text-xs">Cálcio %</Label><Input value={calcium} onChange={(e) => setCalcium(e.target.value)} /></div>
              <div><Label className="text-xs">Fósforo %</Label><Input value={phosphorus} onChange={(e) => setPhosphorus(e.target.value)} /></div>
              <div />
              <div><Label className="text-xs">Ômega-3 %</Label><Input value={omega3} onChange={(e) => setOmega3(e.target.value)} /></div>
              <div><Label className="text-xs">Ômega-6 %</Label><Input value={omega6} onChange={(e) => setOmega6(e.target.value)} /></div>
            </div>
          </div>
        </div>
        <DialogFooter><Button onClick={submit}>Salvar produto</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}