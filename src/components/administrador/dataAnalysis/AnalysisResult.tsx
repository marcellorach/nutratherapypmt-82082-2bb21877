
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Database, GitCompare, FileSearch } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

const AnalysisResult: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const handleVisualizationClick = () => {
    setSearchParams({ tab: 'visualization' });
  };

  return (
    <Card className="mt-6 bg-green-50">
      <CardHeader>
        <CardTitle className="flex items-center text-green-700">
          <CheckCircle className="mr-2 h-5 w-5" />
          Análise Concluída com Sucesso
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-gray-700">
            A análise multi-agente dos dados foi concluída com sucesso. Os agentes colaboraram para produzir insights e recomendações de alta qualidade.
          </p>
          
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-md border border-gray-200 bg-white p-4">
              <h4 className="font-medium mb-2 flex items-center">
                <Database className="h-4 w-4 mr-2 text-emerald-600" />
                Processamento de Dados
              </h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• 2.341 pets processados</li>
                <li>• 1.876 exames analisados</li>
                <li>• 42 raças categorizadas</li>
                <li>• 28 condições clínicas identificadas</li>
              </ul>
            </div>
            
            <div className="rounded-md border border-gray-200 bg-white p-4">
              <h4 className="font-medium mb-2 flex items-center">
                <GitCompare className="h-4 w-4 mr-2 text-purple-600" />
                Análise e Correlações
              </h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• 12 padrões de saúde identificados</li>
                <li>• 37% com gaps nutricionais</li>
                <li>• 142 tratamentos avaliados</li>
                <li>• 86 correlações significativas</li>
              </ul>
            </div>
            
            <div className="rounded-md border border-gray-200 bg-white p-4">
              <h4 className="font-medium mb-2 flex items-center">
                <FileSearch className="h-4 w-4 mr-2 text-rose-600" />
                Recomendações
              </h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• 843 recomendações geradas</li>
                <li>• 76% taxa de confiança média</li>
                <li>• 92% com evidências científicas</li>
                <li>• 23 nutracêuticos recorrentes</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6">
            <h4 className="font-medium mb-2">Próximas Etapas</h4>
            <div className="grid grid-cols-2 gap-4">
              <Button 
                className="w-full"
                onClick={handleVisualizationClick}
              >
                Visualizar Análise Detalhada
              </Button>
              <Button className="w-full">
                Enviar para Revisão Veterinária
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalysisResult;
