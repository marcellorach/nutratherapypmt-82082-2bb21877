import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Database, Trash2, RefreshCw, Settings, TestTube } from 'lucide-react';
import { useDataManagement, DataMode } from '@/hooks/useDataManagement';
import { NutraceuticalDataMigrator } from '@/utils/nutraceutical-data-migrator';
import { toast } from '@/hooks/use-toast';

export const DataManagementPanel = () => {
  const { t } = useTranslation();
  const { settings, isLoading, updateSetting, cleanSeedData, generateNewSeedBatch } = useDataManagement();
  const [isGeneratingSeeds, setIsGeneratingSeeds] = useState(false);
  const [isCleaningSeeds, setIsCleaningSeeds] = useState(false);
  const [isRunningStanfordMigration, setIsRunningStanfordMigration] = useState(false);

  const handleModeChange = (mode: DataMode) => {
    updateSetting('data_mode', mode);
  };

  const handleGenerateSeeds = async () => {
    setIsGeneratingSeeds(true);
    try {
      const batchId = generateNewSeedBatch();
      const result = await NutraceuticalDataMigrator.generateSeedData(batchId);
      
      if (result.success) {
        toast({
          title: t('dataManagement.toasts.success'),
          description: result.message,
        });
      } else {
        toast({
          title: t('dataManagement.toasts.error'),
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: t('dataManagement.toasts.error'),
        description: t('dataManagement.toasts.errorGenerating'),
        variant: "destructive"
      });
    } finally {
      setIsGeneratingSeeds(false);
    }
  };

  const handleCleanSeeds = async () => {
    setIsCleaningSeeds(true);
    try {
      await cleanSeedData();
    } finally {
      setIsCleaningSeeds(false);
    }
  };

  const handleStanfordMigration = async () => {
    setIsRunningStanfordMigration(true);
    try {
      console.log('🚀 Iniciando Fase 1: Migração Stanford Demo...');
      const result = await NutraceuticalDataMigrator.generateSeedData('stanford_demo');
      
      if (result.success) {
        toast({
          title: t('dataManagement.toasts.phase1Success'),
          description: result.message,
          duration: 6000,
        });
        console.log('✅ Migração concluída com sucesso:', result);
      } else {
        toast({
          title: t('dataManagement.toasts.phase1Error'),
          description: result.message,
          variant: "destructive",
          duration: 8000,
        });
        console.error('❌ Erro na migração:', result);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('dataManagement.toasts.unknownError');
      toast({
        title: t('dataManagement.toasts.phase1Error'),
        description: t('dataManagement.toasts.migrationError', { error: errorMessage }),
        variant: "destructive",
        duration: 8000,
      });
      console.error('❌ Erro crítico na migração:', error);
    } finally {
      setIsRunningStanfordMigration(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            {t('dataManagement.loading')}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getModeDescription = (mode: DataMode) => {
    switch (mode) {
      case 'production':
        return t('dataManagement.dataMode.descriptions.production');
      case 'development':
        return t('dataManagement.dataMode.descriptions.development');
      case 'hybrid':
        return t('dataManagement.dataMode.descriptions.hybrid');
      default:
        return '';
    }
  };

  const getModeColor = (mode: DataMode) => {
    switch (mode) {
      case 'production':
        return 'bg-green-100 text-green-800';
      case 'development':
        return 'bg-blue-100 text-blue-800';
      case 'hybrid':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t('dataManagement.title')}
          </CardTitle>
          <CardDescription>
            {t('dataManagement.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Modo de Dados */}
          <div className="space-y-3">
            <Label>{t('dataManagement.dataMode.label')}</Label>
            <div className="flex items-center gap-3">
              <Select value={settings.data_mode} onValueChange={handleModeChange}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hybrid">{t('dataManagement.dataMode.hybrid')}</SelectItem>
                  <SelectItem value="production">{t('dataManagement.dataMode.production')}</SelectItem>
                  <SelectItem value="development">{t('dataManagement.dataMode.development')}</SelectItem>
                </SelectContent>
              </Select>
              <Badge className={getModeColor(settings.data_mode)}>
                {settings.data_mode}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {getModeDescription(settings.data_mode)}
            </p>
          </div>

          <Separator />

          {/* Configurações de Seed */}
          <div className="space-y-3">
            <Label>{t('dataManagement.seedData.label')}</Label>
            <div className="flex items-center space-x-2">
              <Switch
                checked={settings.use_seed_data}
                onCheckedChange={(checked) => updateSetting('use_seed_data', checked)}
              />
              <Label>{t('dataManagement.seedData.includeSeedData')}</Label>
            </div>
            {settings.current_seed_batch && (
              <p className="text-sm text-muted-foreground">
                {t('dataManagement.seedData.currentBatch')} <code className="bg-muted px-1 rounded">{settings.current_seed_batch}</code>
              </p>
            )}
          </div>

          <Separator />

          {/* Ações */}
          <div className="space-y-4">
            <Label>{t('dataManagement.actions.label')}</Label>
            
            {/* Stanford Demo Migration - Destaque */}
            <Card className="border-2 border-primary bg-primary/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Database className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{t('dataManagement.actions.phase1.title')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('dataManagement.actions.phase1.description')}
                    </p>
                  </div>
                </div>
                
                <div className="bg-background/50 rounded-lg p-4 mb-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    <span>{t('dataManagement.actions.phase1.step1')} <code className="bg-muted px-1 rounded">src/data/nutraceuticals/</code></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    <span>{t('dataManagement.actions.phase1.step2')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    <span>{t('dataManagement.actions.phase1.step3')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    <span>{t('dataManagement.actions.phase1.batchId')} <code className="bg-muted px-1 rounded font-mono">stanford_demo</code></span>
                  </div>
                </div>

                <Button 
                  onClick={handleStanfordMigration}
                  disabled={isRunningStanfordMigration}
                  className="w-full"
                  size="lg"
                >
                  {isRunningStanfordMigration ? (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                      {t('dataManagement.actions.phase1.running')}
                    </>
                  ) : (
                    <>
                      <Database className="h-5 w-5 mr-2" />
                      {t('dataManagement.actions.phase1.execute')}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-dashed">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TestTube className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">{t('dataManagement.actions.generateSeeds.title')}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {t('dataManagement.actions.generateSeeds.description')}
                  </p>
                  <Button 
                    onClick={handleGenerateSeeds}
                    disabled={isGeneratingSeeds}
                    className="w-full"
                    variant="outline"
                  >
                    {isGeneratingSeeds ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        {t('dataManagement.actions.generateSeeds.generating')}
                      </>
                    ) : (
                      <>
                        <Database className="h-4 w-4 mr-2" />
                        {t('dataManagement.actions.generateSeeds.generate')}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-dashed border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="font-medium">{t('dataManagement.actions.cleanSeeds.title')}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {t('dataManagement.actions.cleanSeeds.description')}
                  </p>
                  <Button 
                    onClick={handleCleanSeeds}
                    disabled={isCleaningSeeds}
                    variant="destructive"
                    className="w-full"
                  >
                    {isCleaningSeeds ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        {t('dataManagement.actions.cleanSeeds.cleaning')}
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t('dataManagement.actions.cleanSeeds.clean')}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Informações de Segurança */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Database className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">{t('dataManagement.security.title')}</h4>
                <p className="text-sm text-blue-700 mt-1">
                  {t('dataManagement.security.description')}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};