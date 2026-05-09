import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Pill, Tag, AlertTriangle, Search } from 'lucide-react';
import { PharmacologyService, type DrugSubstance, type DrugBrand, type DrugInteraction } from '@/services/pharmacology-service';

const severityColor: Record<string, string> = {
  info: 'bg-blue-100 text-blue-800',
  caution: 'bg-amber-100 text-amber-800',
  major: 'bg-orange-100 text-orange-800',
  contraindicated: 'bg-red-100 text-red-800',
};

const PharmacologyTab: React.FC = () => {
  const { t } = useTranslation();
  const [substances, setSubstances] = useState<DrugSubstance[]>([]);
  const [brands, setBrands] = useState<DrugBrand[]>([]);
  const [interactions, setInteractions] = useState<DrugInteraction[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      PharmacologyService.listSubstances(),
      PharmacologyService.listBrands(),
      PharmacologyService.listInteractions(),
    ]).then(([s, b, i]) => {
      setSubstances(s); setBrands(b); setInteractions(i);
    }).finally(() => setLoading(false));
  }, []);

  const f = filter.toLowerCase();
  const fSubs = substances.filter(s => !f || s.inn_name.toLowerCase().includes(f) || (s.drug_class || '').toLowerCase().includes(f));
  const fBrands = brands.filter(b => !f || b.brand_name.toLowerCase().includes(f) || (b.substance?.inn_name || '').toLowerCase().includes(f));

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Pill className="h-6 w-6" />
          {t('admin.pharmacology.title', 'Base Farmacológica')}
        </h2>
        <p className="text-muted-foreground mt-1">
          {t('admin.pharmacology.description', 'Catálogo de princípios ativos, marcas comerciais brasileiras e interações farmacológicas')}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardDescription>{t('admin.pharmacology.stats.substances', 'Princípios ativos')}</CardDescription><CardTitle className="text-3xl">{substances.length}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>{t('admin.pharmacology.stats.brands', 'Marcas comerciais (BR)')}</CardDescription><CardTitle className="text-3xl">{brands.length}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>{t('admin.pharmacology.stats.interactions', 'Interações cadastradas')}</CardDescription><CardTitle className="text-3xl">{interactions.length}</CardTitle></CardHeader></Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder={t('admin.pharmacology.searchPlaceholder', 'Buscar por princípio ativo, marca ou classe...')}
          className="pl-9"
        />
      </div>

      <Tabs defaultValue="brands">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="brands"><Tag className="h-4 w-4 mr-2" />{t('admin.pharmacology.tabs.brands', 'Marcas Comerciais')}</TabsTrigger>
          <TabsTrigger value="substances"><Pill className="h-4 w-4 mr-2" />{t('admin.pharmacology.tabs.substances', 'Princípios Ativos')}</TabsTrigger>
          <TabsTrigger value="interactions"><AlertTriangle className="h-4 w-4 mr-2" />{t('admin.pharmacology.tabs.interactions', 'Interações')}</TabsTrigger>
        </TabsList>

        <TabsContent value="brands">
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-left">
                    <th className="p-3">{t('admin.pharmacology.cols.brand', 'Marca')}</th>
                    <th className="p-3">{t('admin.pharmacology.cols.substance', 'Princípio ativo')}</th>
                    <th className="p-3">{t('admin.pharmacology.cols.class', 'Classe')}</th>
                    <th className="p-3">{t('admin.pharmacology.cols.manufacturer', 'Fabricante')}</th>
                    <th className="p-3">{t('admin.pharmacology.cols.label', 'Rótulo')}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">...</td></tr>}
                  {!loading && fBrands.map(b => (
                    <tr key={b.id} className="border-t">
                      <td className="p-3 font-medium">{b.brand_name}</td>
                      <td className="p-3">{b.substance?.inn_name}</td>
                      <td className="p-3 text-muted-foreground">{b.substance?.drug_class}</td>
                      <td className="p-3 text-muted-foreground">{b.manufacturer}</td>
                      <td className="p-3">
                        <Badge variant={b.vet_label ? 'default' : 'outline'}>
                          {b.vet_label ? t('admin.pharmacology.vetLabel', 'Veterinário') : t('admin.pharmacology.offLabel', 'Off-label humano')}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="substances">
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-left">
                    <th className="p-3">{t('admin.pharmacology.cols.substance', 'Princípio ativo')}</th>
                    <th className="p-3">{t('admin.pharmacology.cols.class', 'Classe')}</th>
                    <th className="p-3">{t('admin.pharmacology.cols.mechanism', 'Mecanismo')}</th>
                    <th className="p-3">{t('admin.pharmacology.cols.routes', 'Vias')}</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && fSubs.map(s => (
                    <tr key={s.id} className="border-t">
                      <td className="p-3 font-medium">{s.inn_name}</td>
                      <td className="p-3 text-muted-foreground">{s.drug_class}</td>
                      <td className="p-3 text-muted-foreground text-xs">{s.mechanism}</td>
                      <td className="p-3 text-xs">{(s.common_routes || []).join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interactions">
          <Card>
            <CardContent className="p-6">
              {interactions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground space-y-2">
                  <AlertTriangle className="h-10 w-10 mx-auto opacity-30" />
                  <p>{t('admin.pharmacology.interactions.empty', 'Nenhuma interação cadastrada ainda.')}</p>
                  <p className="text-xs">{t('admin.pharmacology.interactions.emptyHint', 'A Fase 2 incluirá interações droga↔droga, droga↔nutracêutico e droga↔condição com alertas em tempo real no cadastro do pet.')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {interactions.map(i => (
                    <div key={i.id} className="border rounded-lg p-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{i.substance_a?.inn_name} ↔ {i.substance_b?.inn_name || '—'}</p>
                        {i.recommendation && <p className="text-xs text-muted-foreground mt-1">{i.recommendation}</p>}
                      </div>
                      <Badge className={severityColor[i.severity]}>{i.severity}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PharmacologyTab;