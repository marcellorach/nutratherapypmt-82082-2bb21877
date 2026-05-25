import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Download, FileText } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface CohortForm {
  cohortName: string;
  rationale: string;
  breeds: string;
  ageMin: string;
  ageMax: string;
  weightRange: string;
  conditions: string;
  currentMeds: string;
  excludeCriteria: string;
  targetN: string;
  minDataPerAnimal: string;
  deliveryFormat: string;
  privacyTerms: string;
}

const DEFAULT_FORM: CohortForm = {
  cohortName: '',
  rationale: '',
  breeds: '',
  ageMin: '',
  ageMax: '',
  weightRange: '',
  conditions: '',
  currentMeds: '',
  excludeCriteria: '',
  targetN: '200',
  minDataPerAnimal:
    'Anamnese, exames laboratoriais (mín. hemograma + bioquímico hepático/renal), histórico de consultas (12+ meses), alimentação atual',
  deliveryFormat: 'CSV ou JSON estruturado (FHIR opcional)',
  privacyTerms: 'Dados anonimizados — IDs pseudonimizados, sem informação de tutor',
};

const buildMarkdown = (f: CohortForm): string => {
  return `# Solicitação de Cohort — Senex AI × PetLove

**Cohort:** ${f.cohortName || '(sem nome)'}
**Data:** ${new Date().toISOString().slice(0, 10)}

## Objetivo
${f.rationale || '(descrever objetivo clínico/científico)'}

## Critérios de inclusão
- **Raça(s):** ${f.breeds || 'qualquer'}
- **Idade:** ${f.ageMin || '0'} – ${f.ageMax || '∞'} anos
- **Peso:** ${f.weightRange || 'qualquer'}
- **Condições conhecidas:** ${f.conditions || 'qualquer'}
- **Medicação atual:** ${f.currentMeds || 'qualquer'}

## Critérios de exclusão
${f.excludeCriteria || '(nenhum)'}

## N-alvo
${f.targetN} animais

## Dados mínimos por animal
${f.minDataPerAnimal}

## Formato de entrega
${f.deliveryFormat}

## Privacidade e termos
${f.privacyTerms}

---
_Gerado pelo Senex AI · Painel de Priorizações · Gerador de Sugestões de Cohort._
`;
};

const CohortRequestGenerator: React.FC = () => {
  const { t } = useTranslation();
  const [form, setForm] = useState<CohortForm>(DEFAULT_FORM);
  const [showPreview, setShowPreview] = useState(false);

  const markdown = useMemo(() => buildMarkdown(form), [form]);

  const update = (key: keyof CohortForm, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleCopy = async () => {
    await navigator.clipboard.writeText(markdown);
    toast({ title: t('prioritization.cohort.copied', 'Copiado para a área de transferência') });
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = (form.cohortName || 'cohort-request').replace(/[^a-z0-9-_]/gi, '_');
    a.href = url;
    a.download = `${safeName}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4" />
          {t('prioritization.cohort.title', 'Gerador de Sugestões de Cohort')}
        </CardTitle>
        <p className="text-xs text-gray-600">
          {t(
            'prioritization.cohort.subtitle',
            'Produz um documento estruturado para enviar à PetLove pedindo um recorte específico do banco histórico.',
          )}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">{t('prioritization.cohort.name', 'Nome do cohort')}</Label>
            <Input
              value={form.cohortName}
              onChange={(e) => update('cohortName', e.target.value)}
              placeholder="Golden 8+ com elevação de ALT"
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t('prioritization.cohort.targetN', 'N-alvo')}</Label>
            <Input
              value={form.targetN}
              onChange={(e) => update('targetN', e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label className="text-xs">{t('prioritization.cohort.rationale', 'Objetivo / racional')}</Label>
            <Textarea
              value={form.rationale}
              onChange={(e) => update('rationale', e.target.value)}
              placeholder="O que queremos descobrir / validar com esse cohort?"
              className="text-sm min-h-[60px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t('prioritization.cohort.breeds', 'Raça(s)')}</Label>
            <Input
              value={form.breeds}
              onChange={(e) => update('breeds', e.target.value)}
              placeholder="Golden Retriever; Labrador"
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t('prioritization.cohort.weight', 'Faixa de peso')}</Label>
            <Input
              value={form.weightRange}
              onChange={(e) => update('weightRange', e.target.value)}
              placeholder="20–35 kg"
              className="h-8 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">{t('prioritization.cohort.ageMin', 'Idade min (anos)')}</Label>
              <Input
                value={form.ageMin}
                onChange={(e) => update('ageMin', e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t('prioritization.cohort.ageMax', 'Idade max (anos)')}</Label>
              <Input
                value={form.ageMax}
                onChange={(e) => update('ageMax', e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t('prioritization.cohort.conditions', 'Condições conhecidas')}</Label>
            <Input
              value={form.conditions}
              onChange={(e) => update('conditions', e.target.value)}
              placeholder="Osteoartrite; DRC estágio 1–2"
              className="h-8 text-sm"
            />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label className="text-xs">{t('prioritization.cohort.meds', 'Medicação atual')}</Label>
            <Input
              value={form.currentMeds}
              onChange={(e) => update('currentMeds', e.target.value)}
              placeholder="AINEs; condroprotetores; ou listar a excluir"
              className="h-8 text-sm"
            />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label className="text-xs">{t('prioritization.cohort.exclude', 'Critérios de exclusão')}</Label>
            <Textarea
              value={form.excludeCriteria}
              onChange={(e) => update('excludeCriteria', e.target.value)}
              placeholder="Neoplasia ativa; gestação; tratamento oncológico nos últimos 6 meses"
              className="text-sm min-h-[60px]"
            />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label className="text-xs">{t('prioritization.cohort.minData', 'Dados mínimos por animal')}</Label>
            <Textarea
              value={form.minDataPerAnimal}
              onChange={(e) => update('minDataPerAnimal', e.target.value)}
              className="text-sm min-h-[60px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t('prioritization.cohort.delivery', 'Formato de entrega')}</Label>
            <Input
              value={form.deliveryFormat}
              onChange={(e) => update('deliveryFormat', e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t('prioritization.cohort.privacy', 'Privacidade')}</Label>
            <Input
              value={form.privacyTerms}
              onChange={(e) => update('privacyTerms', e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <Button size="sm" variant="outline" onClick={() => setShowPreview((s) => !s)}>
            {showPreview
              ? t('prioritization.cohort.hidePreview', 'Esconder preview')
              : t('prioritization.cohort.showPreview', 'Ver preview Markdown')}
          </Button>
          <Button size="sm" variant="outline" onClick={handleCopy}>
            <Copy className="h-3.5 w-3.5 mr-1.5" />
            {t('prioritization.cohort.copy', 'Copiar')}
          </Button>
          <Button size="sm" onClick={handleDownload}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            {t('prioritization.cohort.download', 'Baixar .md')}
          </Button>
        </div>

        {showPreview && (
          <pre className="bg-gray-50 border rounded p-3 text-[11px] leading-relaxed whitespace-pre-wrap overflow-x-auto max-h-[400px]">
            {markdown}
          </pre>
        )}
      </CardContent>
    </Card>
  );
};

export default CohortRequestGenerator;