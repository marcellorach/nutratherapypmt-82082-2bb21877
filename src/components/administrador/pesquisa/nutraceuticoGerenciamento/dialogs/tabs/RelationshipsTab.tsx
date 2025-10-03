
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Link as LinkIcon } from 'lucide-react';
import { NutraceuticalRelationsService } from '@/services/nutraceuticals/relations-service';
import { useTranslation } from 'react-i18next';

interface RelationshipsTabProps {
  nutraceutical: any;
  onOpenRelationshipsDialog: () => void;
  onFinish: () => void;
}

const RelationshipsTab: React.FC<RelationshipsTabProps> = ({
  nutraceutical,
  onOpenRelationshipsDialog,
  onFinish
}) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [relations, setRelations] = useState<any>({
    studies: [],
    conditions: []
  });
  
  // Carregar relações existentes
  useEffect(() => {
    const fetchRelations = async () => {
      if (nutraceutical?.id) {
        setIsLoading(true);
        try {
          // Carregar relações com estudos
          const studyRelations = await NutraceuticalRelationsService.getStudyRelations(nutraceutical.id);
          
          // Carregar relações com condições
          const conditionRelations = await NutraceuticalRelationsService.getConditionRelations(nutraceutical.id);
          
          setRelations({
            studies: studyRelations || [],
            conditions: conditionRelations || []
          });
        } catch (error) {
          console.error('Erro ao carregar relações:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    fetchRelations();
  }, [nutraceutical?.id]);
  
  // Função para formatar a relevância como estrelas
  const renderRelevanceStars = (score: number) => {
    const stars = [];
    const fullStars = Math.floor(score);
    const hasHalfStar = score % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={`full-${i}`}>★</span>);
    }
    
    if (hasHalfStar) {
      stars.push(<span key="half">☆</span>);
    }
    
    const remainingStars = 5 - stars.length;
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<span key={`empty-${i}`} className="opacity-30">☆</span>);
    }
    
    return <div className="text-amber-500">{stars}</div>;
  };
  
  return (
    <div className="space-y-6 py-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">{t('nutraceuticals.relationships.title')}</h3>
        <Button onClick={onOpenRelationshipsDialog}>
          {t('nutraceuticals.relationships.manageButton')}
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Estudos associados */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" /> 
              {t('nutraceuticals.relationships.studies')}
              {relations.studies.length > 0 && (
                <Badge variant="outline">{relations.studies.length}</Badge>
              )}
            </h4>
            
            {relations.studies.length === 0 ? (
              <p className="text-sm text-gray-500">
                {t('nutraceuticals.relationships.noStudies')}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {relations.studies.map((relation: any) => (
                  <Card key={relation.id} className="overflow-hidden">
                    <CardContent className="p-3">
                      <div className="text-sm font-medium mb-1 line-clamp-2">
                        {relation.study?.title || t('nutraceuticals.relationships.studyNoTitle')}
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        {relation.study?.journal || t('nutraceuticals.relationships.studyNoJournal')}
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-xs">
                          {t('nutraceuticals.relationships.relevance')}: {relation.relevance_score?.toFixed(1) || '0.0'}
                        </div>
                        <div>
                          {renderRelevanceStars(relation.relevance_score || 0)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          
          {/* Condições associadas */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <LinkIcon className="h-4 w-4" /> 
              {t('nutraceuticals.relationships.conditions')}
              {relations.conditions.length > 0 && (
                <Badge variant="outline">{relations.conditions.length}</Badge>
              )}
            </h4>
            
            {relations.conditions.length === 0 ? (
              <p className="text-sm text-gray-500">
                {t('nutraceuticals.relationships.noConditions')}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {relations.conditions.map((relation: any) => (
                  <Card key={relation.id} className="overflow-hidden">
                    <CardContent className="p-3">
                      <div className="text-sm font-medium mb-1">
                        {relation.condition?.name || t('nutraceuticals.relationships.conditionNoName')}
                      </div>
                      <div className="text-xs text-gray-500 mb-2 line-clamp-2">
                        {relation.condition?.description || t('nutraceuticals.relationships.conditionNoDescription')}
                      </div>
                      <div className="flex justify-between items-center">
                        <Badge variant="outline">
                          {relation.relationship_type === 'prevention' ? t('nutraceuticals.relationships.typePrevention') : 
                           relation.relationship_type === 'treatment' ? t('nutraceuticals.relationships.typeTreatment') : t('nutraceuticals.relationships.typeSupport')}
                        </Badge>
                        <div>
                          {renderRelevanceStars(relation.efficacy_score || 0)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button onClick={onFinish}>
          {t('nutraceuticals.relationships.finish')}
        </Button>
      </div>
    </div>
  );
};

export default RelationshipsTab;
