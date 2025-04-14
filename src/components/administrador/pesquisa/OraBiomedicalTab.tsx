import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Bot, Microscope, Beaker, ChevronRight, Eye, AlertTriangle, CheckCircle2 } from "lucide-react";

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
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Estudos Totais</CardTitle>
            <CardDescription>Ensaios em C. elegans</CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-3xl font-bold">15</div>
            <p className="text-xs text-muted-foreground">+3 nos últimos 30 dias</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Compostos Analisados</CardTitle>
            <CardDescription>Testados em robôs</CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-3xl font-bold">247</div>
            <p className="text-xs text-muted-foreground">Dos 500 planejados (49.4%)</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Taxa de Sucesso</CardTitle>
            <CardDescription>Efeitos positivos detectados</CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-3xl font-bold">18.2%</div>
            <p className="text-xs text-muted-foreground">45 compostos com efeito positivo</p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="ongoing" value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList>
          <TabsTrigger value="ongoing">Em Andamento (4)</TabsTrigger>
          <TabsTrigger value="completed">Concluídos (8)</TabsTrigger>
          <TabsTrigger value="planned">Planejados (3)</TabsTrigger>
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

interface Study {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  progress: number; // 0-100
  compounds: number;
  positiveResults?: number;
  status: 'ongoing' | 'completed' | 'planned';
  primaryInvestigator: string;
  priority: 'high' | 'medium' | 'low';
  alerts?: number;
}

interface StudyCardProps {
  study: Study;
}

