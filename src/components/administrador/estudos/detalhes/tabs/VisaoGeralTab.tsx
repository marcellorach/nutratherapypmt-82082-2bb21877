
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ScoreSummaryCard from '../../../tags/ScoreSummaryCard';
import { Target, Lightbulb, AlertTriangle, FlaskConical } from "lucide-react";
import { useTranslation } from 'react-i18next';

interface VisaoGeralTabProps {
  estudo: any;
  studyScores: {
    qualityScore: number;
    relevanceScore: number;
    noveltyScore: number;
  };
}

const VisaoGeralTab: React.FC<VisaoGeralTabProps> = ({ estudo, studyScores }) => {
  const { t } = useTranslation();
  const analysisData = estudo.analysis_data || {};
  const studySummary = analysisData.study_summary || {};
  const studyAssessment = analysisData.study_assessment || {};

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">{t('visaoGeralTab.description')}</h3>
                <p className="text-muted-foreground">{estudo.description || studySummary.objective || t('visaoGeralTab.noDescription')}</p>
              </div>
              
              {studySummary.key_findings && studySummary.key_findings.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    {t('visaoGeralTab.keyFindings')}
                  </h4>
                  <ul className="space-y-1">
                    {studySummary.key_findings.map((finding: string, idx: number) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary">•</span>
                        {finding}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {studySummary.clinical_implications && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-green-500" />
                    {t('visaoGeralTab.clinicalImplications')}
                  </h4>
                  <p className="text-sm text-muted-foreground">{studySummary.clinical_implications}</p>
                </div>
              )}
              
              {studySummary.limitations && studySummary.limitations.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    {t('visaoGeralTab.limitations')}
                  </h4>
                  <ul className="space-y-1">
                    {studySummary.limitations.map((limitation: string, idx: number) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-orange-500">•</span>
                        {limitation}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {(studyAssessment.methodology_type || studyAssessment.sample_size) && (
          <Card>
            <CardContent className="pt-6">
              <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
                <FlaskConical className="h-4 w-4" />
                {t('visaoGeralTab.methodologicalAssessment')}
              </h4>
              <div className="flex flex-wrap gap-2">
                {studyAssessment.methodology_type && (
                  <Badge variant="outline">{studyAssessment.methodology_type}</Badge>
                )}
                {studyAssessment.sample_size && (
                  <Badge variant="outline">n={studyAssessment.sample_size}</Badge>
                )}
                {studyAssessment.randomization && (
                  <Badge variant="secondary">{t('visaoGeralTab.randomized')}</Badge>
                )}
                {studyAssessment.placebo_controlled && (
                  <Badge variant="secondary">{t('visaoGeralTab.placeboControlled')}</Badge>
                )}
                {studyAssessment.blinding && studyAssessment.blinding !== 'none' && (
                  <Badge variant="secondary">{studyAssessment.blinding.replace('_', ' ')}</Badge>
                )}
                {studyAssessment.statistical_significance && (
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20">p&lt;0.05</Badge>
                )}
                {studyAssessment.follow_up_duration && (
                  <Badge variant="outline">{studyAssessment.follow_up_duration}</Badge>
                )}
                {studyAssessment.species_tested?.map((species: string, idx: number) => (
                  <Badge key={idx} variant="outline" className="capitalize">{species}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <ScoreSummaryCard 
            score={studyScores.qualityScore}
            title={t('visaoGeralTab.methodologicalQuality')}
            description={t('visaoGeralTab.methodologicalQualityDesc')}
          />
          <ScoreSummaryCard 
            score={studyScores.relevanceScore}
            title={t('visaoGeralTab.clinicalRelevance')}
            description={t('visaoGeralTab.clinicalRelevanceDesc')}
          />
          <ScoreSummaryCard 
            score={studyScores.noveltyScore}
            title={t('visaoGeralTab.scientificNovelty')}
            description={t('visaoGeralTab.scientificNoveltyDesc')}
          />
        </div>
      </div>
    </div>
  );
};

export default VisaoGeralTab;
