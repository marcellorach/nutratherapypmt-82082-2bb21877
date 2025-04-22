
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Microscope, Tags, ArrowUp, ArrowDown, AlertTriangle } from "lucide-react";
import { NtaiAnalysisResult } from '@/types/ntai';
import NutraceuticalTag from '../../tags/NutraceuticalTag';
import ConditionTag from '../../tags/ConditionTag';
import InteractionTag from '../../tags/InteractionTag';
import SideEffectTag from '../../tags/SideEffectTag';
import EvidenceTag from '../../tags/EvidenceTag';

interface NtaiAnalysisResultsProps {
  result: NtaiAnalysisResult;
}

const NtaiAnalysisResults: React.FC<NtaiAnalysisResultsProps> = ({ result }) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Microscope className="h-5 w-5 text-purple-600" />
            Resultados da Análise NTAI
          </CardTitle>
          <div className="flex items-center gap-2">
            <EvidenceTag score={result.qualityScore} />
          </div>
        </div>
        <p className="text-sm text-gray-500">
          Análise completa do estudo com tags e pontuações extraídas
        </p>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="nutraceuticos" className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="nutraceuticos" className="text-xs">Nutracêuticos</TabsTrigger>
            <TabsTrigger value="condicoes" className="text-xs">Condições</TabsTrigger>
            <TabsTrigger value="interacoes" className="text-xs">Interações</TabsTrigger>
            <TabsTrigger value="efeitos" className="text-xs">Efeitos Colaterais</TabsTrigger>
          </TabsList>
          
          <TabsContent value="nutraceuticos">
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Tags className="h-4 w-4" />
                Nutracêuticos Identificados
              </h4>
              <div className="flex flex-wrap gap-2 bg-gray-50 p-3 rounded-md">
                {result.extractedNutraceuticals.length > 0 ? (
                  result.extractedNutraceuticals.map((nutra, idx) => (
                    <NutraceuticalTag 
                      key={idx}
                      name={nutra.name} 
                      score={4.0} // Pontuação padrão, será ajustada quando tivermos
                      className="m-1"
                    />
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Nenhum nutracêutico identificado.</p>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="condicoes">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Condições Identificadas e Eficácia</h4>
              <div className="flex flex-wrap gap-2 bg-gray-50 p-3 rounded-md">
                {result.extractedConditions.length > 0 ? (
                  result.extractedConditions.map((condition, idx) => (
                    <ConditionTag 
                      key={idx}
                      condition={condition.name} 
                      score={condition.efficacyScore}
                      className="m-1"
                    />
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Nenhuma condição identificada.</p>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="interacoes">
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <ArrowUp className="h-4 w-4 text-green-600" />
                  Interações Positivas
                </h4>
                <div className="flex flex-wrap gap-2 bg-gray-50 p-3 rounded-md">
                  {result.extractedInteractions.filter(i => i.type === 'positive').length > 0 ? (
                    result.extractedInteractions
                      .filter(i => i.type === 'positive')
                      .map((interaction, idx) => (
                        <InteractionTag 
                          key={idx}
                          name={interaction.name} 
                          score={interaction.score}
                          type="positive"
                          className="m-1"
                        />
                      ))
                  ) : (
                    <p className="text-sm text-gray-500">Nenhuma interação positiva identificada.</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <ArrowDown className="h-4 w-4 text-red-600" />
                  Interações Negativas
                </h4>
                <div className="flex flex-wrap gap-2 bg-gray-50 p-3 rounded-md">
                  {result.extractedInteractions.filter(i => i.type === 'negative').length > 0 ? (
                    result.extractedInteractions
                      .filter(i => i.type === 'negative')
                      .map((interaction, idx) => (
                        <InteractionTag 
                          key={idx}
                          name={interaction.name} 
                          score={interaction.score}
                          type="negative"
                          className="m-1"
                        />
                      ))
                  ) : (
                    <p className="text-sm text-gray-500">Nenhuma interação negativa identificada.</p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="efeitos">
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Efeitos Colaterais
              </h4>
              <div className="flex flex-wrap gap-2 bg-gray-50 p-3 rounded-md">
                {result.extractedSideEffects.length > 0 ? (
                  result.extractedSideEffects.map((effect, idx) => (
                    <SideEffectTag 
                      key={idx}
                      effect={effect.name} 
                      score={effect.intensityScore}
                      className="m-1"
                    />
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Nenhum efeito colateral significativo identificado.</p>
                )}
              </div>
              
              {result.extractedSideEffects.length > 0 && (
                <div className="text-xs text-gray-500 mt-2">
                  <strong>Nota:</strong> A intensidade dos efeitos colaterais é medida de 0 a 5, onde 
                  5 representa efeitos muito significativos.
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default NtaiAnalysisResults;
