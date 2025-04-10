
import React, { useState } from 'react';
import RecommendationCard from '@/components/recommendations/RecommendationCard';
import { Pet } from '@/types';
import { treatmentPlans, nutraceuticals } from '@/data';
import { Button } from '@/components/ui/button';
import { PlusCircle, FilePlus, Save } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface RecommendationsListProps {
  selectedPet: Pet | null;
}

const RecommendationsList: React.FC<RecommendationsListProps> = ({ selectedPet }) => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  // Se não houver pet selecionado, mostrar mensagem
  if (!selectedPet) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhum pet selecionado</h3>
        <p className="text-gray-500 mb-6">Selecione um pet na aba "Pets" para ver suas recomendações.</p>
      </div>
    );
  }
  
  // Encontrar plano de tratamento para o pet selecionado
  const petPlan = treatmentPlans.find(plan => plan.petId === selectedPet.id);
  
  // Se não houver plano, mostrar opção para criar
  if (!petPlan) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
        <h3 className="text-xl font-semibold text-gray-700 mb-2">{selectedPet.name} não possui recomendações</h3>
        <p className="text-gray-500 mb-6">Crie um plano de tratamento para este pet.</p>
        <Button className="flex items-center gap-2">
          <PlusCircle size={16} />
          Criar novo plano de tratamento
        </Button>
      </div>
    );
  }
  
  const handleSaveAllChanges = () => {
    setIsSaving(true);
    
    // Simular salvamento com setTimeout
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "Plano atualizado",
        description: `Todas as alterações do plano de tratamento de ${selectedPet.name} foram salvas com sucesso.`,
        variant: "default",
      });
    }, 1200);
  };
  
  const handleGenerateReport = () => {
    toast({
      title: "Gerando relatório",
      description: "O relatório do plano de tratamento está sendo preparado e será enviado por email.",
      variant: "default",
    });
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold">Plano de Tratamento: {selectedPet.name}</h2>
          <p className="text-gray-500">Criado em: {petPlan.createdAt}</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={handleGenerateReport}
          >
            <FilePlus size={16} />
            Relatório
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center gap-2 border-green-500 text-green-700 hover:bg-green-50"
            onClick={handleSaveAllChanges}
            disabled={isSaving}
          >
            <Save size={16} />
            {isSaving ? "Salvando plano..." : "Salvar plano completo"}
          </Button>
          <Button className="flex items-center gap-2">
            <PlusCircle size={16} />
            Nova Recomendação
          </Button>
        </div>
      </div>
      
      {petPlan.notes && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6">
          <h3 className="font-medium text-amber-800 mb-1">Notas do Veterinário</h3>
          <p className="text-amber-700">{petPlan.notes}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {petPlan.recommendations.map(recommendation => {
          const nutraceutical = nutraceuticals.find(n => n.id === recommendation.nutraceuticalId)!;
          return (
            <RecommendationCard 
              key={recommendation.id}
              recommendation={recommendation}
              nutraceutical={nutraceutical}
            />
          );
        })}
      </div>
    </div>
  );
};

export default RecommendationsList;
