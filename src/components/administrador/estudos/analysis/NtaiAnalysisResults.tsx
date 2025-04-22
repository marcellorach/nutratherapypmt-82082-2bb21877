
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NtaiAnalysisResult } from '@/types/ntai';
import NtaiNutraceuticalsTab from './results/NtaiNutraceuticalsTab';
import NtaiConditionsTab from './results/NtaiConditionsTab';
import NtaiInteractionsTab from './results/NtaiInteractionsTab';
import NtaiSideEffectsTab from './results/NtaiSideEffectsTab';
import { AlertTriangle, Users, Clock, Award, FileText } from "lucide-react";

interface NtaiAnalysisResultsProps {
  analysisResult: NtaiAnalysisResult | null;
}

const NtaiAnalysisResults: React.FC<NtaiAnalysisResultsProps> = ({ analysisResult }) => {
  const [activeTab, setActiveTab] = useState("summary");
  
  if (!analysisResult) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nenhum resultado disponível</CardTitle>
          <CardDescription>
            Selecione documentos na fila e inicie o processamento para visualizar os resultados da análise NTAI.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Resultados da Análise NTAI
          {analysisResult.isSimulated && (
            <span className="bg-amber-100 text-amber-800 text-xs py-0.5 px-2 rounded-full flex items-center">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Dados Simulados
            </span>
          )}
        </CardTitle>
        <CardDescription>
          Resultados do processamento para o estudo ID: {analysisResult.studyId}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="summary" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="summary">Resumo</TabsTrigger>
            <TabsTrigger value="nutraceuticals">Nutracêuticos</TabsTrigger>
            <TabsTrigger value="conditions">Condições</TabsTrigger>
            <TabsTrigger value="interactions">Interações</TabsTrigger>
            <TabsTrigger value="sideeffects">Efeitos Colaterais</TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-md">
                <h3 className="text-sm font-medium mb-2">Resumo do Estudo</h3>
                <p className="text-gray-700">{analysisResult.summary}</p>
                
                {analysisResult.studyPopulation && (
                  <div className="mt-4 flex items-start gap-1">
                    <Users className="h-4 w-4 mt-0.5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">População do Estudo {analysisResult.studyPopulation.isSimulated && <AlertTriangle className="inline h-3 w-3 text-amber-500" />}</p>
                      <p className="text-sm text-gray-600">
                        {analysisResult.studyPopulation.type === 'human' ? 'Humanos' : 
                          analysisResult.studyPopulation.type === 'canine' ? 'Caninos' :
                          analysisResult.studyPopulation.type === 'feline' ? 'Felinos' :
                          analysisResult.studyPopulation.type === 'rodent' ? 'Roedores' : 'Outros'}: {analysisResult.studyPopulation.count} indivíduos
                      </p>
                      <p className="text-xs text-gray-500">{analysisResult.studyPopulation.description}</p>
                    </div>
                  </div>
                )}
                
                <div className="mt-3 flex items-start gap-1">
                  <Clock className="h-4 w-4 mt-0.5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Duração {analysisResult.isSimulated && <AlertTriangle className="inline h-3 w-3 text-amber-500" />}</p>
                    <p className="text-sm text-gray-600">{analysisResult.studyDuration}</p>
                  </div>
                </div>
                
                <div className="mt-3 flex items-start gap-1">
                  <FileText className="h-4 w-4 mt-0.5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Resultados {analysisResult.isSimulated && <AlertTriangle className="inline h-3 w-3 text-amber-500" />}</p>
                    <p className="text-sm text-gray-600">{analysisResult.studyResults}</p>
                  </div>
                </div>
                
                <div className="mt-3 flex items-start gap-1">
                  <Award className="h-4 w-4 mt-0.5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Relevância Científica {analysisResult.isSimulated && <AlertTriangle className="inline h-3 w-3 text-amber-500" />}</p>
                    <div className="flex items-center">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        analysisResult.citationScore > 4 ? "bg-green-100 text-green-800" :
                        analysisResult.citationScore > 3 ? "bg-blue-100 text-blue-800" :
                        "bg-amber-100 text-amber-800"
                      }`}>
                        {analysisResult.citationScore.toFixed(1)}/5
                      </span>
                      <span className="ml-2 text-xs text-gray-500">
                        Baseado em citações e impacto da publicação
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-md">
                  <h3 className="text-sm font-medium mb-2">Qualidade Metodológica</h3>
                  <div className="flex items-center">
                    <span className={`text-2xl font-bold ${
                      analysisResult.qualityScore > 4 ? "text-green-600" :
                      analysisResult.qualityScore > 3 ? "text-blue-600" :
                      "text-amber-600"
                    }`}>
                      {analysisResult.qualityScore.toFixed(1)}
                    </span>
                    <span className="text-gray-500 ml-1">/5</span>
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-md">
                  <h3 className="text-sm font-medium mb-2">Relevância Clínica</h3>
                  <div className="flex items-center">
                    <span className={`text-2xl font-bold ${
                      analysisResult.relevanceScore > 4 ? "text-green-600" :
                      analysisResult.relevanceScore > 3 ? "text-blue-600" :
                      "text-amber-600"
                    }`}>
                      {analysisResult.relevanceScore.toFixed(1)}
                    </span>
                    <span className="text-gray-500 ml-1">/5</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="nutraceuticals">
            <NtaiNutraceuticalsTab nutraceuticals={analysisResult.extractedNutraceuticals} />
          </TabsContent>

          <TabsContent value="conditions">
            <NtaiConditionsTab conditions={analysisResult.extractedConditions} />
          </TabsContent>

          <TabsContent value="interactions">
            <NtaiInteractionsTab interactions={analysisResult.extractedInteractions} />
          </TabsContent>

          <TabsContent value="sideeffects">
            <NtaiSideEffectsTab sideEffects={analysisResult.extractedSideEffects} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default NtaiAnalysisResults;
