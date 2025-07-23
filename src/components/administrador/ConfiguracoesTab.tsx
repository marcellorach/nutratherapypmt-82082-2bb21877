import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Settings, RefreshCw } from "lucide-react";

const ConfiguracoesTab: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Configurações salvas",
        description: "As configurações foram atualizadas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Configurações do Sistema</h2>
        <Button onClick={handleSaveSettings} disabled={isLoading}>
          {isLoading ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Settings className="h-4 w-4 mr-2" />
          )}
          Salvar Configurações
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Configurações Gerais</CardTitle>
            <CardDescription>
              Configurações básicas do sistema de nutracêuticos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sistema-nome">Nome do Sistema</Label>
                <Input 
                  id="sistema-nome" 
                  defaultValue="Sistema de Nutracêuticos" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="versao">Versão</Label>
                <Input 
                  id="versao" 
                  defaultValue="1.0.0" 
                  disabled
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configurações de Dados</CardTitle>
            <CardDescription>
              Configurações relacionadas ao banco de dados e sincronização
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="backup-interval">Intervalo de Backup (horas)</Label>
                <Input 
                  id="backup-interval" 
                  type="number" 
                  defaultValue="24" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cache-timeout">Timeout de Cache (minutos)</Label>
                <Input 
                  id="cache-timeout" 
                  type="number" 
                  defaultValue="60" 
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ConfiguracoesTab;