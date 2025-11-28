import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SystemStatusBar } from './SystemStatusBar';

export const UploadEstudoForm = () => {
  const { t } = useTranslation();
  
  return (
    <Card className="border-2 border-blue-500 bg-blue-50 dark:bg-blue-950">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Upload className="h-6 w-6" />
          {t('studies.upload.title')}
        </CardTitle>
        <CardDescription className="text-base">
          {t('studies.upload.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <SystemStatusBar />
        
        <div className="p-8 border-2 border-dashed border-border rounded-lg text-center bg-background/50">
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium">{t('studies.upload.dropzone')}</p>
          <p className="text-sm text-muted-foreground mt-1">{t('studies.upload.formats')}</p>
        </div>
      </CardContent>
    </Card>
  );
};
