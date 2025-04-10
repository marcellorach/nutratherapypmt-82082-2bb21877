
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Send, CheckCircle, AlertTriangle, MailOpen } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ActionsStep: React.FC = () => {
  const { toast } = useToast();
  const [selectedCount, setSelectedCount] = useState<number>(0);
  const [total, setTotal] = useState<number>(843);
  const [sending, setSending] = useState<boolean>(false);
  const [sendProgress, setSendProgress] = useState<number>(0);
  const [segmentStats, setSegmentStats] = useState({
    highPriority: 312,
    mediumPriority: 421,
    lowPriority: 110
  });
  
  const handleSelectAll = (checked: boolean) => {
    setSelectedCount(checked ? total : 0);
  };
  
  const handleSelectSegment = (segment: 'high' | 'medium' | 'low') => {
    if (segment === 'high') {
      setSelectedCount(segmentStats.highPriority);
    } else if (segment === 'medium') {
      setSelectedCount(segmentStats.mediumPriority);
    } else {
      setSelectedCount(segmentStats.lowPriority);
    }
  };
  
  const simulateSendToVets = () => {
    setSending(true);
    setSendProgress(0);
    
    const interval = setInterval(() => {
      setSendProgress(prev => {
        const newProgress = prev + Math.random() * 15;
        
        if (newProgress >= 100) {
          clearInterval(interval);
          setSending(false);
          toast({
            title: "Envio concluído",
            description: `${selectedCount} recomendações enviadas para análise dos veterinários.`,
            duration: 5000,
          });
          return 100;
        }
        
        return newProgress;
      });
    }, 500);
  };
  
  const simulateSendToOwners = () => {
    setSending(true);
    setSendProgress(0);
    
    const interval = setInterval(() => {
      setSendProgress(prev => {
        const newProgress = prev + Math.random() * 10;
        
        if (newProgress >= 100) {
          clearInterval(interval);
          setSending(false);
          toast({
            title: "Envio concluído",
            description: `${selectedCount} ofertas enviadas para os tutores.`,
            duration: 5000,
          });
          return 100;
        }
        
        return newProgress;
      });
    }, 500);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Ações em Massa</h2>
          <p className="text-gray-600">Enviar recomendações e ofertas para revisão</p>
        </div>
        <div>
          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
            {total} Recomendações Disponíveis
          </Badge>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Users className="mr-2 h-5 w-5 text-blue-600" />
              Selecionar Destinatários
            </span>
            <Badge variant="outline" className="ml-2">
              {selectedCount} de {total} selecionados
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Checkbox id="select-all" onCheckedChange={handleSelectAll} />
              <label htmlFor="select-all" className="font-medium cursor-pointer">
                Selecionar Todos ({total})
              </label>
            </div>
            
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-md border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="high-priority" onCheckedChange={() => handleSelectSegment('high')} />
                    <label htmlFor="high-priority" className="font-medium cursor-pointer">Alta Prioridade</label>
                  </div>
                  <Badge className="bg-red-100 text-red-800">{segmentStats.highPriority}</Badge>
                </div>
                <p className="text-xs text-gray-600">
                  Pets com condições críticas que necessitam intervenção imediata
                </p>
              </div>
              
              <div className="rounded-md border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="medium-priority" onCheckedChange={() => handleSelectSegment('medium')} />
                    <label htmlFor="medium-priority" className="font-medium cursor-pointer">Média Prioridade</label>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">{segmentStats.mediumPriority}</Badge>
                </div>
                <p className="text-xs text-gray-600">
                  Pets com condições que necessitam atenção, mas não são críticas
                </p>
              </div>
              
              <div className="rounded-md border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="low-priority" onCheckedChange={() => handleSelectSegment('low')} />
                    <label htmlFor="low-priority" className="font-medium cursor-pointer">Baixa Prioridade</label>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">{segmentStats.lowPriority}</Badge>
                </div>
                <p className="text-xs text-gray-600">
                  Pets com recomendações preventivas ou de manutenção da saúde
                </p>
              </div>
            </div>
            
            {selectedCount > 0 && (
              <div className="pt-2">
                {sending && (
                  <div className="mb-4 space-y-2">
                    <Progress value={sendProgress} className="h-2 w-full" />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Enviando...</span>
                      <span>{Math.round(sendProgress)}%</span>
                    </div>
                  </div>
                )}
                
                <Tabs defaultValue="veterinarians" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="veterinarians">Para Veterinários</TabsTrigger>
                    <TabsTrigger value="owners">Para Tutores</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="veterinarians" className="space-y-4 pt-4">
                    <div className="rounded-md bg-blue-50 p-4 border border-blue-200">
                      <div className="flex mb-2 items-center">
                        <AlertTriangle className="h-5 w-5 text-blue-600 mr-2" />
                        <h4 className="font-medium text-blue-800">
                          Enviar para revisão dos veterinários
                        </h4>
                      </div>
                      <p className="text-sm text-blue-600">
                        {selectedCount} recomendações serão enviadas para análise e aprovação dos veterinários responsáveis pelos pets.
                      </p>
                    </div>
                    
                    <Button 
                      className="w-full" 
                      disabled={selectedCount === 0 || sending}
                      onClick={simulateSendToVets}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Enviar para Veterinários ({selectedCount})
                    </Button>
                  </TabsContent>
                  
                  <TabsContent value="owners" className="space-y-4 pt-4">
                    <div className="rounded-md bg-green-50 p-4 border border-green-200">
                      <div className="flex mb-2 items-center">
                        <MailOpen className="h-5 w-5 text-green-600 mr-2" />
                        <h4 className="font-medium text-green-800">
                          Enviar ofertas para tutores
                        </h4>
                      </div>
                      <p className="text-sm text-green-600">
                        {selectedCount} ofertas de assinatura serão enviadas para os tutores dos pets selecionados.
                      </p>
                    </div>
                    
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700" 
                      disabled={selectedCount === 0 || sending}
                      onClick={simulateSendToOwners}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Enviar Ofertas para Tutores ({selectedCount})
                    </Button>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
            Resumo das Ações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-md bg-white p-4 border border-gray-200">
              <h4 className="text-lg font-medium mb-2">427</h4>
              <p className="text-sm text-gray-600">
                Revisões enviadas para veterinários nos últimos 30 dias
              </p>
            </div>
            
            <div className="rounded-md bg-white p-4 border border-gray-200">
              <h4 className="text-lg font-medium mb-2">348</h4>
              <p className="text-sm text-gray-600">
                Aprovações recebidas de veterinários
              </p>
            </div>
            
            <div className="rounded-md bg-white p-4 border border-gray-200">
              <h4 className="text-lg font-medium mb-2">237</h4>
              <p className="text-sm text-gray-600">
                Novas assinaturas geradas a partir das ofertas
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActionsStep;
