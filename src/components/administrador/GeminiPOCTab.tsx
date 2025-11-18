import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Zap } from "lucide-react";

const GeminiPOCTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">🧪 NTAI Lab</h2>
        <p className="text-muted-foreground mt-2">
          Prova de Conceito: Gemini File Search + Structured Output
        </p>
      </div>

      <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/20 dark:border-purple-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-600" />
            Status do POC
          </CardTitle>
          <CardDescription>
            Estrutura criada - Implementação em andamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✅</span>
              <span>Tab criada</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">✅</span>
              <span>Edge function configurada</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">⏳</span>
              <span>Upload de PDFs (próximo)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">⏳</span>
              <span>Query + Structured Output (próximo)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Testar Upload</CardTitle>
          <CardDescription>
            Carregar PDF e processar com Gemini File Search
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button disabled className="w-full">
            <Upload className="mr-2 h-4 w-4" />
            Em desenvolvimento...
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default GeminiPOCTab;
