import { useState } from 'react';
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
          title: "Sucesso",
          description: result.message,
        });
      } else {
        toast({
          title: "Erro",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao gerar dados de teste",
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
          title: "✅ Fase 1 Concluída!",
          description: result.message,
          duration: 6000,
        });
        console.log('✅ Migração concluída com sucesso:', result);
      } else {
        toast({
          title: "❌ Erro na Migração",
          description: result.message,
          variant: "destructive",
          duration: 8000,
        });
        console.error('❌ Erro na migração:', result);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "❌ Erro na Migração",
        description: `Falha ao executar migração: ${errorMessage}`,
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
            Carregando configurações...
          </div>
        </CardContent>
      </Card>
    );
  }

  const getModeDescription = (mode: DataMode) => {
    switch (mode) {
      case 'production':
        return 'Apenas dados reais do banco Supabase';
      case 'development':
        return 'Prioriza dados mock sobre dados do banco';
      case 'hybrid':
        return 'Combina dados do banco com dados mock (padrão)';
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
            Gerenciamento de Dados
          </CardTitle>
          <CardDescription>
            Configure como os dados são carregados na aplicação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Modo de Dados */}
          <div className="space-y-3">
            <Label>Modo de Dados</Label>
            <div className="flex items-center gap-3">
              <Select value={settings.data_mode} onValueChange={handleModeChange}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hybrid">Híbrido</SelectItem>
                  <SelectItem value="production">Produção</SelectItem>
                  <SelectItem value="development">Desenvolvimento</SelectItem>
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
            <Label>Dados de Teste (Seed)</Label>
            <div className="flex items-center space-x-2">
              <Switch
                checked={settings.use_seed_data}
                onCheckedChange={(checked) => updateSetting('use_seed_data', checked)}
              />
              <Label>Incluir dados de teste nas consultas</Label>
            </div>
            {settings.current_seed_batch && (
              <p className="text-sm text-muted-foreground">
                Batch atual: <code className="bg-muted px-1 rounded">{settings.current_seed_batch}</code>
              </p>
            )}
          </div>

          <Separator />

          {/* Ações */}
          <div className="space-y-4">
            <Label>Ações de Gerenciamento</Label>
            
            {/* Stanford Demo Migration - Destaque */}
            <Card className="border-2 border-primary bg-primary/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Database className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Fase 1: Migração Stanford Demo</h3>
                    <p className="text-sm text-muted-foreground">
                      Popula o banco com ~150 nutracêuticos, ~30 condições e relações
                    </p>
                  </div>
                </div>
                
                <div className="bg-background/50 rounded-lg p-4 mb-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    <span>Migra dados de <code className="bg-muted px-1 rounded">src/data/nutraceuticals/</code></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    <span>Cria categorias e condições de saúde automaticamente</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    <span>Estabelece relacionamentos com efficacy scores</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    <span>Batch ID: <code className="bg-muted px-1 rounded font-mono">stanford_demo</code></span>
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
                      Executando Migração... (Aguarde ~30-45s)
                    </>
                  ) : (
                    <>
                      <Database className="h-5 w-5 mr-2" />
                      🚀 Executar Fase 1
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
                    <span className="font-medium">Gerar Dados de Teste</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Cria um novo conjunto de dados fictícios para desenvolvimento
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
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Database className="h-4 w-4 mr-2" />
                        Gerar Dados
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-dashed border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="font-medium">Limpar Dados de Teste</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Remove todos os dados marcados como 'seed' do banco
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
                        Limpando...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Limpar Dados
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
                <h4 className="font-medium text-blue-900">Sistema Seguro</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Este sistema mantém os dados mock existentes intactos. 
                  As mudanças afetam apenas como os dados são combinados e exibidos.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};