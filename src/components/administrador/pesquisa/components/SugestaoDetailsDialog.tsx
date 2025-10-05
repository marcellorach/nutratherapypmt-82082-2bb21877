
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
import { useTranslation } from 'react-i18next';
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
import RecursosNecessariosSection from './RecursosNecessariosSection';

interface SugestaoDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sugestao: Sugestao | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onAdvanceApproval: (id: string) => void;
}

import { getLocalizedSugestao } from '../utils/localizationHelper';

const SugestaoDetailsDialog: React.FC<SugestaoDetailsDialogProps> = ({
  open,
  onOpenChange,
  sugestao,
  onApprove,
  onReject,
  onAdvanceApproval
}) => {
  const { t, i18n } = useTranslation();
  
  if (!sugestao) return null;
  
  const localizedSugestao = getLocalizedSugestao(sugestao, i18n.language);

  // Ícone e texto baseado na origem da sugestão
  const getOrigemInfo = () => {
    switch (sugestao.origem) {
      case 'ia':
        return {
          icon: <Lightbulb className="h-5 w-5 text-amber-500" />,
          text: t('studyProposals.origin.ai')
        };
      case 'comite_cientifico':
        return {
          icon: <Users className="h-5 w-5 text-indigo-500" />,
          text: t('studyProposals.origin.scientificCommittee')
        };
      case 'externa':
        return {
          icon: <User className="h-5 w-5 text-emerald-500" />,
          text: t('studyProposals.origin.external')
        };
      default:
        return {
          icon: <Lightbulb className="h-5 w-5 text-gray-500" />,
          text: t('studyProposals.origin.unknown')
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
            {localizedSugestao.titulo}
          </DialogTitle>
          <DialogDescription className="flex items-center">
            {t('studyProposals.card.confidence')}: <span className="font-medium ml-1">{sugestao.confianca}%</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-1">{t('studyProposals.dialog.aiReasoning')}</h4>
            <p className="text-sm text-muted-foreground bg-slate-50 p-3 rounded-md border">{localizedSugestao.raciocinio}</p>
          </div>
          
          {/* Cadeia de aprovação */}
          <ApprovalChain approvalChain={sugestao.approvalChain} />
          
          {/* Conteúdo principal com tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">{t('studyProposals.dialog.tabs.overview')}</TabsTrigger>
              <TabsTrigger value="evidence">{t('studyProposals.dialog.tabs.evidence')}</TabsTrigger>
              <TabsTrigger value="recursos">{t('studyProposals.dialog.tabs.resources')}</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-1">{t('studyProposals.dialog.overview.basedOn')}</h4>
                <ul className="text-sm text-muted-foreground list-disc ml-5">
                  {localizedSugestao.baseado_em.map((base, index) => (
                    <li key={index}>{base}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">{t('studyProposals.dialog.overview.methodology')}</h4>
                <p className="text-sm text-muted-foreground">{localizedSugestao.metodologia}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">{t('studyProposals.dialog.overview.markers')}</h4>
                <ul className="text-sm text-muted-foreground list-disc ml-5">
                  {localizedSugestao.marcadores_sugeridos.map((marcador, index) => (
                    <li key={index}>{marcador}</li>
                  ))}
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="evidence" className="space-y-4">
              {localizedSugestao.dados_amostra ? (
                <EvidenceChartsSection dados_amostra={localizedSugestao.dados_amostra} />
              ) : (
                <div className="bg-muted p-4 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">
                    {t('studyProposals.dialog.evidence.noData')}
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="recursos" className="space-y-4">
              {localizedSugestao.recursos_necessarios ? (
                <RecursosNecessariosSection recursos={localizedSugestao.recursos_necessarios} />
              ) : (
                <div className="bg-muted p-4 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">
                    {t('studyProposals.dialog.resources.noResourcesDefined')}
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
                {t('studyProposals.card.reject')}
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                  onApprove(sugestao.id);
                  onOpenChange(false);
                }}
              >
                <ThumbsUp className="mr-1 h-4 w-4" />
                {t('studyProposals.dialog.startApproval')}
              </Button>
            </div>
          )}
          
          {sugestao.status === 'em_analise' && (
            <Button 
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => onAdvanceApproval(sugestao.id)}
            >
              <ChevronRight className="mr-1 h-4 w-4" />
              {t('studyProposals.dialog.advanceToNext')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SugestaoDetailsDialog;
