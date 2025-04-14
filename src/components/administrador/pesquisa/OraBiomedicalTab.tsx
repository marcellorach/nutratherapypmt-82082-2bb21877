
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Microscope, Eye } from "lucide-react";
import StatsCard from "./components/StatsCard";
import StudyCard from "./components/StudyCard";
import { ongoingStudies, completedStudies, plannedStudies } from "./data/oraBiomedicalData";
import { useTranslation } from 'react-i18next';

const OraBiomedicalTab: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<string>("ongoing");
  const { t } = useTranslation();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight">{t('research.oraBiomedical.title')}</h2>
            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
              {t('research.oraBiomedical.activePartnership')}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            {t('research.oraBiomedical.description')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="flex items-center">
            <Eye className="mr-2 h-4 w-4" />
            {t('research.oraBiomedical.liveDashboard')}
          </Button>
          <Button className="flex items-center">
            <Microscope className="mr-2 h-4 w-4" />
            {t('research.oraBiomedical.newStudy')}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard 
          title={t('research.oraBiomedical.totalStudies')} 
          description={t('research.oraBiomedical.studiesSubtitle')} 
          value={15} 
          footer={t('research.oraBiomedical.lastDays')} 
        />
        <StatsCard 
          title={t('research.oraBiomedical.analyzedCompounds')} 
          description={t('research.oraBiomedical.compoundsSubtitle')} 
          value={247} 
          footer={`${t('research.oraBiomedical.ofPlanned')} (49.4%)`} 
        />
        <StatsCard 
          title={t('research.oraBiomedical.successRate')} 
          description={t('research.oraBiomedical.successSubtitle')} 
          value="18.2%" 
          footer={t('research.oraBiomedical.positiveEffect')} 
        />
      </div>
      
      <Tabs defaultValue="ongoing" value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList>
          <TabsTrigger value="ongoing">
            {t('research.tabs.ongoing')} ({ongoingStudies.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            {t('research.tabs.completed')} ({completedStudies.length})
          </TabsTrigger>
          <TabsTrigger value="planned">
            {t('research.tabs.planned')} ({plannedStudies.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="ongoing" className="mt-4 space-y-4">
          {ongoingStudies.map((study) => (
            <StudyCard key={study.id} study={study} />
          ))}
        </TabsContent>
        <TabsContent value="completed" className="mt-4 space-y-4">
          {completedStudies.map((study) => (
            <StudyCard key={study.id} study={study} />
          ))}
        </TabsContent>
        <TabsContent value="planned" className="mt-4 space-y-4">
          {plannedStudies.map((study) => (
            <StudyCard key={study.id} study={study} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OraBiomedicalTab;
