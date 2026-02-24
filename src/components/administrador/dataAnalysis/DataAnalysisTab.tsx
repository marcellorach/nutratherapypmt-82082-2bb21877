import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Database, Download } from "lucide-react";
import NutraceuticalEfficacy from '@/components/charts/NutraceuticalEfficacy';
import { useTranslation } from 'react-i18next';

const DataAnalysisTab: React.FC = () => {
  const { t } = useTranslation();

  const efficacyData = [
    { name: 'Curcumina', score: 4.2, contraindications: 2 },
    { name: 'Resveratrol', score: 3.8, contraindications: 1 },
    { name: 'Alpha-AKG', score: 4.5, contraindications: 0 },
    { name: 'Coenzima Q10', score: 4.0, contraindications: 3 },
  ];

  const generateRandomData = () => {
    console.log('Gerando dados aleatórios para análise...');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">{t('dataAnalysisTab.title')}</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateRandomData}>
            <Database className="h-4 w-4 mr-2" />
            {t('dataAnalysisTab.generateRandom')}
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            {t('dataAnalysisTab.exportReport')}
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dataAnalysisTab.totalNutraceuticals')}</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">127</div>
              <p className="text-xs text-muted-foreground">{t('dataAnalysisTab.sinceLastMonth')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dataAnalysisTab.avgEfficacy')}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4.1/5</div>
              <p className="text-xs text-muted-foreground">{t('dataAnalysisTab.pointsThisMonth')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dataAnalysisTab.scientificStudies')}</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,243</div>
              <p className="text-xs text-muted-foreground">{t('dataAnalysisTab.newStudies')}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('dataAnalysisTab.efficacyByNutraceutical')}</CardTitle>
            <CardDescription>{t('dataAnalysisTab.efficacyComparative')}</CardDescription>
          </CardHeader>
          <CardContent>
            <NutraceuticalEfficacy data={efficacyData} />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('dataAnalysisTab.conditionsDistribution')}</CardTitle>
              <CardDescription>{t('dataAnalysisTab.conditionsDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">{t('dataAnalysisTab.arthritis')}</span>
                  <span className="text-sm font-medium">{t('dataAnalysisTab.nutraceuticalsCount', { count: 24 })}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">{t('dataAnalysisTab.cardiopathies')}</span>
                  <span className="text-sm font-medium">{t('dataAnalysisTab.nutraceuticalsCount', { count: 18 })}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">{t('dataAnalysisTab.diabetes')}</span>
                  <span className="text-sm font-medium">{t('dataAnalysisTab.nutraceuticalsCount', { count: 15 })}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('dataAnalysisTab.researchTrends')}</CardTitle>
              <CardDescription>{t('dataAnalysisTab.researchDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">{t('dataAnalysisTab.antiInflammatory')}</span>
                  <span className="text-sm font-medium text-green-600">+23%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">{t('dataAnalysisTab.neuroprotection')}</span>
                  <span className="text-sm font-medium text-green-600">+18%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">{t('dataAnalysisTab.longevity')}</span>
                  <span className="text-sm font-medium text-green-600">+15%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DataAnalysisTab;
