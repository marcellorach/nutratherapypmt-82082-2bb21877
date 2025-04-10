
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, FileText, Info, MessageSquare } from 'lucide-react';
import { Recommendation, Nutraceutical, ExamResult, Pet } from '@/types';
import { useToast } from "@/hooks/use-toast";
import EnhancedExamViewer from './EnhancedExamViewer';

interface IndicationDetailsViewerProps {
  recommendation: Recommendation;
  nutraceutical: Nutraceutical;
  isApproved: boolean;
  onApprove: () => void;
  petExams: ExamResult[];
  pet: Pet | null;
}

const IndicationDetailsViewer: React.FC<IndicationDetailsViewerProps> = ({ 
  recommendation, 
  nutraceutical, 
  isApproved, 
  onApprove,
  petExams,
  pet
}) => {
  const [examRequestSent, setExamRequestSent] = useState(false);
  const { toast } = useToast();

  const handleRequestExams = () => {
    setExamRequestSent(true);
    toast({
      title: "Exames solicitados",
      description: "As solicitações de exames foram enviadas para o tutor do pet.",
      variant: "default",
    });
  };

  return (
    <Tabs defaultValue="details" className="space-y-4">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="details">Informações Científicas</TabsTrigger>
        <TabsTrigger value="exams">
          <div className="flex items-center gap-1">
            <FileText size={16} />
            Exames & IA
            {petExams.length > 0 && (
              <Badge variant="default" className="ml-1 h-5 w-5 px-0 rounded-full">
                {petExams.length}
              </Badge>
            )}
          </div>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="details" className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Motivo da recomendação</h4>
          <p className="bg-slate-50 p-3 rounded-md">{recommendation.reason}</p>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Base científica</h4>
          <div className="bg-slate-50 p-3 rounded-md">
            <div className="flex gap-2 mb-2">
              <Badge variant="outline">Eficácia: {nutraceutical.scientificEvidence.efficacyScore}/5</Badge>
              <Badge variant="outline">Sustentação: {nutraceutical.scientificEvidence.sustainabilityScore}/5</Badge>
            </div>
            
            <div className="space-y-2">
              {nutraceutical.scientificEvidence.studies.map((study, i) => (
                <div key={i} className="text-sm">
                  <a href={study.link} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">
                    {study.title} ({study.year})
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Contraindicações</h4>
          <ul className="list-disc list-inside space-y-1 bg-slate-50 p-3 rounded-md">
            {nutraceutical.contraindications.map((c, i) => (
              <li key={i} className="text-sm">{c}</li>
            ))}
          </ul>
        </div>
        
        <div className="mt-4 flex justify-end gap-2">
          <Button 
            className={`flex items-center gap-1 border ${isApproved 
              ? "bg-green-600 hover:bg-green-700" 
              : "bg-green-100 text-green-800 hover:bg-green-200 border-green-300"}`}
            onClick={onApprove}
            disabled={isApproved}
          >
            {isApproved ? <CheckCircle2 size={16} /> : <Info size={16} />}
            {isApproved ? "Já aprovado" : "Aprovar recomendação"}
          </Button>
        </div>
      </TabsContent>
      
      <TabsContent value="exams">
        {petExams.length > 0 ? (
          <EnhancedExamViewer
            pet={pet}
            exams={petExams}
            recommendation={recommendation}
            nutraceutical={nutraceutical}
          />
        ) : (
          <div className="text-center py-8 bg-slate-50 rounded-md">
            <Info className="mx-auto text-amber-500 mb-2" size={24} />
            <p className="text-gray-700 mb-2">Este paciente não possui exames registrados.</p>
            <Button 
              className="mt-2"
              onClick={handleRequestExams}
              disabled={examRequestSent}
            >
              {examRequestSent ? "Exames solicitados" : "Solicitar exames"}
            </Button>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};

export default IndicationDetailsViewer;
