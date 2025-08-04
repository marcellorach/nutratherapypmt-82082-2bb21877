import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Target, Brain } from "lucide-react";
import { useROIIntelligence } from "@/hooks/roi/useROIIntelligence";

interface CommandModuleProps {
  audienceSegments: Array<{
    id: string;
    name: string;
    count: number;
    roiPotential: number;
    conversionRate: number;
    priority: string;
    description: string;
    color: string;
  }>;
  marketOpportunities: any[];
}

const CommandModule: React.FC<CommandModuleProps> = ({ audienceSegments, marketOpportunities }) => {
  const { roiMetrics } = useROIIntelligence();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-2 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <BarChart3 className="h-5 w-5 mr-2 text-primary" />
              Performance Global
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">ROI Médio</span>
                <span className="font-bold text-primary">{roiMetrics.averageROI.toFixed(1)}x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Taxa Conversão</span>
                <span className="font-bold">47.3%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Campanhas Ativas</span>
                <span className="font-bold">12</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Target className="h-5 w-5 mr-2 text-green-600" />
              Oportunidades Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Alto Potencial</span>
                <Badge className="bg-green-100 text-green-800">{marketOpportunities.length}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Valor Estimado</span>
                <span className="font-bold text-green-600">R$ 847K</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Segmentos</span>
                <span className="font-bold">{audienceSegments.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Brain className="h-5 w-5 mr-2 text-purple-600" />
              IA Personalização
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Algoritmos Ativos</span>
                <span className="font-bold">8</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Precisão</span>
                <span className="font-bold text-purple-600">94.2%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Otimização</span>
                <Badge className="bg-purple-100 text-purple-800">Ativa</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CommandModule;