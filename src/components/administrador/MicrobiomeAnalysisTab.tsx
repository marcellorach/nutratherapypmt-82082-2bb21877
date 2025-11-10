import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Microscope, Database, TrendingUp, AlertCircle } from 'lucide-react';

/**
 * Tab de teste para Análise de Microbioma
 * Criada para testar o sistema de versionamento automático da documentação
 */
export default function MicrobiomeAnalysisTab() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('admin.microbiome.title', 'Análise de Microbioma')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('admin.microbiome.description', 'Análise e visualização de dados do microbioma intestinal de pets')}
          </p>
        </div>
        <Button variant="outline">
          <Database className="mr-2 h-4 w-4" />
          {t('admin.microbiome.generateData', 'Gerar Dados de Exemplo')}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin.microbiome.samplesAnalyzed', 'Amostras Analisadas')}
            </CardTitle>
            <Microscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              {t('admin.microbiome.noData', 'Nenhuma amostra ainda')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin.microbiome.speciesIdentified', 'Espécies Identificadas')}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              {t('admin.microbiome.awaitingAnalysis', 'Aguardando análise')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin.microbiome.correlations', 'Correlações Encontradas')}
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              {t('admin.microbiome.requiresData', 'Requer dados')}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('admin.microbiome.about', 'Sobre esta Feature')}</CardTitle>
          <CardDescription>
            {t('admin.microbiome.testDescription', 'Esta tab foi criada como teste do sistema de versionamento automático da documentação')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <h3 className="font-semibold mb-2">
              {t('admin.microbiome.functionalityTitle', 'Funcionalidade Planejada')}
            </h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>{t('admin.microbiome.feature1', 'Análise de composição bacteriana do microbioma intestinal')}</li>
              <li>{t('admin.microbiome.feature2', 'Correlação entre microbioma e condições de saúde')}</li>
              <li>{t('admin.microbiome.feature3', 'Recomendações de probióticos baseadas em perfil microbiano')}</li>
              <li>{t('admin.microbiome.feature4', 'Visualização de diversidade alfa e beta')}</li>
            </ul>
          </div>

          <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-4">
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              <strong>{t('admin.microbiome.statusLabel', 'Status:')} </strong>
              {t('admin.microbiome.statusMocked', '🟡 Funcionalidade Mockada - Interface criada para fins de demonstração')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
