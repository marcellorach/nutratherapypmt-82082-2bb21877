
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link2, Network, Target } from "lucide-react";

const RelationsTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Condições de Saúde
            </CardTitle>
            <CardDescription>
              Associe nutracêuticos a condições veterinárias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge variant="outline">Prevention</Badge>
              <Badge variant="outline">Treatment</Badge>
              <Badge variant="outline">Support</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-primary" />
              Estudos Científicos
            </CardTitle>
            <CardDescription>
              Relacione nutracêuticos a estudos publicados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge variant="outline">Relevance Score</Badge>
              <Badge variant="outline">DOI Links</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5 text-primary" />
              Outcomes
            </CardTitle>
            <CardDescription>
              Conecte nutracêuticos a outcomes mensuráveis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge variant="outline">Evidence Quality</Badge>
              <Badge variant="outline">Efficacy Score</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Funcionalidade em Desenvolvimento</CardTitle>
          <CardDescription>
            Interface interativa para gerenciar relações entre nutracêuticos, condições de saúde, estudos científicos e outcomes.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12 text-muted-foreground">
          <p>
            Esta aba facilitará a associação entre entidades usando drag-and-drop,
            filtros inteligentes e visualização em cards das relações existentes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RelationsTab;
