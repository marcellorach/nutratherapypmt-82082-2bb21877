import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send } from "lucide-react";

interface CampaignType {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  segments: string[];
  estimatedConversion: number;
  roi: number;
}

interface CreationModuleProps {
  campaignTypes: CampaignType[];
  audienceSegments: Array<{
    id: string;
    name: string;
    count: number;
    color: string;
  }>;
  onCampaignExecute: (campaignType: string, segments: string[]) => void;
  isExecuting: boolean;
}

const CreationModule: React.FC<CreationModuleProps> = ({ 
  campaignTypes, 
  audienceSegments, 
  onCampaignExecute, 
  isExecuting 
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {campaignTypes.map((campaign) => (
          <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <campaign.icon className="h-5 w-5 mr-2 text-primary" />
                {campaign.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{campaign.description}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">ROI Estimado</span>
                  <Badge className="bg-blue-100 text-blue-800">
                    {campaign.roi.toFixed(1)}x
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Taxa Conversão</span>
                  <span className="text-sm font-bold">
                    {(campaign.estimatedConversion * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium">Segmentos Alvo:</span>
                  <div className="flex flex-wrap gap-2">
                    {campaign.segments.map(segmentId => {
                      const segment = audienceSegments.find(s => s.id === segmentId);
                      return segment ? (
                        <Badge 
                          key={segmentId} 
                          variant="outline" 
                          className={`text-${segment.color}-700 border-${segment.color}-300`}
                        >
                          {segment.count} destinatários
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => onCampaignExecute(campaign.id, campaign.segments)}
                  disabled={isExecuting}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Criar Campanha
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CreationModule;