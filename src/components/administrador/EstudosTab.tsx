
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileText, ClipboardCheck, ExternalLink, Filter } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import AdicionarEstudoDialog from './dialogs/AdicionarEstudoDialog';
import EstudoDetailDialog from './dialogs/EstudoDetailDialog';
import { useToast } from "@/hooks/use-toast";
import ApprovalStagesList from './pesquisa/components/ApprovalStagesList';
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

// Dados de exemplo para estudos
const estudosExemplo = [
  {
    id: "1",
    title: "Journal of Veterinary Medicine, 2023",
    description: "Estudo sobre ômega 3 e 6 em cães",
    journal: "Journal of Veterinary Medicine",
    year: "2023",
    status: "new",
    abstract: "Este estudo examina os efeitos de suplementação de ômega 3 e 6 em cães com problemas articulares. Os resultados mostram melhora significativa na mobilidade após 8 semanas de tratamento.",
    nutraceuticals: ["Ômega 3", "Ômega 6"],
    sampleSize: 120,
  },
  {
    id: "2",
    title: "Animal Care Journal, 2023",
    description: "Eficácia de glucosamina em cães idosos",
    journal: "Animal Care Journal",
    year: "2023",
    status: "in-review",
    abstract: "Estudo controlado randomizado avaliando a eficácia de glucosamina em cães idosos com osteoartrite. O grupo de tratamento mostrou melhora de 42% nos escores de dor em comparação com o placebo.",
    nutraceuticals: ["Glucosamina", "Condroitina"],
    sampleSize: 85,
  },
  {
    id: "3",
    title: "Veterinary Research, 2023",
    description: "Nutracêuticos para saúde articular",
    journal: "Veterinary Research",
    year: "2023",
    status: "approved",
    abstract: "Meta-análise de 17 estudos sobre o uso de nutracêuticos para saúde articular em cães. A análise demonstra benefícios consistentes com tratamento prolongado de combinações específicas de suplementos.",
    nutraceuticals: ["MSM", "Glucosamina", "Condroitina", "Extrato de Mexilhão de Lábio Verde"],
    sampleSize: 940,
  },
];

const EstudosTab: React.FC = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedEstudo, setSelectedEstudo] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
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

  const handleViewEstudo = (estudo: any) => {
    setSelectedEstudo(estudo);
    setDetailDialogOpen(true);
  };

  const handleAdvanceApproval = (estudoId: string) => {
    // Lógica para avançar estágio de aprovação
    toast({
      title: "Estágio avançado",
      description: "O estudo passou para o próximo estágio de aprovação.",
    });
    setDetailDialogOpen(false);
  };

  // Filtrar estudos com base no termo de busca
  const filteredEstudos = estudosExemplo.filter(estudo => 
    estudo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    estudo.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    estudo.journal.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Agrupar estudos por status
  const novoEstudos = filteredEstudos.filter(estudo => estudo.status === "new");
  const emRevEstudos = filteredEstudos.filter(estudo => estudo.status === "in-review");
  const aprovadosEstudos = filteredEstudos.filter(estudo => estudo.status === "approved");
  
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold">Estudos Científicos</h2>
          <p className="text-gray-600">Gerenciamento e análise de estudos sobre nutracêuticos</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="flex items-center">
            <Filter className="mr-2 h-4 w-4" />
            Filtros Avançados
          </Button>
          <Button onClick={handleAddEstudo} className="flex items-center">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Estudo
          </Button>
        </div>
      </div>
      
      <div className="mb-6">
        <Input
          placeholder="Buscar estudos por título, descrição ou journal..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="max-w-lg"
        />
      </div>

      <div className="flex flex-col space-y-6">
        <div className="grid grid-cols-3 gap-6">
          {/* Coluna: Novos Estudos */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Novos Estudos
              {novoEstudos.length > 0 && (
                <Badge variant="secondary">{novoEstudos.length}</Badge>
              )}
            </h3>
            <div className="bg-secondary/20 rounded-lg p-4 min-h-[500px]">
              <div className="grid gap-4">
                {novoEstudos.map(estudo => (
                  <Card key={estudo.id}>
                    <CardHeader>
                      <CardTitle>{estudo.title}</CardTitle>
                      <CardDescription>{estudo.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-1">
                        {estudo.nutraceuticals?.map((nutra: string, idx: number) => (
                          <span key={idx} className="text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-0.5">
                            {nutra}
                          </span>
                        ))}
                      </div>
                      <div className="flex justify-between">
                        <Button 
                          variant="outline" 
                          className="w-full" 
                          size="sm"
                          onClick={() => handleViewEstudo(estudo)}
                        >
                          Iniciar Curadoria
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {/* Card para adicionar novo estudo */}
                <Card 
                  className="border-dashed border-2 border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer" 
                  onClick={handleAddEstudo}
                >
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
              {emRevEstudos.length > 0 && (
                <Badge variant="secondary">{emRevEstudos.length}</Badge>
              )}
            </h3>
            <div className="bg-secondary/20 rounded-lg p-4 min-h-[500px]">
              {emRevEstudos.map(estudo => (
                <Card key={estudo.id} className="mb-4">
                  <CardHeader>
                    <CardTitle>{estudo.title}</CardTitle>
                    <CardDescription>{estudo.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ApprovalStagesList 
                      stages={[
                        { name: 'Análise Inicial', status: 'completed' },
                        { name: 'Revisão Técnica', status: 'in-progress' },
                        { name: 'Validação', status: 'pending' },
                        { name: 'Aprovação Final', status: 'pending' }
                      ]}
                    />
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      size="sm"
                      onClick={() => handleViewEstudo(estudo)}
                    >
                      Ver Detalhes
                    </Button>
                  </CardContent>
                </Card>
              ))}
              
              {emRevEstudos.length === 0 && (
                <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                  <ClipboardCheck className="h-10 w-10 mb-2 opacity-30" />
                  <p>Nenhum estudo em curadoria</p>
                </div>
              )}
            </div>
          </div>

          {/* Coluna: Aguardando Integração */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Aprovados
              {aprovadosEstudos.length > 0 && (
                <Badge variant="secondary">{aprovadosEstudos.length}</Badge>
              )}
            </h3>
            <div className="bg-secondary/20 rounded-lg p-4 min-h-[500px]">
              {aprovadosEstudos.map(estudo => (
                <Card key={estudo.id} className="mb-4">
                  <CardHeader>
                    <CardTitle>{estudo.title}</CardTitle>
                    <CardDescription>{estudo.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-green-600 text-sm">
                        <CheckCircle className="mr-1 h-4 w-4" />
                        Aprovado
                      </div>
                      <div className="text-xs text-gray-500">15/04/2024</div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1" 
                        size="sm"
                        onClick={() => handleViewEstudo(estudo)}
                      >
                        Ver Detalhes
                      </Button>
                      <Button 
                        variant="outline"
                        size="icon"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {aprovadosEstudos.length === 0 && (
                <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                  <FileText className="h-10 w-10 mb-2 opacity-30" />
                  <p>Nenhum estudo aprovado</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AdicionarEstudoDialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        onEstudoAdicionado={handleEstudoAdicionado}
      />
      
      <EstudoDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        estudo={selectedEstudo}
        onAdvanceApproval={handleAdvanceApproval}
      />
    </>
  );
};

export default EstudosTab;
