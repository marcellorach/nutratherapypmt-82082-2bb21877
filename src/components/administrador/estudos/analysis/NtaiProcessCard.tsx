import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Check, AlertTriangle, FileText, Loader2, X, RotateCcw } from "lucide-react";
import { ProcessingItem } from '@/types/ntai';
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import StudyResetService from '@/services/StudyResetService';

interface NtaiProcessCardProps {
  item: ProcessingItem;
  isActive: boolean;
  onRemove?: (itemId: string) => void;
  onResetAndReprocess?: (itemId: string) => void;
}

const NtaiProcessCard: React.FC<NtaiProcessCardProps> = ({ item, isActive, onRemove, onResetAndReprocess }) => {
  const [showRemoveDialog, setShowRemoveDialog] = React.useState(false);
  const [isResetting, setIsResetting] = React.useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleRemoveClick = () => {
    if (item.stage === 'idle' || item.stage === 'complete' || item.stage === 'error') {
      onRemove?.(item.id);
      return;
    }
    
    if (item.stage === 'extracting' || item.stage === 'analyzing' || item.stage === 'standardizing') {
      setShowRemoveDialog(true);
    }
  };

  const confirmRemove = () => {
    onRemove?.(item.id);
    setShowRemoveDialog(false);
  };

  const getStatusIcon = () => {
    switch (item.stage) {
      case 'complete':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'extracting':
      case 'analyzing':
      case 'standardizing':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (item.stage) {
      case 'complete':
        return t('studies.vetgraphrag.processCard.statusComplete');
      case 'error':
        return t('studies.vetgraphrag.processCard.statusError');
      case 'extracting':
        return t('studies.vetgraphrag.processCard.statusExtracting');
      case 'analyzing':
        return t('studies.vetgraphrag.processCard.statusAnalyzing');
      case 'standardizing':
        return t('studies.vetgraphrag.processCard.statusStandardizing');
      default:
        return t('studies.vetgraphrag.processCard.statusPending');
    }
  };

  const getBorderClass = () => {
    if (isActive) return 'border-2 border-blue-300 bg-blue-50';
    switch (item.stage) {
      case 'complete': return 'border-green-200 bg-green-50';
      case 'error': return 'border-red-200';
      case 'extracting':
      case 'analyzing':
      case 'standardizing': return 'border-blue-200';
      default: return 'border-gray-200';
    }
  };

  const isCriticalError = (error?: string) => {
    if (!error) return false;
    return (
      error.includes("Insufficient text extracted") ||
      error.includes("analysis_data NULL") ||
      error.includes("analysis_data está vazio") ||
      error.includes("Gemini File Search não salvou dados")
    );
  };

  const handleResetAndReprocess = async () => {
    setIsResetting(true);
    try {
      await StudyResetService.resetStudy(item.id);
      toast({
        title: t('studies.vetgraphrag.processCard.statusComplete'),
        description: t('studies.vetgraphrag.processCard.processedSuccess')
      });
      onResetAndReprocess?.(item.id);
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsResetting(false);
    }
  };

  const formatErrorMessage = (error?: string) => {
    if (!error) return "";
    if (error.includes("invalid input syntax for type uuid")) return t('studies.vetgraphrag.errorInvalidUuid');
    if (error.includes("duplicate key value violates unique constraint")) return t('studies.vetgraphrag.errorDuplicate');
    if (error.includes("NetworkError") || error.includes("network") || error.includes("fetch")) return t('studies.vetgraphrag.errorNetwork');
    if (error.includes("status") || error.includes("already") || error.includes("já")) return t('studies.vetgraphrag.errorAlreadyProcessed');
    if (isCriticalError(error)) return t('studies.vetgraphrag.errorCriticalData');
    return error;
  };

  const getStatusClass = () => {
    if (item.stage === 'complete') return 'text-green-700 font-semibold';
    return 'text-gray-500 font-normal';
  };

  return (
    <>
      <Card className={`shadow-sm transition-all ${getBorderClass()}`} data-item-id={item.id}>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="truncate max-w-[180px]">{item.title}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs ${getStatusClass()}`}>
                {getStatusText()}
              </span>
              {onRemove && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 p-0 hover:bg-red-100 text-gray-400 hover:text-red-600"
                  onClick={handleRemoveClick}
                  title={t('studies.vetgraphrag.processCard.removeFromQueue')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2 px-4 space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span>{getStatusText()}</span>
              <span>{item.progress}%</span>
            </div>
            <Progress value={item.progress} className={`h-2 ${item.stage === 'complete' ? 'bg-green-100' : ''}`} />
          </div>
          
          {item.sourceFile && (
            <div className="text-xs text-gray-500">
              {t('studies.vetgraphrag.processCard.source')}: {item.sourceFile}
            </div>
          )}
          
          <div className="text-xs text-gray-500">
            {t('studies.vetgraphrag.processCard.importedLessThanDay')}
          </div>
          
          {item.error && (
            <div className="space-y-2">
              <div className="p-2 bg-red-50 text-red-700 text-xs rounded border border-red-200">
                <div className="font-medium mb-1">❌ {t('studies.vetgraphrag.errorTitle')}</div>
                <div>{formatErrorMessage(item.error)}</div>
              </div>
              
              {isCriticalError(item.error) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetAndReprocess}
                  disabled={isResetting}
                  className="w-full text-blue-600 border-blue-300 hover:bg-blue-50"
                >
                  <RotateCcw className={`h-3 w-3 mr-2 ${isResetting ? 'animate-spin' : ''}`} />
                  {t('studies.vetgraphrag.resetAndReprocess')}
                </Button>
              )}
            </div>
          )}
          
          {/* Warning: curation needed instead of green success */}
          {item.stage === 'complete' && (
            <div className="p-2 bg-amber-50 text-amber-800 text-xs rounded border border-amber-200">
              <span className="font-medium">{t('studies.vetgraphrag.curationWarningTitle')}:</span>{' '}
              {t('studies.vetgraphrag.processCard.processedSuccess')}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('studies.vetgraphrag.processCard.cancelProcessingTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('studies.vetgraphrag.processCard.cancelProcessingDesc')}
              <br />
              <strong className="block mt-2">{t('studies.vetgraphrag.processCard.cancelProcessingIrreversible')}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('studies.vetgraphrag.processCard.cancelNo')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmRemove}
              className="bg-red-600 hover:bg-red-700"
            >
              {t('studies.vetgraphrag.processCard.cancelYes')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default NtaiProcessCard;
