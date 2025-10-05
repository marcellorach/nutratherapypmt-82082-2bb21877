import React from 'react';
import { useTranslation } from 'react-i18next';
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Study } from '../types/oraBiomedical';
import DetailedStudyCharts from './DetailedStudyCharts';
import PublicationStatus from './PublicationStatus';
import { Card, CardContent } from "@/components/ui/card";
import { getLocalizedHypothesis, getLocalizedPreviousStudies } from '../utils/studyLocalizationHelper';

interface StudyDetailsDialogProps {
  study: Study;
}

const StudyDetailsDialog: React.FC<StudyDetailsDialogProps> = ({ study }) => {
  const { t, i18n } = useTranslation();
  const localizedHypotheses = getLocalizedHypothesis(study, i18n.language as 'pt' | 'en');
  const localizedPreviousStudies = getLocalizedPreviousStudies(study, i18n.language as 'pt' | 'en');

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
              <h3 className="text-lg font-semibold mb-4">{t('admin.studies.details.hypotheses')}</h3>
              {localizedHypotheses ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">{t('admin.studies.details.primaryHypothesis')}</h4>
                    <p className="text-muted-foreground">
                      {localizedHypotheses.primary}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">{t('admin.studies.details.secondaryHypotheses')}</h4>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                      {localizedHypotheses.secondary.map((hyp, idx) => (
                        <li key={idx}>{hyp}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">{t('admin.studies.publications.noPublications')}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="previous" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">{t('admin.studies.details.relatedPreviousStudies')}</h3>
              {localizedPreviousStudies && localizedPreviousStudies.length > 0 ? (
                <div className="space-y-6">
                  {localizedPreviousStudies.map((prevStudy, idx) => (
                    <div key={prevStudy.id} className={idx < localizedPreviousStudies.length - 1 ? "border-b pb-4" : "pb-4"}>
                      <h4 className="font-medium mb-2">{prevStudy.title}</h4>
                      <p className="text-muted-foreground mb-2">
                        {prevStudy.description}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t('admin.studies.details.results')} {prevStudy.results}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">{t('admin.studies.publications.noPublications')}</p>
              )}
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
