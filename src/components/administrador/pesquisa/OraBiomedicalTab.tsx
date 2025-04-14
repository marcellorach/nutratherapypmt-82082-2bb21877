
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Microscope, Eye } from "lucide-react";
import StatsCard from "./components/StatsCard";
import StudyCard from "./components/StudyCard";
import { ongoingStudies, completedStudies, plannedStudies } from "./data/oraBiomedicalData";

const OraBiomedicalTab: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<string>("ongoing");
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight">Ora Biomedical</h2>
            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Parceria Ativa</Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Análise automatizada de compostos geroprotetores em C. elegans usando sistemas robóticos
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="flex items-center">
            <Eye className="mr-2 h-4 w-4" />
            Dashboard ao vivo
          </Button>
          <Button className="flex items-center">
            <Microscope className="mr-2 h-4 w-4" />
            Novo estudo
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard 
          title="Estudos Totais" 
          description="Ensaios em C. elegans" 
          value={15} 
          footer="+3 nos últimos 30 dias" 
        />
        <StatsCard 
          title="Compostos Analisados" 
          description="Testados em robôs" 
          value={247} 
          footer="Dos 500 planejados (49.4%)" 
        />
        <StatsCard 
          title="Taxa de Sucesso" 
          description="Efeitos positivos detectados" 
          value="18.2%" 
          footer="45 compostos com efeito positivo" 
        />
      </div>
      
      <Tabs defaultValue="ongoing" value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList>
          <TabsTrigger value="ongoing">Em Andamento ({ongoingStudies.length})</TabsTrigger>
          <TabsTrigger value="completed">Concluídos ({completedStudies.length})</TabsTrigger>
          <TabsTrigger value="planned">Planejados ({plannedStudies.length})</TabsTrigger>
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
