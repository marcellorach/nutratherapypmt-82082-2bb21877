
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { 
  Lightbulb,
  ThumbsUp, 
  ThumbsDown,
  ChevronRight
} from "lucide-react";
import { Sugestao } from '../types/sugestoes';
import ApprovalChain from './ApprovalChain';

interface SugestaoDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sugestao: Sugestao | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onAdvanceApproval: (id: string) => void;
}

const SugestaoDetailsDialog: React.FC<SugestaoDetailsDialogProps> = ({
  open,
  onOpenChange,
  sugestao,
  onApprove,
  onReject,
  onAdvanceApproval
}) => {
  if (!sugestao) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Lightbulb className="mr-2 h-5 w-5 text-amber-500" />
            {sugestao.titulo}
          </DialogTitle>
          <DialogDescription className="flex items-center">
            Confiança da IA: <span className="font-medium ml-1">{sugestao.confianca}%</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-1">Raciocínio da IA</h4>
            <p className="text-sm text-muted-foreground">{sugestao.raciocinio}</p>
          </div>
          
          {/* Cadeia de aprovação */}
          <ApprovalChain approvalChain={sugestao.approvalChain} />
          
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="baseado">
              <AccordionTrigger>Baseado em</AccordionTrigger>
              <AccordionContent>
                <ul className="text-sm text-muted-foreground list-disc ml-5">
                  {sugestao.baseado_em.map((base, index) => (
                    <li key={index}>{base}</li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="metodologia">
              <AccordionTrigger>Metodologia Sugerida</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">{sugestao.metodologia}</p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="marcadores">
              <AccordionTrigger>Marcadores Sugeridos</AccordionTrigger>
              <AccordionContent>
                <ul className="text-sm text-muted-foreground list-disc ml-5">
                  {sugestao.marcadores_sugeridos.map((marcador, index) => (
                    <li key={index}>{marcador}</li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        
        <DialogFooter>
          {sugestao.status === 'nova' && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => {
                  onReject(sugestao.id);
                  onOpenChange(false);
                }}
              >
                <ThumbsDown className="mr-1 h-4 w-4" />
                Rejeitar
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                  onApprove(sugestao.id);
                  onOpenChange(false);
                }}
              >
                <ThumbsUp className="mr-1 h-4 w-4" />
                Iniciar aprovação
              </Button>
            </div>
          )}
          
          {sugestao.status === 'em_analise' && (
            <Button 
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => onAdvanceApproval(sugestao.id)}
            >
              <ChevronRight className="mr-1 h-4 w-4" />
              Avançar para próxima etapa
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SugestaoDetailsDialog;
