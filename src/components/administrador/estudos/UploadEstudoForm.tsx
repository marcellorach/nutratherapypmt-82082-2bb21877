import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Upload, Workflow, Settings, FileUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SystemStatusBar } from './SystemStatusBar';
import { PipelineSteps } from './PipelineSteps';

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

        {/* Seção 3: Upload de Estudos */}
        <div className="border rounded-lg p-4 bg-muted/20">
          <div className="flex items-center gap-2 mb-3">
            <FileUp className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-muted-foreground">
              {t('studies.uploadSection.sectionTitle')}
            </h3>
          </div>
          <div className="p-6 border-2 border-dashed border-border rounded-lg text-center bg-background/50 hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer">
            <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium">{t('studies.upload.dropzone')}</p>
            <p className="text-xs text-muted-foreground mt-1">{t('studies.upload.formats')}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
