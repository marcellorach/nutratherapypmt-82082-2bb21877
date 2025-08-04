import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Eye, TrendingUp, Calculator } from "lucide-react";

interface AnalyticsModuleProps {
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
}

const AnalyticsModule: React.FC<AnalyticsModuleProps> = ({ audienceSegments }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">847</p>
                <p className="text-xs text-muted-foreground">Campanhas Enviadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">68.4%</p>
                <p className="text-xs text-muted-foreground">Taxa de Abertura</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">42.1%</p>
                <p className="text-xs text-muted-foreground">Taxa de Conversão</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Calculator className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">3.7x</p>
                <p className="text-xs text-muted-foreground">ROI Médio</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance por Segmento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {audienceSegments.map((segment) => (
              <div key={segment.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">{segment.name}</h4>
                  <Badge className={`bg-${segment.color}-100 text-${segment.color}-800`}>
                    {(segment.conversionRate * 100).toFixed(0)}% conversão
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Enviados:</span>
                    <p className="font-medium">{segment.count}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">ROI Potencial:</span>
                    <p className="font-medium">{segment.roiPotential.toFixed(1)}x</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Prioridade:</span>
                    <Badge 
                      variant={
                        segment.priority === 'critical' ? 'destructive' :
                        segment.priority === 'high' ? 'default' :
                        segment.priority === 'medium' ? 'secondary' : 'outline'
                      }
                    >
                      {segment.priority}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsModule;