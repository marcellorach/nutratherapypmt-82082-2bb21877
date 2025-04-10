
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Brain } from "lucide-react";

const PromptsTab: React.FC = () => {
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Prompts da IA</h2>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Prompt
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Análise de Exames
            </CardTitle>
            <CardDescription>Prompt para análise de resultados de exames</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 p-4 rounded-md mb-4 h-40 overflow-y-auto">
              <p className="text-sm font-mono text-gray-700">
                Você é um assistente veterinário especializado em interpretar exames de sangue de pets.
                Analise os seguintes valores do exame e identifique possíveis deficiências nutricionais,
                recomendando nutracêuticos específicos do nosso catálogo para corrigir essas deficiências.
                Considere a raça, idade e peso do animal...
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Editar</Button>
              <Button variant="outline" size="sm">Testar</Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Recomendação Preventiva
            </CardTitle>
            <CardDescription>Prompt para prevenção por raças</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 p-4 rounded-md mb-4 h-40 overflow-y-auto">
              <p className="text-sm font-mono text-gray-700">
                Você é um especialista em medicina preventiva veterinária.
                Com base na raça, idade e peso do animal, identifique as doenças
                degenerativas mais comuns para este perfil e recomende nutracêuticos
                do nosso catálogo que possam prevenir estas condições...
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Editar</Button>
              <Button variant="outline" size="sm">Testar</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default PromptsTab;
