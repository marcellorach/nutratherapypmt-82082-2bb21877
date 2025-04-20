
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, ArrowRight } from "lucide-react";

const DesignConventionsTab = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Convenções de Design</h2>
        <p className="text-gray-600">Documentação de padrões visuais e convenções de design do sistema</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sistema de Tags e Ícones</CardTitle>
          <CardDescription>
            Padrões de visualização para tags, badges e indicadores visuais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Direcionais e Indicadores</h3>
            <div className="grid gap-4">
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center">
                  <ArrowUp className="w-3 h-3 mr-1" />
                  Positivo/Melhora
                </Badge>
                <span className="text-sm text-gray-600">Usado para interações positivas e melhorias</span>
              </div>
              
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center">
                  <ArrowDown className="w-3 h-3 mr-1" />
                  Negativo/Piora
                </Badge>
                <span className="text-sm text-gray-600">Usado para interações negativas e contraindicações</span>
              </div>
              
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center">
                  <ArrowRight className="w-3 h-3 mr-1" />
                  Efeito/Resultado
                </Badge>
                <span className="text-sm text-gray-600">Usado para efeitos colaterais e resultados neutros</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Paleta de Cores</h3>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">Interações Positivas:</span>
                <span className="ml-2 px-2 py-1 bg-green-50 text-green-700 rounded">bg-green-50</span>
                <span className="ml-2 px-2 py-1 text-green-700">text-green-700</span>
              </p>
              <p className="text-sm">
                <span className="font-medium">Interações Negativas:</span>
                <span className="ml-2 px-2 py-1 bg-red-50 text-red-700 rounded">bg-red-50</span>
                <span className="ml-2 px-2 py-1 text-red-700">text-red-700</span>
              </p>
              <p className="text-sm">
                <span className="font-medium">Efeitos e Alertas:</span>
                <span className="ml-2 px-2 py-1 bg-amber-50 text-amber-700 rounded">bg-amber-50</span>
                <span className="ml-2 px-2 py-1 text-amber-700">text-amber-700</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DesignConventionsTab;
