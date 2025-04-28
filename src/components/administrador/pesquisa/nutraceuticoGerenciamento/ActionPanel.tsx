
import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

const ActionPanel: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ações Rápidas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button variant="outline" className="w-full justify-start" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Nutracêutico
        </Button>
        <Button variant="outline" className="w-full justify-start" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Categoria
        </Button>
        <Button variant="outline" className="w-full justify-start" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Condição de Saúde
        </Button>
        <Button variant="outline" className="w-full justify-start" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Estudo Científico
        </Button>
      </CardContent>
    </Card>
  );
};

export default ActionPanel;
