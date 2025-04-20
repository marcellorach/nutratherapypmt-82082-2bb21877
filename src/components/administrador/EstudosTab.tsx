
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileText, ClipboardCheck } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import AdicionarEstudoDialog from './dialogs/AdicionarEstudoDialog';
import { useToast } from "@/hooks/use-toast";
import ApprovalChain from './pesquisa/components/ApprovalChain';

const EstudosTab: React.FC = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const handleAddEstudo = () => {
    setDialogOpen(true);
  };
  
  const handleEstudoAdicionado = () => {
    setDialogOpen(false);
    toast({
      title: "Estudo adicionado com sucesso",
      description: "O estudo foi enviado para o processo de curadoria.",
    });
  };
  
  return (
    <>
      <div className="flex flex-col space-y-6">
        <div className="grid grid-cols-3 gap-6">
          {/* Coluna: Novos Estudos */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Novos Estudos
            </h3>
            <div className="bg-secondary/20 rounded-lg p-4 min-h-[500px]">
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Journal of Veterinary Medicine, 2023</CardTitle>
                    <CardDescription>Estudo sobre ômega 3 e 6 em cães</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full" size="sm">
                      Iniciar Curadoria
                    </Button>
                  </CardContent>
                </Card>
                
                {/* Card para adicionar novo estudo */}
                <Card className="border-dashed border-2 border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer" onClick={handleAddEstudo}>
                  <CardContent className="flex flex-col items-center justify-center py-6">
                    <Plus className="h-8 w-8 text-gray-400" />
                    <p className="text-gray-500 mt-2">Adicionar novo estudo</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Coluna: Em Curadoria */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Em Curadoria
            </h3>
            <div className="bg-secondary/20 rounded-lg p-4 min-h-[500px]">
              <Card>
                <CardHeader>
                  <CardTitle>Animal Care Journal, 2023</CardTitle>
                  <CardDescription>Eficácia de glucosamina em cães idosos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ApprovalChain 
                    stages={[
                      { name: 'Análise Inicial', status: 'completed' },
                      { name: 'Revisão Técnica', status: 'in-progress' },
                      { name: 'Validação', status: 'pending' },
                      { name: 'Aprovação Final', status: 'pending' }
                    ]}
                  />
                  <Button variant="outline" className="w-full" size="sm">
                    Ver Detalhes
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Coluna: Aguardando Integração */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Aguardando Integração
            </h3>
            <div className="bg-secondary/20 rounded-lg p-4 min-h-[500px]">
              <Card>
                <CardHeader>
                  <CardTitle>Veterinary Research, 2023</CardTitle>
                  <CardDescription>Nutracêuticos para saúde articular</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" size="sm">
                    Integrar ao Sistema
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <AdicionarEstudoDialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        onEstudoAdicionado={handleEstudoAdicionado}
      />
    </>
  );
};

export default EstudosTab;
