
import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartLine, ChartBar, Info, Dog } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { OngoingStudy } from '../types/studyTypes';
import DogGroupVisualization from './DogGroupVisualization';
import StudyProgressCard from './StudyProgressCard';
import PartialResultsChart from './PartialResultsChart';
import StudyPhaseIndicator from './StudyPhaseIndicator';
import StudyNotesCard from './StudyNotesCard';

interface DetailedStudyPanelProps {
  study: OngoingStudy;
}

const DetailedStudyPanel: React.FC<DetailedStudyPanelProps> = ({ study }) => {
  const { t } = useTranslation();
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
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                <span>{t('admin.studies.ongoingStudies.tabs.overview')}</span>
              </TabsTrigger>
              <TabsTrigger value="metrics" className="flex items-center gap-2">
                <ChartBar className="h-4 w-4" />
                <span>{t('admin.studies.ongoingStudies.tabs.metrics')}</span>
              </TabsTrigger>
              <TabsTrigger value="trends" className="flex items-center gap-2">
                <ChartLine className="h-4 w-4" />
                <span>{t('admin.studies.ongoingStudies.tabs.trends')}</span>
              </TabsTrigger>
              <TabsTrigger value="dogsData" className="flex items-center gap-2">
                <Dog className="h-4 w-4" />
                <span>{t('admin.studies.ongoingStudies.tabs.dogsData')}</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">{t('admin.studies.ongoingStudies.overview.studyPopulation')}</h3>
                  <DogGroupVisualization 
                    treatmentCount={study.treatmentCount} 
                    controlCount={study.controlCount} 
                  />
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{t('admin.studies.ongoingStudies.overview.breeds')}</span>
                      <span className="text-sm">{study.breeds?.join(', ') || t('admin.studies.ongoingStudies.overview.notSpecified')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{t('admin.studies.ongoingStudies.overview.ageRange')}</span>
                      <span className="text-sm">{study.ageRange || t('admin.studies.ongoingStudies.overview.notSpecified')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{t('admin.studies.ongoingStudies.overview.intervention')}</span>
                      <span className="text-sm">{study.interventionType || t('admin.studies.ongoingStudies.overview.notSpecified')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{t('admin.studies.ongoingStudies.overview.primaryInvestigator')}</span>
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
                <StudyNotesCard notes={study.notes} />
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
            
            <TabsContent value="dogsData" className="pt-4">
              <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
                {t('admin.studies.ongoingStudies.dogsData.placeholder')}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
};

export default DetailedStudyPanel;
