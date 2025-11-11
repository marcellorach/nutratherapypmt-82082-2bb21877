import React from 'react';
import { useTranslation } from 'react-i18next';
import { Database, GitCompare, FileSearch } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

const AnalysisResult: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Card className="mt-6 bg-green-50">
      <CardHeader>
        <CardTitle className="flex items-center text-green-700">
          <CheckCircle className="mr-2 h-5 w-5" />
          {t('multiAgentAnalysis.result.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-gray-700">
            {t('multiAgentAnalysis.result.description')}
          </p>
          
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-md border border-gray-200 bg-white p-4">
              <h4 className="font-medium mb-2 flex items-center">
                <Database className="h-4 w-4 mr-2 text-emerald-600" />
                {t('multiAgentAnalysis.result.dataProcessing.title')}
              </h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• 2.341 {t('multiAgentAnalysis.result.dataProcessing.petsProcessed')}</li>
                <li>• 1.876 {t('multiAgentAnalysis.result.dataProcessing.examsAnalyzed')}</li>
                <li>• 42 {t('multiAgentAnalysis.result.dataProcessing.breedsCategorized')}</li>
                <li>• 28 {t('multiAgentAnalysis.result.dataProcessing.conditionsIdentified')}</li>
              </ul>
            </div>
            
            <div className="rounded-md border border-gray-200 bg-white p-4">
              <h4 className="font-medium mb-2 flex items-center">
                <GitCompare className="h-4 w-4 mr-2 text-purple-600" />
                {t('multiAgentAnalysis.result.analysisCorrelations.title')}
              </h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• 12 {t('multiAgentAnalysis.result.analysisCorrelations.healthPatternsIdentified')}</li>
                <li>• 37% {t('multiAgentAnalysis.result.analysisCorrelations.nutritionalGaps')}</li>
                <li>• 142 {t('multiAgentAnalysis.result.analysisCorrelations.treatmentsEvaluated')}</li>
                <li>• 86 {t('multiAgentAnalysis.result.analysisCorrelations.significantCorrelations')}</li>
              </ul>
            </div>
            
            <div className="rounded-md border border-gray-200 bg-white p-4">
              <h4 className="font-medium mb-2 flex items-center">
                <FileSearch className="h-4 w-4 mr-2 text-rose-600" />
                {t('multiAgentAnalysis.result.recommendations.title')}
              </h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• 843 {t('multiAgentAnalysis.result.recommendations.generated')}</li>
                <li>• 76% {t('multiAgentAnalysis.result.recommendations.confidenceRate')}</li>
                <li>• 92% {t('multiAgentAnalysis.result.recommendations.scientificEvidence')}</li>
                <li>• 23 {t('multiAgentAnalysis.result.recommendations.recurrentNutraceuticals')}</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6">
            <h4 className="font-medium mb-2">{t('multiAgentAnalysis.result.nextSteps.title')}</h4>
            <div className="grid grid-cols-2 gap-4">
              <Button className="w-full">
                {t('multiAgentAnalysis.result.nextSteps.viewDetailed')}
              </Button>
              <Button className="w-full">
                {t('multiAgentAnalysis.result.nextSteps.sendToVet')}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalysisResult;
