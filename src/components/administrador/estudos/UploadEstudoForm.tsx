import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Workflow, Settings, Network } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SystemStatusBar } from './SystemStatusBar';
import { PipelineSteps } from './PipelineSteps';
import DataArchitectureDiagram from './DataArchitectureDiagram';

export const UploadEstudoForm = () => {
  const { t } = useTranslation();
  
  return (
    <Card className="border-2 border-primary/20 bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <span className="text-xl">🧬</span>
          {t('studies.vetGraphRAG.title')}
        </CardTitle>
        <CardDescription className="text-base">
          {t('studies.vetGraphRAG.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Seção 1: Pipeline de Processamento */}
        <div className="border rounded-lg p-4 bg-muted/20">
          <div className="flex items-center gap-2 mb-3">
            <Workflow className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-muted-foreground">
              {t('studies.pipeline.title')}
            </h3>
          </div>
          <PipelineSteps />
        </div>

        {/* Seção 2: Status dos Sistemas */}
        <div className="border rounded-lg p-4 bg-muted/20">
          <div className="flex items-center gap-2 mb-3">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-muted-foreground">
              {t('studies.systemStatus.sectionTitle')}
            </h3>
          </div>
          <SystemStatusBar />
        </div>

        {/* Seção 3: Arquitetura de Dados */}
        <div className="border rounded-lg p-4 bg-muted/20">
          <div className="flex items-center gap-2 mb-3">
            <Network className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-muted-foreground">
              {t('studies.dataArchitecture.title')}
            </h3>
          </div>
          <DataArchitectureDiagram />
        </div>
      </CardContent>
    </Card>
  );
};
