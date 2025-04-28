
import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface LastUpdatePanelProps {
  isLoading: boolean;
}

const LastUpdatePanel: React.FC<LastUpdatePanelProps> = ({ isLoading }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Última Atualização</CardTitle>
        <CardDescription>
          Informações sobre as últimas alterações
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : (
            <p className="text-sm">
              Última atualização do banco de dados em{" "}
              {new Date().toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LastUpdatePanel;
