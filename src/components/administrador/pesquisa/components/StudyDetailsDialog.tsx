import React from 'react';
import { useTranslation } from 'react-i18next';
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Study } from '../types/oraBiomedical';
import DetailedStudyCharts from './DetailedStudyCharts';
import PublicationStatus from './PublicationStatus';
import { Card, CardContent } from "@/components/ui/card";

interface StudyDetailsDialogProps {
  study: Study;
}

const StudyDetailsDialog: React.FC<StudyDetailsDialogProps> = ({ study }) => {
  const { t } = useTranslation();

  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{study.title}</DialogTitle>
      </DialogHeader>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className={`w-full grid ${study.status === 'completed' ? 'grid-cols-5' : 'grid-cols-4'} mb-4`}>
          <TabsTrigger value="overview">{t('admin.studies.details.overview')}</TabsTrigger>
          <TabsTrigger value="charts">{t('admin.studies.details.results')}</TabsTrigger>
          <TabsTrigger value="hypotheses">{t('admin.studies.details.hypotheses')}</TabsTrigger>
          <TabsTrigger value="previous">{t('admin.studies.details.previousStudies')}</TabsTrigger>
          {study.status === 'completed' && (
            <TabsTrigger value="publications">{t('admin.studies.details.publications')}</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{t('admin.studies.details.description')}</h3>
                  <p className="text-muted-foreground">{study.description}</p>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">{t('admin.studies.details.studyDetails')}</h3>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="font-medium">{t('admin.studies.details.status')}</span>
                        <span>{study.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">{t('admin.studies.details.start')}</span>
                        <span>{study.startDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">{t('admin.studies.details.end')}</span>
                        <span>{study.endDate || t('admin.studies.details.ongoing')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">{t('admin.studies.details.priority')}</span>
                        <span>{study.priority}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">{t('admin.studies.details.metrics')}</h3>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="font-medium">{t('admin.studies.details.progress')}</span>
                        <span>{study.progress}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">{t('admin.studies.details.compounds')}</span>
                        <span>{study.compounds}</span>
                      </div>
                       {study.positiveResults && (
                         <div className="flex justify-between">
                           <span className="font-medium">{t('admin.studies.details.positiveResults')}</span>
                           <span>{study.positiveResults}</span>
                         </div>
                       )}
                       {study.studyPopulation && (
                         <div className="flex justify-between">
                           <span className="font-medium">{t('admin.studies.details.population')}</span>
                           <span>{study.studyPopulation} {t('admin.studies.completedStudies.organisms')}</span>
                         </div>
                       )}
                       {study.duration && (
                         <div className="flex justify-between">
                           <span className="font-medium">{t('admin.studies.details.duration')}</span>
                           <span>{study.duration}</span>
                         </div>
                       )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="charts" className="space-y-6">
          {study.status === 'completed' && study.quantitativeResults && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">{t('admin.studies.details.quantitativeResults')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">{t('admin.studies.details.lifeExtension')}</span>
                    <span className="ml-2 text-lg font-bold text-green-600">
                      {study.quantitativeResults.lifeExtension}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">{t('admin.studies.details.pValue')}</span>
                    <span className="ml-2 font-mono">{study.quantitativeResults.pValue}</span>
                  </div>
                  <div>
                    <span className="font-medium">{t('admin.studies.details.statisticalPower')}</span>
                    <span className="ml-2">{study.quantitativeResults.statisticalPower}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">{t('admin.studies.details.effect')}</span>
                    <p className="mt-1 text-muted-foreground">{study.quantitativeResults.effect}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          <DetailedStudyCharts 
            isComplete={study.status === 'completed'} 
            interventionData={study.interventionData}
          />
        </TabsContent>

        <TabsContent value="hypotheses" className="space-y-4">
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
                    <li>O momento de início da intervenção (precoce vs. meia-vida) afeta significativamente a eficácia</li>
                    <li>A manutenção da saúde (≥30%) é mais prolongada nos grupos de intervenção</li>
                    <li>A resistência ao estressor externo aplicado no dia 15 é aumentada nos grupos de intervenção</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="previous" className="space-y-4">
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
                <div className="pb-4">
                  <h4 className="font-medium mb-2">Metanálise 2023-C</h4>
                  <p className="text-muted-foreground mb-2">
                    Comparação dos efeitos de intervenções precoces versus intervenções tardias em modelos de nematódeos.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Resultados: Intervenções precoces demonstraram 20-35% maior eficácia na prevenção de declínio relacionado à idade
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {study.status === 'completed' && (
          <TabsContent value="publications">
            <PublicationStatus publications={study.publications || []} />
          </TabsContent>
        )}
      </Tabs>
    </DialogContent>
  );
};

export default StudyDetailsDialog;
