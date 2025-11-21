import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Trash2, 
  RotateCcw, 
  Sparkles, 
  Activity,
  AlertTriangle 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import BulkCleanupDialog from './BulkCleanupDialog';
import StudyResetService from '@/services/StudyResetService';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const EmergencyActionsPanel: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Estados para diálogos de confirmação
  const [cleanImportsDialog, setCleanImportsDialog] = useState(false);
  const [resetErroredDialog, setResetErroredDialog] = useState(false);
  const [removeDuplicatesDialog, setRemoveDuplicatesDialog] = useState(false);
  
  // Contadores para diálogos
  const [importCount, setImportCount] = useState(0);
  const [erroredCount, setErroredCount] = useState(0);
  const [duplicateCount, setDuplicateCount] = useState(0);

  const handleCleanOldImports = async () => {
    try {
      const health = await StudyResetService.checkSystemHealth();
      setImportCount(Math.max(0, health.accumulatedImports - 5));
      setCleanImportsDialog(true);
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const confirmCleanImports = async () => {
    setIsProcessing(true);
    try {
      const removed = await StudyResetService.cleanOldImports(5);
      toast({
        title: t('studies.emergency.cleanSuccess'),
        description: t('studies.emergency.cleanSuccessDesc', { count: removed })
      });
      setCleanImportsDialog(false);
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetErrored = async () => {
    try {
      const health = await StudyResetService.checkSystemHealth();
      setErroredCount(health.erroredStudies);
      setResetErroredDialog(true);
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const confirmResetErrored = async () => {
    setIsProcessing(true);
    try {
      const reset = await StudyResetService.resetAllErroredStudies();
      toast({
        title: t('studies.emergency.resetSuccess'),
        description: t('studies.emergency.resetSuccessDesc', { count: reset })
      });
      setResetErroredDialog(false);
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveDuplicates = async () => {
    setIsProcessing(true);
    try {
      // Primeira chamada para contar duplicatas
      const problematic = await StudyResetService.getProblematicStudies();
      const titleMap = new Map<string, number>();
      problematic.forEach(s => {
        const title = s.title?.toLowerCase().trim();
        if (title) {
          titleMap.set(title, (titleMap.get(title) || 0) + 1);
        }
      });
      const dupes = Array.from(titleMap.values()).filter(count => count > 1).length;
      setDuplicateCount(dupes);
      setRemoveDuplicatesDialog(true);
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmRemoveDuplicates = async () => {
    setIsProcessing(true);
    try {
      const removed = await StudyResetService.removeDuplicateStudies();
      toast({
        title: t('studies.emergency.duplicatesSuccess'),
        description: t('studies.emergency.duplicatesSuccessDesc', { count: removed })
      });
      setRemoveDuplicatesDialog(false);
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckHealth = async () => {
    setIsProcessing(true);
    try {
      const health = await StudyResetService.checkSystemHealth();
      
      toast({
        title: t('studies.emergency.healthCheck'),
        description: (
          <div className="space-y-1 text-sm">
            <div>{t('studies.diagnostics.totalStudies')}: {health.totalStudies}</div>
            <div>{t('studies.diagnostics.processingRate')}: {health.processingRate}%</div>
            <div>{t('studies.diagnostics.avgTime')}: {health.avgProcessingTime}</div>
            <div className="text-orange-600">
              {t('studies.diagnostics.imports')}: {health.accumulatedImports}
              {health.accumulatedImports > 10 && ' ⚠️'}
            </div>
          </div>
        )
      });
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Accordion type="single" collapsible className="w-full border rounded-md">
        <AccordionItem value="emergency" className="border-0">
          <AccordionTrigger className="px-4 hover:no-underline hover:bg-orange-50 dark:hover:bg-orange-950">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <span className="font-semibold">{t('studies.emergency.title')}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={handleCleanOldImports}
                disabled={isProcessing}
                className="justify-start h-auto py-3 hover:bg-orange-50 dark:hover:bg-orange-950"
              >
                <Trash2 className="h-4 w-4 mr-2 text-orange-600" />
                <div className="text-left">
                  <div className="font-medium">{t('studies.emergency.cleanOldImports')}</div>
                  <div className="text-xs text-muted-foreground">
                    {t('studies.emergency.cleanOldImportsDesc')}
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                onClick={handleResetErrored}
                disabled={isProcessing}
                className="justify-start h-auto py-3 hover:bg-blue-50 dark:hover:bg-blue-950"
              >
                <RotateCcw className="h-4 w-4 mr-2 text-blue-600" />
                <div className="text-left">
                  <div className="font-medium">{t('studies.emergency.resetErrored')}</div>
                  <div className="text-xs text-muted-foreground">
                    {t('studies.emergency.resetErroredDesc')}
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                onClick={handleRemoveDuplicates}
                disabled={isProcessing}
                className="justify-start h-auto py-3 hover:bg-purple-50 dark:hover:bg-purple-950"
              >
                <Sparkles className="h-4 w-4 mr-2 text-purple-600" />
                <div className="text-left">
                  <div className="font-medium">{t('studies.emergency.removeDuplicates')}</div>
                  <div className="text-xs text-muted-foreground">
                    {t('studies.emergency.removeDuplicatesDesc')}
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                onClick={handleCheckHealth}
                disabled={isProcessing}
                className="justify-start h-auto py-3 hover:bg-green-50 dark:hover:bg-green-950"
              >
                <Activity className="h-4 w-4 mr-2 text-green-600" />
                <div className="text-left">
                  <div className="font-medium">{t('studies.emergency.checkHealth')}</div>
                  <div className="text-xs text-muted-foreground">
                    {t('studies.emergency.checkHealthDesc')}
                  </div>
                </div>
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <BulkCleanupDialog
        open={cleanImportsDialog}
        onOpenChange={setCleanImportsDialog}
        onConfirm={confirmCleanImports}
        title={t('studies.emergency.cleanOldImports')}
        description={t('studies.emergency.cleanConfirmDesc')}
        itemCount={importCount}
        variant="warning"
      />

      <BulkCleanupDialog
        open={resetErroredDialog}
        onOpenChange={setResetErroredDialog}
        onConfirm={confirmResetErrored}
        title={t('studies.emergency.resetErrored')}
        description={t('studies.emergency.resetConfirmDesc')}
        itemCount={erroredCount}
        variant="info"
      />

      <BulkCleanupDialog
        open={removeDuplicatesDialog}
        onOpenChange={setRemoveDuplicatesDialog}
        onConfirm={confirmRemoveDuplicates}
        title={t('studies.emergency.removeDuplicates')}
        description={t('studies.emergency.duplicatesConfirmDesc')}
        itemCount={duplicateCount}
        variant="warning"
      />
    </>
  );
};

export default EmergencyActionsPanel;
