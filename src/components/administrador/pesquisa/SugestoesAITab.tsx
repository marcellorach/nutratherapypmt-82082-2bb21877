
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription
} from "@/components/ui/dialog";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Sparkles, ChevronRight, ThumbsUp, ThumbsDown, Lightbulb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock data para sugestões de pesquisa da IA
const mockSugestoes = [
  {
    id: "1",
    titulo: "Efeito do resveratrol em longevidade canina",
    confianca: 87,
    baseado_em: [
      "Estudos recentes em humanos e roedores",
      "Análise de metabolismo oxidativo em diversas raças caninas",
      "Tendências nos dados de expectativa de vida na plataforma"
    ],
    populacao_sugerida: "Cães de raças médias a grandes, idade 5-8 anos",
    metodologia: "Estudo longitudinal de 24 meses com duas dosagens (50mg/dia e 100mg/dia) vs placebo",
    marcadores_sugeridos: [
      "Estresse oxidativo (níveis de isoprostano)",
      "Função mitocondrial",
      "Marcadores inflamatórios (IL-6, TNF-alpha)"
    ],
    raciocinio: "A análise longitudinal dos dados de saúde canina na plataforma revelou correlação significativa entre marcadores de estresse oxidativo elevados e o desenvolvimento de condições relacionadas à idade em cães de médio e grande porte. Em estudos de pesquisa recente em roedores, o resveratrol demonstrou capacidade de modular mecanismos similares aos observados em processos de envelhecimento canino.",
    status: "nova"
  },
  {
    id: "2",
    titulo: "Colágeno tipo II não-desnaturado para displasia em cães jovens",
    confianca: 83,
    baseado_em: [
      "Meta-análise de resultados de colágeno em pacientes",
      "Dados longitudinais de cães com predisposição genética à displasia",
      "Estudos de biomarcadores de degradação cartilaginosa"
    ],
    populacao_sugerida: "Cães de 10-24 meses com predisposição genética a displasia",
    metodologia: "Estudo randomizado duplo-cego com 40mg/kg/dia vs placebo por 12 meses",
    marcadores_sugeridos: [
      "Biomarcadores de degradação de colágeno (CTX-II)",
      "Proteoglicanos urinários",
      "Avaliação radiográfica a cada 3 meses"
    ],
    raciocinio: "A análise de padrões nos dados clínicos da plataforma identificou que intervenções preventivas entre 10-24 meses de idade em raças predispostas à displasia demonstram maior eficácia que intervenções em fases tardias. O colágeno tipo II não-desnaturado tem demonstrado capacidade de modular respostas imunológicas associadas à degradação da cartilagem em estudos preliminares.",
    status: "aprovada"
  },
  {
    id: "3",
    titulo: "Prebióticos específicos para microbioma em cães geriátricos",
    confianca: 79,
    baseado_em: [
      "Análise de diversidade do microbioma em diferentes faixas etárias",
      "Correlação entre microbioma e marcadores inflamatórios",
      "Estudos recentes sobre eixo intestino-cérebro em cães idosos"
    ],
    populacao_sugerida: "Cães acima de 9 anos, diversas raças",
    metodologia: "Intervenção com fórmula personalizada de FOS, GOS e XOS por 6 meses",
    marcadores_sugeridos: [
      "Análise de diversidade microbioma por sequenciamento",
      "Marcadores inflamatórios séricos",
      "Indicadores cognitivos padronizados"
    ],
    raciocinio: "A análise dos perfis de microbioma na plataforma demonstrou declínio progressivo da diversidade microbiana em cães acima de 9 anos, com correlação positiva com marcadores inflamatórios e alterações comportamentais. Estudos recentes sugerem que a modulação específica do microbioma com combinações prebióticas pode reverter parcialmente estas alterações.",
    status: "em_analise"
  }
];

