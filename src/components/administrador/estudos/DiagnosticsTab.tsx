import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RotateCcw, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import StudyResetService, { HealthStats } from '@/services/StudyResetService';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from '@/components/ui/checkbox';
import BulkCleanupDialog from './BulkCleanupDialog';

const DiagnosticsTab: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [health, setHealth] = useState<HealthStats | null>(null);
  const [problematicStudies, setProblematicStudies] = useState<any[]>([]);
  const [selectedStudies, setSelectedStudies] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showResetDialog, setShowResetDialog] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [healthData, problematic] = await Promise.all([
        StudyResetService.checkSystemHealth(),
        StudyResetService.getProblematicStudies()
      ]);
      setHealth(healthData);
      setProblematicStudies(problematic);
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResetSingle = async (studyId: string) => {
    try {
      await StudyResetService.resetStudy(studyId);
      toast({
        title: t('studies.diagnostics.resetSuccess'),
        description: t('studies.diagnostics.studyReset')
      });
      loadData();
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleBulkReset = () => {
    if (selectedStudies.length === 0) {
      toast({
        title: t('studies.diagnostics.noSelection'),
        description: t('studies.diagnostics.noSelectionDesc'),
        variant: 'destructive'
      });
      return;
    }
    setShowResetDialog(true);
  };

  const confirmBulkReset = async () => {
    try {
      await Promise.all(selectedStudies.map(id => StudyResetService.resetStudy(id)));
      toast({
        title: t('studies.diagnostics.bulkResetSuccess'),
        description: t('studies.diagnostics.bulkResetSuccessDesc', { count: selectedStudies.length })
      });
      setSelectedStudies([]);
      setShowResetDialog(false);
      loadData();
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const toggleStudySelection = (studyId: string) => {
    setSelectedStudies(prev =>
      prev.includes(studyId)
        ? prev.filter(id => id !== studyId)
        : [...prev, studyId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedStudies.length === problematicStudies.length) {
      setSelectedStudies([]);
    } else {
      setSelectedStudies(problematicStudies.map(s => s.id));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas em Tempo Real */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('studies.diagnostics.totalStudies')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{health?.totalStudies || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('studies.diagnostics.processingRate')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {health?.processingRate || 0}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('studies.diagnostics.avgTime')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {health?.avgProcessingTime || 'N/A'}
            </div>
          </CardContent>
        </Card>

        <Card className={health?.hasWarnings ? 'border-orange-300 bg-orange-50 dark:bg-orange-950' : ''}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('studies.diagnostics.imports')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${health?.hasWarnings ? 'text-orange-600' : ''}`}>
              {health?.accumulatedImports || 0}
              {health?.hasWarnings && ' ⚠️'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Estudos Problemáticos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('studies.diagnostics.problematicTitle')}</CardTitle>
              <CardDescription>
                {t('studies.diagnostics.problematicDesc', { count: problematicStudies.length })}
              </CardDescription>
            </div>
            {selectedStudies.length > 0 && (
              <Button onClick={handleBulkReset} variant="default">
                <RotateCcw className="h-4 w-4 mr-2" />
                {t('studies.diagnostics.resetSelected', { count: selectedStudies.length })}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {problematicStudies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <p className="text-lg font-medium">{t('studies.diagnostics.noProblems')}</p>
              <p className="text-sm text-muted-foreground">{t('studies.diagnostics.allHealthy')}</p>
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedStudies.length === problematicStudies.length}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>{t('studies.diagnostics.title')}</TableHead>
                    <TableHead>{t('studies.diagnostics.problem')}</TableHead>
                    <TableHead>{t('studies.diagnostics.status')}</TableHead>
                    <TableHead className="text-right">{t('studies.diagnostics.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {problematicStudies.map((study) => (
                    <TableRow key={study.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedStudies.includes(study.id)}
                          onCheckedChange={() => toggleStudySelection(study.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium max-w-md truncate">
                        {study.title || 'Sem título'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <span className="text-sm text-muted-foreground">
                            {study.error_message 
                              ? t('studies.diagnostics.hasError')
                              : t('studies.diagnostics.missingData')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          study.kanban_status === 'new' 
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {study.kanban_status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResetSingle(study.id)}
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          {t('studies.diagnostics.reset')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <BulkCleanupDialog
        open={showResetDialog}
        onOpenChange={setShowResetDialog}
        onConfirm={confirmBulkReset}
        title={t('studies.diagnostics.resetSelected', { count: selectedStudies.length })}
        description={t('studies.diagnostics.resetConfirmDesc')}
        itemCount={selectedStudies.length}
        variant="info"
      />
    </div>
  );
};

export default DiagnosticsTab;
