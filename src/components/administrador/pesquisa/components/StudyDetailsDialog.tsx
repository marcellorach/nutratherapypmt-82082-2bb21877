
import React from 'react';
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Study } from '../types/oraBiomedical';
import DetailedStudyCharts from './DetailedStudyCharts';
import { Card, CardContent, CardDescription } from "@/components/ui/card";

interface StudyDetailsDialogProps {
  study: Study;
}

const StudyDetailsDialog: React.FC<StudyDetailsDialogProps> = ({ study }) => {
  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{study.title}</DialogTitle>
      </DialogHeader>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="charts">Resultados</TabsTrigger>
          <TabsTrigger value="hypotheses">Hipóteses</TabsTrigger>
          <TabsTrigger value="previous">Estudos Anteriores</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Descrição</h3>
                  <p className="text-muted-foreground">{study.description}</p>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Detalhes do Estudo</h3>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="font-medium">Status:</span>
                        <span>{study.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Início:</span>
                        <span>{study.startDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Término:</span>
                        <span>{study.endDate || 'Em andamento'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Prioridade:</span>
                        <span>{study.priority}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Métricas</h3>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="font-medium">Progresso:</span>
                        <span>{study.progress}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Compostos:</span>
                        <span>{study.compounds}</span>
                      </div>
                      {study.positiveResults && (
                        <div className="flex justify-between">
                          <span className="font-medium">Resultados Positivos:</span>
                          <span>{study.positiveResults}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="charts" className="space-y-6 mt-4">
          <DetailedStudyCharts isComplete={study.status === 'completed'} />
        </TabsContent>

        <TabsContent value="hypotheses" className="space-y-4 mt-4">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Hipóteses de Pesquisa</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Hipótese Principal</h4>
                  <p className="text-muted-foreground">
                    A administração do composto X resultará em uma redução significativa na taxa de mortalidade por estresse oxidativo em C. elegans.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Hipóteses Secundárias</h4>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>O composto X atua diretamente nas vias de sinalização relacionadas ao estresse oxidativo</li>
                    <li>A eficácia do tratamento é dose-dependente</li>
                    <li>O tratamento não apresenta efeitos colaterais significativos na longevidade geral</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="previous" className="space-y-4 mt-4">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Estudos Anteriores Relacionados</h3>
              <div className="space-y-6">
                <div className="border-b pb-4">
                  <h4 className="font-medium mb-2">Estudo 2022-A</h4>
                  <p className="text-muted-foreground mb-2">
                    Identificação inicial dos mecanismos de ação do composto X em modelos celulares.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Resultados: Redução de 45% nos marcadores de estresse oxidativo
                  </p>
                </div>
                <div className="border-b pb-4">
                  <h4 className="font-medium mb-2">Estudo 2023-B</h4>
                  <p className="text-muted-foreground mb-2">
                    Análise preliminar da toxicidade e dosagem ótima em C. elegans.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Resultados: Estabelecimento da faixa terapêutica segura
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DialogContent>
  );
};

export default StudyDetailsDialog;
