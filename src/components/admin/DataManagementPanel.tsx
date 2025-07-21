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