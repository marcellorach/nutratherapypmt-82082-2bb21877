
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Lightbulb,
  ThumbsUp, 
  ThumbsDown,
  ChevronRight,
  Users,
  User
} from "lucide-react";
import { Sugestao } from '../types/sugestoes';
import ApprovalChain from './ApprovalChain';
import { Badge } from "@/components/ui/badge";
import EvidenceChartsSection from './EvidenceChartsSection';

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

  // Ícone e texto baseado na origem da sugestão
  const getOrigemInfo = () => {
    switch (sugestao.origem) {
      case 'ia':
        return {
          icon: <Lightbulb className="h-5 w-5 text-amber-500" />,
          text: "Sugestão da IA"
        };
      case 'comite_cientifico':
        return {
          icon: <Users className="h-5 w-5 text-indigo-500" />,
          text: "Sugestão do Comitê Científico"
        };
      case 'externa':
        return {
          icon: <User className="h-5 w-5 text-emerald-500" />,
          text: "Sugestão Externa"
        };
      default:
        return {
          icon: <Lightbulb className="h-5 w-5 text-gray-500" />,
          text: "Origem desconhecida"
        };
    }
  };

  const origemInfo = getOrigemInfo();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            {origemInfo.icon}
            <Badge variant="outline">
              {origemInfo.text}
            </Badge>
          </div>
          <DialogTitle className="text-xl">
            {sugestao.titulo}
          </DialogTitle>
          <DialogDescription className="flex items-center">
            Confiança da IA: <span className="font-medium ml-1">{sugestao.confianca}%</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-1">Raciocínio da IA</h4>
            <p className="text-sm text-muted-foreground bg-slate-50 p-3 rounded-md border">{sugestao.raciocinio}</p>
          </div>
          
          {/* Cadeia de aprovação */}
          <ApprovalChain approvalChain={sugestao.approvalChain} />
          
          {/* Conteúdo principal com tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="evidence">Evidências</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Baseado em</h4>
                <ul className="text-sm text-muted-foreground list-disc ml-5">
                  {sugestao.baseado_em.map((base, index) => (
                    <li key={index}>{base}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Metodologia Sugerida</h4>
                <p className="text-sm text-muted-foreground">{sugestao.metodologia}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Marcadores Sugeridos</h4>
                <ul className="text-sm text-muted-foreground list-disc ml-5">
                  {sugestao.marcadores_sugeridos.map((marcador, index) => (
                    <li key={index}>{marcador}</li>
                  ))}
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="evidence" className="space-y-4">
              {sugestao.dados_amostra ? (
                <EvidenceChartsSection dados_amostra={sugestao.dados_amostra} />
              ) : (
                <div className="bg-muted p-4 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">
                    Dados de evidência não disponíveis para esta sugestão.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
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
