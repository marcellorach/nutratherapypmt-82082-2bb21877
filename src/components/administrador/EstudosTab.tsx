
import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Database, FileText, FileCode, ArrowDown, ArrowUp, ListCheck, Filter } from "lucide-react";
import AdicionarEstudoDialog from './dialogs/AdicionarEstudoDialog';
import EstudoDetailDialog from './dialogs/EstudoDetailDialog';
import EstudosHeader from './estudos/EstudosHeader';
import EstudoSearch from './estudos/EstudoSearch';
import EstudosColumn from './estudos/EstudosColumn';
import SciImportSection from './estudos/import/SciImportSection';
import NtaiProcessingSection from './estudos/analysis/NtaiProcessingSection';
import './estudos/estudos.css';

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
    qualityScore: 4.2,
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
    qualityScore: 3.8,
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
    qualityScore: 4.5,
  },
];

const EstudosTab: React.FC = () => {
  const [mainTab, setMainTab] = useState<string>("importar");
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
    toast({
      title: "Estágio avançado",
      description: "O estudo passou para o próximo estágio de aprovação.",
    });
    setDetailDialogOpen(false);
  };

  const filteredEstudos = estudosExemplo.filter(estudo => 
    estudo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    estudo.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    estudo.journal.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const novoEstudos = filteredEstudos.filter(estudo => estudo.status === "new");
  const emRevEstudos = filteredEstudos.filter(estudo => estudo.status === "in-review");
  const aprovadosEstudos = filteredEstudos.filter(estudo => estudo.status === "approved");
  
  const getNutraceuticalScore = (name: string): number => {
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 50;
    return 2 + (hash / 10); // Pontuação entre 2.0 e 6.9
  };

  return (
    <>
      <EstudosHeader onAddEstudo={handleAddEstudo} />
      
      <Tabs value={mainTab} onValueChange={setMainTab} className="w-full mb-6">
        <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center border-b mb-4 pb-2">
          <TabsList className="mb-4 md:mb-0">
            <TabsTrigger value="importar" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              <span>Importar & Processar</span>
            </TabsTrigger>
            <TabsTrigger value="gerenciar" className="flex items-center gap-2">
              <ListCheck className="w-4 h-4" />
              <span>Gerenciar Estudos</span>
            </TabsTrigger>
          </TabsList>

          {mainTab === "gerenciar" && (
            <div className="flex items-center gap-2">
              <EstudoSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />
            </div>
          )}
        </div>
        
        <TabsContent value="importar" className="mt-0 space-y-6">
          <div className="flex items-center space-x-2 mb-2">
            <ArrowDown className="h-4 w-4 text-blue-600" />
            <h3 className="text-lg font-medium">Importar Estudos</h3>
          </div>
          <SciImportSection />
          
          <div className="flex items-center space-x-2 mb-2 mt-8">
            <ArrowDown className="h-4 w-4 text-purple-600" />
            <h3 className="text-lg font-medium">Análise NTAI</h3>
            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
              Processamento Avançado
            </span>
          </div>
          <NtaiProcessingSection />
        </TabsContent>
        
        <TabsContent value="gerenciar" className="mt-0 space-y-6">
          <div className="flex flex-col space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <EstudosColumn
                title="Novos Estudos"
                icon="new"
                estudos={novoEstudos}
                onViewEstudo={handleViewEstudo}
                onAddEstudo={handleAddEstudo}
                buttonLabel="Iniciar Curadoria"
                getNutraceuticalScore={getNutraceuticalScore}
              />
              
              <EstudosColumn
                title="Em Curadoria"
                icon="review"
                estudos={emRevEstudos}
                onViewEstudo={handleViewEstudo}
                getNutraceuticalScore={getNutraceuticalScore}
              />
              
              <EstudosColumn
                title="Aprovados"
                icon="approved"
                estudos={aprovadosEstudos}
                onViewEstudo={handleViewEstudo}
                getNutraceuticalScore={getNutraceuticalScore}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

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
