
import React from 'react';
import { NtaiAnalysisResult } from '@/types/ntai';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, AlertCircle } from 'lucide-react';

interface NtaiAnalysisResultsProps {
  result: NtaiAnalysisResult;
}

const NtaiAnalysisResults: React.FC<NtaiAnalysisResultsProps> = ({ result }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardContent className="p-4 space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Nutracêuticos Identificados</h3>
            <div className="flex flex-wrap gap-2">
              {result.extractedNutraceuticals.map((item, index) => (
                <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {item.name} ({(item.confidence * 100).toFixed(0)}%)
                </Badge>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-2">Condições Relacionadas</h3>
            <div className="flex flex-wrap gap-2">
              {result.extractedConditions.map((item, index) => (
                <Badge key={index} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  {item.name} ({item.efficacyScore.toFixed(1)}/5)
                </Badge>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-2">Qualidade do Estudo</h3>
            <div className="flex items-center">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${(result.qualityScore / 5) * 100}%` }}
                ></div>
              </div>
              <span className="ml-2 text-sm font-medium">{result.qualityScore.toFixed(1)}/5</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Interações</h3>
            <div className="space-y-2">
              <div>
                <span className="text-xs text-green-600 font-medium">Positivas:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {result.extractedInteractions
                    .filter(item => item.type === 'positive')
                    .map((item, index) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className="bg-green-50 text-green-700 border-green-200 flex items-center"
                      >
                        <ArrowUp className="mr-1 h-3 w-3" />
                        {item.name} ({item.score.toFixed(1)})
                      </Badge>
                    ))
                  }
                </div>
              </div>
              
              <div>
                <span className="text-xs text-red-600 font-medium">Negativas:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {result.extractedInteractions
                    .filter(item => item.type === 'negative')
                    .map((item, index) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className="bg-red-50 text-red-700 border-red-200 flex items-center"
                      >
                        <ArrowDown className="mr-1 h-3 w-3" />
                        {item.name} ({item.score.toFixed(1)})
                      </Badge>
                    ))
                  }
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-2">Efeitos Colaterais</h3>
            <div className="flex flex-wrap gap-2">
              {result.extractedSideEffects.map((item, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1"
                >
                  <AlertCircle className="h-3 w-3" />
                  {item.name} ({item.frequency})
                </Badge>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-2">Relevância</h3>
            <div className="flex items-center">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full" 
                  style={{ width: `${(result.relevanceScore / 5) * 100}%` }}
                ></div>
              </div>
              <span className="ml-2 text-sm font-medium">{result.relevanceScore.toFixed(1)}/5</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NtaiAnalysisResults;
