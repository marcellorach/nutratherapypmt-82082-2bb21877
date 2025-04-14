
import React from 'react';
import { Card, CardHeader, CardContent, CardFooter, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Bot, Beaker, Microscope, CheckCircle2, ChevronRight, AlertTriangle } from "lucide-react";
import { Study } from "../types/oraBiomedical";

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

export default StudyCard;
