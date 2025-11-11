import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Pet, ConditionData } from '@/utils/mockClinicalData';

interface ConditionAnalysisCardsProps {
  pets: Pet[];
  conditions: ConditionData[];
}

const ConditionAnalysisCards: React.FC<ConditionAnalysisCardsProps> = ({ pets, conditions }) => {
  const { t, i18n } = useTranslation();
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const getConditionPets = (conditionId: string) => {
    return pets.filter(pet => pet.conditions.includes(conditionId));
  };

  const toggleCard = (conditionId: string) => {
    setExpandedCard(expandedCard === conditionId ? null : conditionId);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {conditions.map((condition) => {
        const conditionPets = getConditionPets(condition.id);
        const isExpanded = expandedCard === condition.id;
        const displayName = i18n.language === 'en' ? condition.name_en : condition.name;

        return (
          <Card key={condition.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">{displayName}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {conditionPets.length} {t('clinicalMonitoring.condition.cases')}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Response Rates */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center">
                    <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                    {t('clinicalMonitoring.status.significant')}
                  </span>
                  <span className="font-medium">{condition.responseRates.significant}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="flex items-center">
                    <span className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></span>
                    {t('clinicalMonitoring.status.mild')}
                  </span>
                  <span className="font-medium">{condition.responseRates.mild}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="flex items-center">
                    <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                    {t('clinicalMonitoring.status.none')}
                  </span>
                  <span className="font-medium">{condition.responseRates.none}%</span>
                </div>
              </div>

              {/* Expand Button */}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => toggleCard(condition.id)}
              >
                {isExpanded ? (
                  <>
                    {t('clinicalMonitoring.condition.showLess')} <ChevronUp className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    {t('clinicalMonitoring.condition.showMore')} <ChevronDown className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="space-y-3 pt-3 border-t">
                  {/* Top Breeds */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">
                      {t('clinicalMonitoring.condition.topBreeds')}
                    </h4>
                    {condition.breedDistribution.slice(0, 3).map((breed, idx) => (
                      <div key={idx} className="flex justify-between text-sm mb-1">
                        <span>{breed.breed}</span>
                        <span className="text-muted-foreground">{breed.percentage}%</span>
                      </div>
                    ))}
                  </div>

                  {/* Common Nutraceuticals */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">
                      {t('clinicalMonitoring.condition.commonNutraceuticals')}
                    </h4>
                    {condition.commonNutraceuticals.slice(0, 3).map((nut, idx) => (
                      <div key={idx} className="flex justify-between text-sm mb-1">
                        <span>{nut.name}</span>
                        <span className="text-muted-foreground">{nut.usage}%</span>
                      </div>
                    ))}
                  </div>

                  {/* Time to Improvement */}
                  <div className="text-sm">
                    <span className="font-semibold">
                      {t('clinicalMonitoring.condition.timeToImprovement')}:
                    </span>
                    <span className="ml-2 text-muted-foreground">
                      {condition.averageTimeToImprovement} {t('clinicalMonitoring.condition.weeks')}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ConditionAnalysisCards;