const StudyCard: React.FC<StudyCardProps> = ({ study }) => {
  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'bg-red-50 text-red-600 border-red-200';
      case 'medium': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'low': return 'bg-green-50 text-green-600 border-green-200';
    }
  };
  
  const getStatusIcon = (status: 'ongoing' | 'completed' | 'planned') => {
    switch (status) {
      case 'ongoing': return <Beaker className="h-4 w-4 text-blue-600" />;
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'planned': return <Microscope className="h-4 w-4 text-purple-600" />;
    }
  };
  
  const getStatusColor = (status: 'ongoing' | 'completed' | 'planned') => {
    switch (status) {
      case 'ongoing': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'completed': return 'bg-green-50 text-green-600 border-green-200';
      case 'planned': return 'bg-purple-50 text-purple-600 border-purple-200';
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR').format(date);
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className={getStatusColor(study.status)}>
                <div className="flex items-center gap-1">
                  {getStatusIcon(study.status)}
                  {study.status === 'ongoing' ? 'Em Andamento' : 
                   study.status === 'completed' ? 'Concluído' : 'Planejado'}
                </div>
              </Badge>
              <Badge variant="outline" className={getPriorityColor(study.priority)}>
                Prioridade {study.priority === 'high' ? 'Alta' : 
                           study.priority === 'medium' ? 'Média' : 'Baixa'}
              </Badge>
              {study.alerts && (
                <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
                  <AlertTriangle className="h-3 w-3 mr-1" /> {study.alerts} alertas
                </Badge>
              )}
            </div>
            <CardTitle>{study.title}</CardTitle>
            <CardDescription className="mt-1">{study.description}</CardDescription>
          </div>
          <Bot className="h-10 w-10 text-gray-300" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
          <div>
            <p className="text-muted-foreground mb-1">Investigador</p>
            <p className="font-medium">{study.primaryInvestigator}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Compostos</p>
            <p className="font-medium">{study.compounds}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Período</p>
            <p className="font-medium">
              {formatDate(study.startDate)}
              {study.endDate && ` - ${formatDate(study.endDate)}`}
            </p>
          </div>
        </div>
        
        {study.status !== 'planned' && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Progresso</span>
              <span className="font-medium">{study.progress}%</span>
            </div>
            <Progress value={study.progress} className="h-2" />
            {study.positiveResults !== undefined && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Resultados positivos: {study.positiveResults} compostos</span>
                <span>Taxa: {((study.positiveResults / study.compounds) * 100).toFixed(1)}%</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        <Button variant="ghost" className="w-full flex justify-center items-center text-sm">
          Ver detalhes <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardFooter>
    </Card>
  );
};

// Dados de exemplo
const ongoingStudies: Study[] = [
  {
    id: "ora-1",
    title: "Análise de flavonoides em longevidade de C. elegans",
    description: "Avaliação de 60 flavonoides naturais e seus efeitos na extensão do tempo de vida de C. elegans",
    startDate: "2025-03-01",
    progress: 68,
    compounds: 60,
    positiveResults: 12,
    status: 'ongoing',
    primaryInvestigator: "Dra. Marina Souza",
    priority: 'high'
  },
  {
    id: "ora-2",
    title: "Efeitos de polifenóis na função mitocondrial",
    description: "Investigação de compostos polifenólicos e seus efeitos na biogênese e função mitocondrial",
    startDate: "2025-02-15",
    progress: 42,
    compounds: 45,
    positiveResults: 8,
    status: 'ongoing',
    primaryInvestigator: "Dr. Felipe Mendes",
    priority: 'medium',
    alerts: 2
  },
  {
    id: "ora-3",
    title: "Avaliação de antibióticos na expressão de genes de longevidade",
    description: "Teste de 32 antibióticos e seus efeitos moduladores na expressão de genes relacionados à longevidade",
    startDate: "2025-03-10",
    progress: 25,
    compounds: 32,
    positiveResults: 3,
    status: 'ongoing',
    primaryInvestigator: "Dra. Carla Batista",
    priority: 'medium'
  },
  {
    id: "ora-4",
    title: "Peptídeos bioativos e resistência ao estresse oxidativo",
    description: "Screening de peptídeos com potencial antioxidante e efeitos na resistência ao estresse celular",
    startDate: "2025-03-20",
    progress: 12,
    compounds: 28,
    positiveResults: 2,
    status: 'ongoing',
    primaryInvestigator: "Dr. Ricardo Torres",
    priority: 'high',
    alerts: 1
  }
];

const completedStudies: Study[] = [
  {
    id: "ora-c1",
    title: "Impacto de inibidores de mTOR na longevidade",
    description: "Avaliação de análogos de rapamicina na extensão de vida de C. elegans",
    startDate: "2024-09-05",
    endDate: "2025-01-15",
    progress: 100,
    compounds: 22,
    positiveResults: 7,
    status: 'completed',
    primaryInvestigator: "Dr. André Correia",
    priority: 'medium'
  },
  {
    id: "ora-c2",
    title: "Compostos quelantes e acúmulo de metais pesados",
    description: "Análise de agentes quelantes na redução do acúmulo de metais e impacto na longevidade",
    startDate: "2024-07-20",
    endDate: "2024-12-10",
    progress: 100,
    compounds: 18,
    positiveResults: 4,
    status: 'completed',
    primaryInvestigator: "Dra. Paula Vieira",
    priority: 'low'
  },
  {
    id: "ora-c3",
    title: "Extratos vegetais em resistência a radiação UV",
    description: "Screening de extratos botânicos e seus efeitos protetores contra danos por radiação ultravioleta",
    startDate: "2024-10-12",
    endDate: "2025-02-28",
    progress: 100,
    compounds: 42,
    positiveResults: 9,
    status: 'completed',
    primaryInvestigator: "Dra. Marina Souza",
    priority: 'high'
  }
];

const plannedStudies: Study[] = [
  {
    id: "ora-p1",
    title: "Moduladores da autofagia em modelos de neurodegeneração",
    description: "Investigação de compostos que estimulam a autofagia em modelos de C. elegans para Alzheimer",
    startDate: "2025-05-10",
    progress: 0,
    compounds: 35,
    status: 'planned',
    primaryInvestigator: "Dr. Lucas Martins",
    priority: 'high'
  },
  {
    id: "ora-p2",
    title: "Isoflavonas e metabolismo lipídico",
    description: "Avaliação de isoflavonas derivadas de soja na modulação do metabolismo lipídico e longevidade",
    startDate: "2025-06-01",
    progress: 0,
    compounds: 24,
    status: 'planned',
    primaryInvestigator: "Dra. Júlia Campos",
    priority: 'medium'
  },
  {
    id: "ora-p3",
    title: "Alcaloides naturais e sinalização DAF-16/FOXO",
    description: "Análise de alcaloides vegetais na modulação de vias de sinalização relacionadas à longevidade",
    startDate: "2025-05-15",
    progress: 0,
    compounds: 30,
    status: 'planned',
    primaryInvestigator: "Dr. Mateus Costa",
    priority: 'low'
  }
];

export default OraBiomedicalTab;
