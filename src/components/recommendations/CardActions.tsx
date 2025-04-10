
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Recommendation, Nutraceutical, Pet } from '@/types';
import { Check, Search, PieChart, CheckCircle2, FileText } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { examResults, pets } from '@/data';
import ResponsiveDialog from './dialog-wrappers/ResponsiveDialog';
import ComparisonViewer from './dialogs/ComparisonViewer';
import IndicationDetailsViewer from './dialogs/IndicationDetailsViewer';

interface ActiveIngredientType {
  name: string;
  quantity: string;
  removed?: boolean;
  efficacy: number;
}

interface CardActionsProps {
  recommendation: Recommendation;
  nutraceutical: Nutraceutical;
  ingredients: ActiveIngredientType[];
  onIngredientEfficacyChange: (index: number, value: number) => void;
  isApproved: boolean;
  onApprove: () => void;
}

const CardActions: React.FC<CardActionsProps> = ({ 
  recommendation, 
  nutraceutical,
  ingredients,
  onIngredientEfficacyChange,
  isApproved,
  onApprove
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const { toast } = useToast();

  // Buscar exames e pet relacionado
  const petExams = examResults.filter(exam => exam.petId === recommendation.petId);
  const pet = pets.find(p => p.id === recommendation.petId) || null;
  
  // Verificar se há exames disponíveis para mostrar indicador visual
  const hasExams = petExams.length > 0;
  
  return (
    <div className="grid grid-cols-2 gap-2 mt-3">
      {/* Botões de Aprovação */}
      <Button 
        className={`flex items-center gap-1 border ${isApproved 
          ? "bg-green-600 hover:bg-green-700 border-green-700" 
          : "border-green-400 bg-green-50 text-green-800 hover:bg-green-100"}`}
        onClick={onApprove}
        disabled={isApproved}
      >
        {isApproved ? <CheckCircle2 size={16} /> : <Check size={16} />}
        {isApproved ? "Aprovado" : "Aprovar"}
      </Button>
      
      {/* Botão para Verificar Indicação (agora integra exames e IA) */}
      <Button 
        variant="outline" 
        className="flex items-center justify-center gap-1 border border-amber-400 bg-amber-50 text-amber-800 hover:bg-amber-100" 
        onClick={() => setShowDetails(true)}
      >
        <FileText size={16} />
        {hasExams && (
          <span className="flex items-center">
            Verificar
            <span className="bg-amber-700 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center ml-1">
              {petExams.length}
            </span>
          </span>
        )}
        {!hasExams && "Verificar indicação"}
      </Button>
      
      {/* Botão para Comparar com População */}
      <Button 
        variant="outline" 
        className="col-span-2 flex items-center justify-center gap-1 border border-cyan-400 bg-cyan-50 text-cyan-800 h-9 text-sm hover:bg-cyan-100" 
        onClick={() => setShowCompare(true)}
      >
        <PieChart size={14} />
        Comparar com população
      </Button>

      {/* Diálogos/Modais */}
      <ResponsiveDialog
        open={showDetails}
        onOpenChange={setShowDetails}
        title="Detalhes da indicação"
        description={`${nutraceutical.name} para ${nutraceutical.condition}`}
      >
        <IndicationDetailsViewer
          recommendation={recommendation}
          nutraceutical={nutraceutical}
          isApproved={isApproved}
          onApprove={onApprove}
          petExams={petExams}
          pet={pet}
        />
      </ResponsiveDialog>

      <ResponsiveDialog
        open={showCompare}
        onOpenChange={setShowCompare}
        title="Comparação com população"
        description={`Dados comparativos para ${nutraceutical.name}`}
      >
        <ComparisonViewer 
          nutraceuticalName={nutraceutical.name}
          nutraceuticalCondition={nutraceutical.condition}
          baseEfficacyScore={nutraceutical.scientificEvidence.efficacyScore}
          ingredients={ingredients}
          onClose={() => setShowCompare(false)}
        />
      </ResponsiveDialog>
    </div>
  );
};

export default CardActions;