// Componente para exibir uma sugestão de estudo
const SugestaoCard: React.FC<{
  sugestao: any;
  onApprove: () => void;
  onReject: () => void;
  onDetails: () => void;
}> = ({ sugestao, onApprove, onReject, onDetails }) => {
  const getStatusBadge = () => {
    switch (sugestao.status) {
      case 'nova':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Nova</Badge>;
      case 'aprovada':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Aprovada</Badge>;
      case 'rejeitada':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Rejeitada</Badge>;
      case 'em_analise':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">Em análise</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between">
          <CardTitle className="text-md">{sugestao.titulo}</CardTitle>
          {getStatusBadge()}
        </div>
        <CardDescription>
          Confiança da IA: <span className="font-medium">{sugestao.confianca}%</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div>
          <h4 className="text-sm font-medium">População Sugerida</h4>
          <p className="text-sm text-muted-foreground">{sugestao.populacao_sugerida}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium">Baseado em:</h4>
          <ul className="text-sm text-muted-foreground list-disc ml-5">
            {sugestao.baseado_em.slice(0, 2).map((base, index) => (
              <li key={index}>{base}</li>
            ))}
            {sugestao.baseado_em.length > 2 && (
              <li>+ {sugestao.baseado_em.length - 2} outras fontes</li>
            )}
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm" onClick={onDetails}>
          Ver detalhes
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
        {sugestao.status === 'nova' && (
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={onReject}
            >
              <ThumbsDown className="mr-1 h-4 w-4" />
              Rejeitar
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-green-500 hover:text-green-700 hover:bg-green-50"
              onClick={onApprove}
            >
              <ThumbsUp className="mr-1 h-4 w-4" />
              Aprovar
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

const SugestoesAITab: React.FC = () => {
  const [sugestoes, setSugestoes] = useState(mockSugestoes);
  const [sugestaoSelecionada, setSugestaoSelecionada] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const handleApprove = (id: string) => {
    setSugestoes(sugestoes.map(s => 
      s.id === id ? { ...s, status: 'aprovada' } : s
    ));
    toast({
      title: "Sugestão aprovada",
      description: "A sugestão foi enviada para planejamento de estudo.",
    });
  };
  
  const handleReject = (id: string) => {
    setSugestoes(sugestoes.map(s => 
      s.id === id ? { ...s, status: 'rejeitada' } : s
    ));
    toast({
      title: "Sugestão rejeitada",
      description: "A sugestão foi arquivada.",
    });
  };
  
  const handleViewDetails = (sugestao: any) => {
    setSugestaoSelecionada(sugestao);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Sugestões de Pesquisa da IA</h2>
          <p className="text-muted-foreground">
            Avalie estudos científicos sugeridos com base em análise de dados e evidências.
          </p>
        </div>
        <Button variant="outline" className="flex items-center">
          <Sparkles className="mr-2 h-4 w-4" />
          Solicitar novas sugestões
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sugestoes.map(sugestao => (
          <SugestaoCard 
            key={sugestao.id} 
            sugestao={sugestao}
            onApprove={() => handleApprove(sugestao.id)}
            onReject={() => handleReject(sugestao.id)}
            onDetails={() => handleViewDetails(sugestao)}
          />
        ))}
      </div>
      
      {sugestaoSelecionada && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Lightbulb className="mr-2 h-5 w-5 text-amber-500" />
                {sugestaoSelecionada.titulo}
              </DialogTitle>
              <DialogDescription className="flex items-center">
                Confiança da IA: <span className="font-medium ml-1">{sugestaoSelecionada.confianca}%</span>
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Raciocínio da IA</h4>
                <p className="text-sm text-muted-foreground">{sugestaoSelecionada.raciocinio}</p>
              </div>
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="baseado">
                  <AccordionTrigger>Baseado em</AccordionTrigger>
                  <AccordionContent>
                    <ul className="text-sm text-muted-foreground list-disc ml-5">
                      {sugestaoSelecionada.baseado_em.map((base, index) => (
                        <li key={index}>{base}</li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="metodologia">
                  <AccordionTrigger>Metodologia Sugerida</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground">{sugestaoSelecionada.metodologia}</p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="marcadores">
                  <AccordionTrigger>Marcadores Sugeridos</AccordionTrigger>
                  <AccordionContent>
                    <ul className="text-sm text-muted-foreground list-disc ml-5">
                      {sugestaoSelecionada.marcadores_sugeridos.map((marcador, index) => (
                        <li key={index}>{marcador}</li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
            
            {sugestaoSelecionada.status === 'nova' && (
              <div className="flex justify-end gap-2 mt-4">
                <Button 
                  variant="outline" 
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => {
                    handleReject(sugestaoSelecionada.id);
                    setDialogOpen(false);
                  }}
                >
                  <ThumbsDown className="mr-1 h-4 w-4" />
                  Rejeitar
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => {
                    handleApprove(sugestaoSelecionada.id);
                    setDialogOpen(false);
                  }}
                >
                  <ThumbsUp className="mr-1 h-4 w-4" />
                  Aprovar
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default SugestoesAITab;
