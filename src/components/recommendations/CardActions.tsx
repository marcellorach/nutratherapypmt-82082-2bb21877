
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Recommendation, Nutraceutical } from '@/types';
import { Check, Search, FileText, MessageSquare, PieChart, CheckCircle2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { examResults } from '@/data';
import ResponsiveDialog from './dialog-wrappers/ResponsiveDialog';
import AIChat from './dialogs/AIChat';
import ExamViewer from './dialogs/ExamViewer';
import DetailViewer from './dialogs/DetailViewer';
import ComparisonViewer from './dialogs/ComparisonViewer';

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
  const [showExams, setShowExams] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const { toast } = useToast();

  const petExams = examResults.filter(exam => exam.petId === recommendation.petId);
  
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
      
      {/* Botão para Verificar Indicação */}
      <Button 
        variant="outline" 
        className="flex items-center gap-1 border border-amber-400 bg-amber-50 text-amber-800 hover:bg-amber-100" 
        onClick={() => setShowDetails(true)}
      >
        <Search size={16} />
        Verificar indicação
      </Button>
      
      {/* Botão para Ver Exames */}
      <Button 
        variant="outline" 
        className="flex items-center gap-1 border border-blue-400 bg-blue-50 text-blue-800 hover:bg-blue-100" 
        onClick={() => setShowExams(true)}
      >
        <FileText size={16} />
        Exames ({petExams.length})
      </Button>
      
      {/* Botão para Conversar com IA */}
      <Button 
        className="col-span-2 flex items-center justify-center gap-1 border border-purple-400 bg-purple-50 text-purple-800 h-12 hover:bg-purple-100" 
        onClick={() => setShowAI(true)}
      >
        <MessageSquare size={18} />
        Conversar com AI
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
        <DetailViewer 
          recommendation={recommendation} 
          nutraceutical={nutraceutical}
          isApproved={isApproved}
          onApprove={onApprove}
        />
      </ResponsiveDialog>

      <ResponsiveDialog
        open={showExams}
        onOpenChange={setShowExams}
        title="Exames do paciente"
        description="Histórico de exames relacionados à condição"
      >
        <ExamViewer 
          petExams={petExams} 
          petId={recommendation.petId}
        />
      </ResponsiveDialog>

      <ResponsiveDialog
        open={showAI}
        onOpenChange={setShowAI}
        title="Assistente de IA"
        description="Pergunte sobre esta recomendação"
      >
        <AIChat 
          nutraceuticalName={nutraceutical.name} 
          nutraceuticalCondition={nutraceutical.condition}
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
