
import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AgeDistributionChart from './AgeDistributionChart';
import BreedDistribution from './BreedDistribution';
import HealthConditionsSankey from './HealthConditionsSankey';

// Dados detalhados de idade, ano a ano
const detailedAgeData = [
  { name: '< 1', value: 328, percent: 12.4 },
  { name: '1', value: 421, percent: 15.9 },
  { name: '2', value: 387, percent: 14.6 },
  { name: '3', value: 352, percent: 13.3 },
  { name: '4', value: 289, percent: 10.9 },
  { name: '5', value: 235, percent: 8.9 },
  { name: '6', value: 187, percent: 7.1 },
  { name: '7', value: 142, percent: 5.4 },
  { name: '8', value: 98, percent: 3.7 },
  { name: '9', value: 76, percent: 2.9 },
  { name: '10', value: 52, percent: 2.0 },
  { name: '11', value: 38, percent: 1.4 },
  { name: '12', value: 26, percent: 1.0 },
  { name: '13', value: 18, percent: 0.7 },
  { name: '14', value: 12, percent: 0.5 },
  { name: '15', value: 9, percent: 0.3 },
  { name: '16', value: 5, percent: 0.2 },
  { name: '17', value: 3, percent: 0.1 },
  { name: '18', value: 1, percent: 0.04 },
  { name: '19+', value: 1, percent: 0.04 }
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd'];
const HOVER_COLORS = ['#4dabff', '#4ad9bf', '#ffca5b', '#ff9f71', '#a6a3e2', '#4a9fe5', '#ffab5e', '#6dbe6d', '#e45a5a', '#b595cf'];

const OverviewTab: React.FC = () => {
  const { t } = useTranslation();
  const [isAbsoluteValues, setIsAbsoluteValues] = useState(true);
  const [selectedSpecies, setSelectedSpecies] = useState<string | null>(null);
  const [showBreedDistribution, setShowBreedDistribution] = useState(false);
  
  // Dados de espécies e raças
  const speciesData = [
    { name: t('visualization.overview.species.dogs'), value: 1560, percent: 66.7 },
    { name: t('visualization.overview.species.cats'), value: 730, percent: 31.2 },
    { name: t('visualization.overview.species.others'), value: 51, percent: 2.1 }
  ];

  const breedData: Record<string, any[]> = {
    [t('visualization.overview.species.dogs')]: [
      { name: t('visualization.overview.breeds.srd'), value: 645, percent: 41.3 },
      { name: t('visualization.overview.breeds.goldenRetriever'), value: 187, percent: 12.0 },
      { name: t('visualization.overview.breeds.frenchBulldog'), value: 156, percent: 10.0 },
      { name: t('visualization.overview.breeds.shihTzu'), value: 124, percent: 7.9 },
      { name: t('visualization.overview.breeds.poodle'), value: 98, percent: 6.3 },
      { name: t('visualization.overview.breeds.labrador'), value: 93, percent: 6.0 },
      { name: t('visualization.overview.breeds.germanShepherd'), value: 78, percent: 5.0 },
      { name: t('visualization.overview.breeds.yorkshire'), value: 65, percent: 4.2 },
      { name: t('visualization.overview.breeds.others'), value: 114, percent: 7.3 }
    ],
    [t('visualization.overview.species.cats')]: [
      { name: t('visualization.overview.breeds.srd'), value: 543, percent: 74.4 },
      { name: t('visualization.overview.breeds.siamese'), value: 58, percent: 7.9 },
      { name: t('visualization.overview.breeds.persian'), value: 43, percent: 5.9 },
      { name: t('visualization.overview.breeds.maineCoon'), value: 36, percent: 4.9 },
      { name: t('visualization.overview.breeds.ragdoll'), value: 23, percent: 3.2 },
      { name: t('visualization.overview.breeds.bengal'), value: 15, percent: 2.1 },
      { name: t('visualization.overview.breeds.others'), value: 12, percent: 1.6 }
    ],
    [t('visualization.overview.species.others')]: [
      { name: t('visualization.overview.breeds.rabbits'), value: 28, percent: 54.9 },
      { name: t('visualization.overview.breeds.hamsters'), value: 12, percent: 23.5 },
      { name: t('visualization.overview.breeds.birds'), value: 8, percent: 15.7 },
      { name: t('visualization.overview.breeds.others'), value: 3, percent: 5.9 }
    ]
  };
  
  // Toggle para valores absolutos/percentuais
  const toggleValueType = () => {
    setIsAbsoluteValues(!isAbsoluteValues);
  };
  
  // Função para lidar com o clique em uma espécie no gráfico de pizza
  const handlePieClick = (data: any) => {
    setSelectedSpecies(data.name);
    setShowBreedDistribution(true);
  };
  
  // Função para retornar à visão de espécies
  const handleBackToSpecies = () => {
    setSelectedSpecies(null);
    setShowBreedDistribution(false);
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('visualization.overview.ageDistribution.title')}</CardTitle>
          <Button variant="outline" size="sm" onClick={toggleValueType}>
            {isAbsoluteValues 
              ? t('visualization.overview.ageDistribution.showPercentages')
              : t('visualization.overview.ageDistribution.showAbsolute')
            }
          </Button>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <AgeDistributionChart data={detailedAgeData} isAbsoluteValues={isAbsoluteValues} />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>
            {showBreedDistribution 
              ? t('visualization.overview.breedDistribution.titleBreed', { species: selectedSpecies })
              : t('visualization.overview.breedDistribution.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            {showBreedDistribution ? (
              <BreedDistribution 
                data={selectedSpecies ? breedData[selectedSpecies] : []} 
                onBackClick={handleBackToSpecies}
                colors={COLORS}
                hoverColors={HOVER_COLORS}
              />
            ) : (
              <BreedDistribution 
                data={speciesData}
                colors={COLORS}
                hoverColors={HOVER_COLORS}
                onPieClick={handlePieClick}
                showPieDetails={true}
                onBackClick={handleBackToSpecies}
              />
            )}
          </div>
          <div className="mt-4 text-sm text-gray-500 text-center">
            {showBreedDistribution ? (
              <p>{t('visualization.overview.breedDistribution.clickBreedOrBack')}{' '}
              <button 
                onClick={handleBackToSpecies}
                className="text-blue-500 underline"
              >{t('visualization.overview.breedDistribution.backToSpecies')}</button></p>
            ) : (
              <p>{t('visualization.overview.breedDistribution.clickToView')}</p>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>{t('visualization.overview.healthMapping.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <HealthConditionsSankey height={360} />
          </div>
          <div className="mt-2 text-xs text-center text-gray-500">
            {t('visualization.overview.healthMapping.description')}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OverviewTab;
