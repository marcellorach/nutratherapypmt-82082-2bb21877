import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CompactSystemStatus } from './CompactSystemStatus';
import { CompactPipeline } from './CompactPipeline';
import DataArchitectureDiagram from './DataArchitectureDiagram';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';

export const UploadEstudoForm = () => {
  const { t } = useTranslation();
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);
  
  return (
    <Card className="max-w-md border-2 border-primary/20 bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className="text-base">🧬</span>
          {t('studies.vetGraphRAG.title')}
        </CardTitle>
        <CardDescription className="text-xs">
          {t('studies.vetGraphRAG.descriptionShort')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {/* Pipeline Compacto */}
        <CompactPipeline />

        {/* System Status Compacto */}
        <div className="p-2 bg-muted/20 rounded-lg border border-border/30">
          <CompactSystemStatus />
        </div>

        {/* Arquitetura Colapsável */}
        <Collapsible open={isArchitectureOpen} onOpenChange={setIsArchitectureOpen}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full h-7 text-xs text-muted-foreground hover:text-foreground"
            >
              {isArchitectureOpen ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  {t('studies.dataArchitecture.hideArchitecture')}
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  {t('studies.dataArchitecture.showArchitecture')}
                </>
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <DataArchitectureDiagram compact />
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};
