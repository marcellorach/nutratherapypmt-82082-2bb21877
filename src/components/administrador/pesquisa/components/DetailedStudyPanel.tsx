
import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartLine, Heart, ChartBar, Info } from "lucide-react";
import { OngoingStudy } from '../types/studyTypes';
import DogGroupVisualization from './DogGroupVisualization';
import StudyProgressCard from './StudyProgressCard';
import PartialResultsChart from './PartialResultsChart';
import StudyPhaseIndicator from './StudyPhaseIndicator';

interface DetailedStudyPanelProps {
  study: OngoingStudy;
}

const DetailedStudyPanel: React.FC<DetailedStudyPanelProps> = ({ study }) => {
  const [activeTab, setActiveTab] = useState<string>("overview");
  
  const formatValue = (value: number, formatterType?: string) => {
    if (formatterType === 'percent') return `${value}%`;
    return `${value}`;
  };
  
  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
          <div className="flex-1">
            <CardTitle className="text-xl">{study.title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{study.description}</p>
          </div>
          <StudyPhaseIndicator phase={study.phase} />
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="mb-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                <span>Visão Geral</span>
              </TabsTrigger>
              <TabsTrigger value="metrics" className="flex items-center gap-2">
                <ChartBar className="h-4 w-4" />
                <span>Métricas</span>
              </TabsTrigger>
              <TabsTrigger value="trends" className="flex items-center gap-2">
                <ChartLine className="h-4 w-4" />
                <span>Tendências</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">População do Estudo</h3>
                  <DogGroupVisualization 
                    treatmentCount={study.treatmentCount} 
                    controlCount={study.controlCount} 
                  />
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Raças:</span>
                      <span className="text-sm">{study.breeds?.join(', ') || 'Não especificado'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Faixa Etária:</span>
                      <span className="text-sm">{study.ageRange || 'Não especificado'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Intervenção:</span>
                      <span className="text-sm">{study.interventionType || 'Não especificado'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Investigador Principal:</span>
                      <span className="text-sm">{study.primaryInvestigator}</span>
                    </div>
                  </div>
                </div>
                
                <StudyProgressCard 
                  currentDay={study.currentDay}
                  totalDays={study.totalDays}
                  phases={study.phases}
                />
              </div>
              
              {study.notes && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-800">Notas do Estudo</h4>
                      <p className="text-sm text-blue-700">{study.notes}</p>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="metrics" className="pt-4 space-y-6">
              {study.metrics?.slice(0, 2).map((metric, index) => (
                <PartialResultsChart
                  key={index}
                  title={metric.title}
                  description={metric.description}
                  data={metric.data}
                  yAxisLabel={metric.yAxisLabel}
                  chartType={metric.chartType}
                  formatter={(value) => formatValue(value, metric.formatter)}
                />
              ))}
            </TabsContent>
            
            <TabsContent value="trends" className="pt-4 space-y-6">
              {study.metrics?.slice(2).map((metric, index) => (
                <PartialResultsChart
                  key={index}
                  title={metric.title}
                  description={metric.description}
                  data={metric.data}
                  yAxisLabel={metric.yAxisLabel}
                  chartType={metric.chartType}
                  formatter={(value) => formatValue(value, metric.formatter)}
                />
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
};

export default DetailedStudyPanel;
