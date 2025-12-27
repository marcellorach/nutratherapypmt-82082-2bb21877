import React from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Search, ClipboardList, FlaskConical } from 'lucide-react';
import ExternalSearchPanel from './ExternalSearchPanel';
import CandidatesQueue from './CandidatesQueue';
import GenerateTestDataButton from '../conflicts/GenerateTestDataButton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCandidatesStats } from '@/hooks/useBaseKnowledgeCandidates';
import { Badge } from '@/components/ui/badge';

const BaseKnowledgeTab: React.FC = () => {
  const { t } = useTranslation();
  const { data: stats } = useCandidatesStats();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Database className="h-6 w-6" />
          {t('admin.baseKnowledge.title', 'Sistema de Dados Base')}
        </h2>
        <p className="text-muted-foreground mt-1">
          {t('admin.baseKnowledge.description', 'Gerencie a base de conhecimento com busca em ontologias externas e curadoria')}
        </p>
      </div>

      <Tabs defaultValue="search" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            {t('admin.baseKnowledge.tabs.search', 'Buscar')}
          </TabsTrigger>
          <TabsTrigger value="queue" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            {t('admin.baseKnowledge.tabs.queue', 'Curadoria')}
            {stats && stats.pending > 0 && (
              <Badge variant="destructive" className="ml-1">{stats.pending}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="testing" className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4" />
            {t('admin.baseKnowledge.tabs.testing', 'Testes')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search">
          <ExternalSearchPanel />
        </TabsContent>

        <TabsContent value="queue">
          <CandidatesQueue />
        </TabsContent>

        <TabsContent value="testing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5" />
                {t('admin.baseKnowledge.testing.title', 'Dados de Teste')}
              </CardTitle>
              <CardDescription>
                {t('admin.baseKnowledge.testing.description', 'Gere dados de teste para validar o sistema de detecção de conflitos')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">
                  {t('admin.baseKnowledge.testing.conflictTestTitle', 'Teste de Conflitos de Evidência')}
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('admin.baseKnowledge.testing.conflictTestDescription', 
                    'Gera estudos fictícios com triplets de dosagem conflitantes para testar o sistema de detecção e resolução de conflitos.'
                  )}
                </p>
                <GenerateTestDataButton />
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">
                  {t('admin.baseKnowledge.testing.whatIsGenerated', 'O que será gerado?')}
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>{t('admin.baseKnowledge.testing.item1', '5-10 estudos fictícios em processed_studies')}</li>
                  <li>{t('admin.baseKnowledge.testing.item2', 'Triplets de extração com dosagens diferentes')}</li>
                  <li>{t('admin.baseKnowledge.testing.item3', 'Claims conflitantes para o mesmo par nutraceutico-condição')}</li>
                  <li>{t('admin.baseKnowledge.testing.item4', 'Conflitos detectados automaticamente no painel de revisão')}</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BaseKnowledgeTab;
