import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Target, DollarSign, Activity, AlertTriangle } from "lucide-react";
import { useROIIntelligence, MarketOpportunity } from '@/hooks/roi/useROIIntelligence';

interface MarketOpportunityMatrixProps {
  onOpportunitySelect?: (opportunity: MarketOpportunity) => void;
}

export const MarketOpportunityMatrix: React.FC<MarketOpportunityMatrixProps> = ({ onOpportunitySelect }) => {
  const { marketOpportunities, isLoading } = useROIIntelligence();
  const [sortBy, setSortBy] = useState<'potentialROI' | 'marketGap' | 'confidenceScore'>('potentialROI');

  const sortedOpportunities = [...marketOpportunities].sort((a, b) => {
    switch (sortBy) {
      case 'potentialROI':
        return b.potentialROI - a.potentialROI;
      case 'marketGap':
        return b.marketGap - a.marketGap;
      case 'confidenceScore':
        return b.confidenceScore - a.confidenceScore;
      default:
        return 0;
    }
  });

  const getOpportunityLevel = (gap: number, roi: number) => {
    if (gap > 70 && roi > 400) return { level: 'Muito Alta', color: 'bg-red-500', textColor: 'text-red-700' };
    if (gap > 60 && roi > 300) return { level: 'Alta', color: 'bg-orange-500', textColor: 'text-orange-700' };
    if (gap > 50 && roi > 200) return { level: 'Média', color: 'bg-yellow-500', textColor: 'text-yellow-700' };
    return { level: 'Baixa', color: 'bg-green-500', textColor: 'text-green-700' };
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Matriz de Oportunidades de Mercado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted/50 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Matriz de Oportunidades de Mercado
            </CardTitle>
            <CardDescription>
              Análise de gaps terapêuticos e potencial de ROI por condição
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="potentialROI">ROI Potencial</SelectItem>
                <SelectItem value="marketGap">Gap de Mercado</SelectItem>
                <SelectItem value="confidenceScore">Confiança</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {sortedOpportunities.map((opportunity) => {
            const opportunityLevel = getOpportunityLevel(opportunity.marketGap, opportunity.potentialROI);
            const savings = opportunity.treatmentCost - opportunity.preventionCost;
            const savingsPercentage = Math.round((savings / opportunity.treatmentCost) * 100);
            
            return (
              <Card 
                key={opportunity.conditionId} 
                className="border border-border/40 hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => onOpportunitySelect?.(opportunity)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{opportunity.conditionName}</h4>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          Gap: {opportunity.marketGap}%
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          ROI: {opportunity.potentialROI}%
                        </span>
                        <span className={`flex items-center gap-1 ${getConfidenceColor(opportunity.confidenceScore)}`}>
                          <Activity className="h-3 w-3" />
                          Confiança: {opportunity.confidenceScore}%
                        </span>
                      </div>
                    </div>
                    
                    <Badge 
                      className={`${opportunityLevel.color} text-white border-0`}
                    >
                      {opportunityLevel.level}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Custo Tratamento:</span>
                        <span className="font-medium">R$ {opportunity.treatmentCost.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Custo Prevenção:</span>
                        <span className="font-medium text-green-600">R$ {opportunity.preventionCost.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Economia:</span>
                        <span className="font-medium text-green-600">R$ {savings.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Redução Risco:</span>
                        <span className="font-medium">{opportunity.riskReduction}%</span>
                      </div>
                    </div>
                  </div>
                  
                  {opportunity.recommendedNutraceuticals.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-sm text-muted-foreground">Nutracêuticos Recomendados:</span>
                      <div className="flex flex-wrap gap-1">
                        {opportunity.recommendedNutraceuticals.map((nutr) => (
                          <Badge key={nutr} variant="outline" className="text-xs">
                            {nutr}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-border/40">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-muted-foreground">
                        Economia de {savingsPercentage}% vs tratamento tradicional
                      </span>
                    </div>
                    
                    <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                      Analisar →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Interpretação da Matriz</p>
              <p className="text-xs text-muted-foreground">
                O Gap de Mercado indica a lacuna terapêutica existente, enquanto o ROI Potencial 
                mostra o retorno esperado. Oportunidades "Muito Alta" combinam grande gap com alto ROI.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};