
import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

interface StatisticsPanelProps {
  nutraceuticals: any[];
  outcomes: any[];
  conditions: any[];
  studies: any[];
  isLoading: boolean;
}

const StatisticsPanel: React.FC<StatisticsPanelProps> = ({
  nutraceuticals,
  outcomes,
  conditions,
  studies,
  isLoading
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Estatísticas</CardTitle>
        <CardDescription>
          Visão geral do banco de dados de nutracêuticos
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Total de Nutracêuticos</div>
              <div className="text-2xl font-bold">{nutraceuticals.length}</div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Outcomes</div>
              <div className="text-2xl font-bold">{outcomes.length}</div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Condições de Saúde</div>
              <div className="text-2xl font-bold">{conditions.length}</div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Estudos Científicos</div>
              <div className="text-2xl font-bold">{studies.length}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatisticsPanel;
