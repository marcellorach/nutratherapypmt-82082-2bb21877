
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NtaiAnalysisResult } from '@/types/ntai';
import { ArrowUp, ArrowDown, AlertTriangle } from "lucide-react";

interface NtaiAnalysisResultsProps {
  result: NtaiAnalysisResult;
}

const NtaiAnalysisResults: React.FC<NtaiAnalysisResultsProps> = ({ result }) => {
  return (
    <div className="space-y-6">
      {/* Indicador de dados simulados, se necessário */}
      {result.isSimulated && (
        <div className="flex items-center p-3 bg-amber-50 border border-amber-200 rounded-md mb-4">
          <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
          <div className="text-amber-700 text-sm">
            Alguns dados foram preenchidos automaticamente pois não puderam ser extraídos com precisão pelo sistema NTAI.
          </div>
        </div>
      )}
      
      {/* Resumo do estudo */}
      <Card className="bg-slate-50">
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-2">Resumo</h3>
          <p className="text-gray-700">{result.summary}</p>
          
          <div className="flex flex-wrap gap-3 mt-4">
            <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
              Relevância: {result.relevanceScore.toFixed(1)}/5
            </Badge>
            <Badge variant="outline" className="bg-purple-50 border-purple-200 text-purple-700">
              Qualidade: {result.qualityScore.toFixed(1)}/5
            </Badge>
            <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
              Citações: {result.citationScore?.toFixed(1) || "N/A"}/5
            </Badge>
          </div>
        </CardContent>
      </Card>
      
      {/* População e metodologia */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-2">População e Metodologia</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Tipo</p>
              <p className="font-medium">
                {result.studyPopulation?.type === 'human' ? 'Humanos' :
                 result.studyPopulation?.type === 'canine' ? 'Cães' :
                 result.studyPopulation?.type === 'feline' ? 'Gatos' :
                 result.studyPopulation?.type === 'rodent' ? 'Roedores' : 'Outros'}
                {result.studyPopulation?.isSimulated && (
                  <span className="text-xs text-amber-500 ml-2">(simulado)</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Tamanho da amostra</p>
              <p className="font-medium">
                {result.studyPopulation?.count || "N/A"}
                {result.studyPopulation?.isSimulated && (
                  <span className="text-xs text-amber-500 ml-2">(simulado)</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Duração</p>
              <p className="font-medium">{result.studyDuration || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Descrição</p>
              <p className="text-sm">{result.studyPopulation?.description || "N/A"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Nutracêuticos extraídos */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-3">Nutracêuticos Identificados</h3>
          <div className="flex flex-wrap gap-2">
            {result.extractedNutraceuticals.map((item, index) => (
              <Badge 
                key={`nutra-${index}`}
                variant="outline" 
                className="bg-green-50 text-green-700 border-green-200 flex items-center"
              >
                {item.name}
                <span className="text-xs ml-1">({(item.confidence * 100).toFixed(0)}%)</span>
                {item.isSimulated && (
                  <AlertTriangle className="h-3 w-3 ml-1 text-amber-500" />
                )}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Condições de saúde */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-3">Condições de Saúde</h3>
          <div className="flex flex-wrap gap-2">
            {result.extractedConditions.map((item, index) => (
              <Badge 
                key={`cond-${index}`}
                variant="outline" 
                className="bg-blue-50 text-blue-700 border-blue-200 flex items-center"
              >
                {item.name}
                <span className="ml-1 px-1 py-0.5 rounded bg-blue-100 text-blue-800 text-xs">
                  {item.efficacyScore.toFixed(1)}
                </span>
                {item.isSimulated && (
                  <AlertTriangle className="h-3 w-3 ml-1 text-amber-500" />
                )}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Interações */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-3">Interações</h3>
          <div className="flex flex-wrap gap-2">
            {result.extractedInteractions.map((item, index) => (
              <Badge 
                key={`int-${index}`}
                variant="outline" 
                className={`${item.type === 'positive' 
                  ? 'bg-green-50 text-green-700 border-green-200' 
                  : 'bg-red-50 text-red-700 border-red-200'} flex items-center`}
              >
                {item.type === 'positive' ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                {item.name} ({item.score.toFixed(1)})
                {item.isSimulated && (
                  <AlertTriangle className="h-3 w-3 ml-1 text-amber-500" />
                )}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Efeitos colaterais */}
      {result.extractedSideEffects && result.extractedSideEffects.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-3">Efeitos Colaterais</h3>
            <div className="flex flex-wrap gap-2">
              {result.extractedSideEffects.map((item, index) => (
                <Badge 
                  key={`side-${index}`}
                  variant="outline" 
                  className="bg-amber-50 text-amber-700 border-amber-200 flex items-center"
                >
                  {item.name} ({item.intensityScore.toFixed(1)})
                  <span className="ml-1 text-xs">{item.frequency}</span>
                  {item.isSimulated && (
                    <AlertTriangle className="h-3 w-3 ml-1 text-amber-500" />
                  )}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Resultados principais */}
      {result.studyResults && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-2">Resultados Principais</h3>
            <p className="text-gray-700">{result.studyResults}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NtaiAnalysisResults;
