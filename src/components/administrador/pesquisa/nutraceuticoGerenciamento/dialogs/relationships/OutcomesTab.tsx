
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NutraceuticalRelationsService } from '@/services/nutraceuticals/relations';
import { useTranslation } from 'react-i18next';

interface OutcomesTabProps {
  nutraceutical: any;
  conditions: any[];
  isLoading: boolean;
  onSuccess?: () => void;
}

const OutcomesTab: React.FC<OutcomesTabProps> = ({
  nutraceutical,
  conditions,
  isLoading,
  onSuccess
}) => {
  const { t } = useTranslation();
  const [selectedConditionId, setSelectedConditionId] = useState<string>('');
  const [efficacyScore, setEfficacyScore] = useState<number>(3);
  const [notes, setNotes] = useState<string>('');
  const [relationshipType, setRelationshipType] = useState<'prevention' | 'treatment' | 'support'>('prevention');
  const [existingRelations, setExistingRelations] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoadingRelations, setIsLoadingRelations] = useState<boolean>(true);
  
  const { toast } = useToast();
  
  useEffect(() => {
    if (nutraceutical?.id) {
      loadExistingRelations();
    }
  }, [nutraceutical]);
  
  const loadExistingRelations = async () => {
    setIsLoadingRelations(true);
    try {
      const relations = await NutraceuticalRelationsService.getConditionRelations(nutraceutical.id);
      setExistingRelations(relations || []);
    } catch (error) {
      console.error('Error loading existing relations:', error);
      toast({
        title: t('outcomesTab.toasts.error'),
        description: t('outcomesTab.toasts.loadError'),
        variant: 'destructive'
      });
    } finally {
      setIsLoadingRelations(false);
    }
  };
  
  const handleAddRelation = async () => {
    if (!selectedConditionId) {
      toast({
        title: t('outcomesTab.toasts.error'),
        description: t('outcomesTab.toasts.errorSelectOutcome'),
        variant: 'destructive'
      });
      return;
    }
    
    const existingRelation = existingRelations.find(rel => rel.condition_id === selectedConditionId);
    if (existingRelation) {
      toast({
        title: t('outcomesTab.toasts.warning'),
        description: t('outcomesTab.toasts.alreadyRelated'),
        variant: 'default'
      });
      return;
    }
    
    setIsSaving(true);
    try {
      await NutraceuticalRelationsService.relateToCondition(
        nutraceutical.id,
        selectedConditionId,
        relationshipType,
        efficacyScore,
        notes
      );
      
      toast({
        title: t('outcomesTab.toasts.success'),
        description: t('outcomesTab.toasts.addSuccess'),
      });
      
      setSelectedConditionId('');
      setEfficacyScore(3);
      setNotes('');
      setRelationshipType('prevention');
      
      await loadExistingRelations();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error adding relation:', error);
      toast({
        title: t('outcomesTab.toasts.error'),
        description: t('outcomesTab.toasts.addError'),
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleRemoveRelation = async (relationId: string) => {
    setIsSaving(true);
    try {
      await NutraceuticalRelationsService.removeConditionRelation(relationId);
      
      toast({
        title: t('outcomesTab.toasts.success'),
        description: t('outcomesTab.toasts.removeSuccess'),
      });
      
      await loadExistingRelations();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error removing relation:', error);
      toast({
        title: t('outcomesTab.toasts.error'),
        description: t('outcomesTab.toasts.removeError'),
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const getConditionName = (conditionId: string) => {
    const condition = conditions.find(c => c.id === conditionId);
    return condition?.name || t('outcomesTab.unknownOutcome');
  };
  
  const renderRelationshipTypeBadge = (type: string) => {
    switch(type) {
      case 'prevention':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">{t('outcomesTab.prevention')}</Badge>;
      case 'treatment':
        return <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">{t('outcomesTab.treatment')}</Badge>;
      case 'support':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">{t('outcomesTab.support')}</Badge>;
      default:
        return <Badge variant="outline">{t('outcomesTab.unknown')}</Badge>;
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">{t('outcomesTab.associateTitle')}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="conditionSelect">{t('outcomesTab.outcomeLabel')}</Label>
              <Select
                value={selectedConditionId}
                onValueChange={setSelectedConditionId}
                disabled={isLoading || isSaving}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('outcomesTab.selectOutcome')} />
                </SelectTrigger>
                <SelectContent>
                  {conditions && conditions.map((condition) => (
                    <SelectItem key={condition.id} value={condition.id}>
                      {condition.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="relationshipType">{t('outcomesTab.relationshipType')}</Label>
              <Select
                value={relationshipType}
                onValueChange={(value) => setRelationshipType(value as 'prevention' | 'treatment' | 'support')}
                disabled={isLoading || isSaving}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('outcomesTab.selectRelationType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prevention">{t('outcomesTab.prevention')}</SelectItem>
                  <SelectItem value="treatment">{t('outcomesTab.treatment')}</SelectItem>
                  <SelectItem value="support">{t('outcomesTab.support')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label>{t('outcomesTab.efficacyLevel', { score: efficacyScore })}</Label>
              <Slider
                value={[efficacyScore]}
                min={1}
                max={5}
                step={1}
                onValueChange={(value) => setEfficacyScore(value[0])}
                disabled={isLoading || isSaving}
                className="py-4"
              />
            </div>
            
            <div>
              <Label htmlFor="notes">{t('outcomesTab.notes')}</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('outcomesTab.notesPlaceholder')}
                disabled={isLoading || isSaving}
              />
            </div>
          </div>
        </div>
        
        <Button 
          onClick={handleAddRelation}
          disabled={!selectedConditionId || isLoading || isSaving}
          className="mt-4"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('outcomesTab.saving')}
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              {t('outcomesTab.addOutcome')}
            </>
          )}
        </Button>
      </div>
      
      <div>
        <h3 className="text-lg font-medium mb-4">{t('outcomesTab.relatedOutcomes')}</h3>
        
        {isLoadingRelations ? (
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : existingRelations.length === 0 ? (
          <div className="text-center p-6 text-muted-foreground border rounded-md">
            {t('outcomesTab.noOutcomes')}
          </div>
        ) : (
          <div className="space-y-3">
            {existingRelations.map((relation) => (
              <Card key={relation.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h4 className="font-medium">
                        {relation.condition?.name || getConditionName(relation.condition_id)}
                      </h4>
                      <div className="flex items-center space-x-2">
                        {renderRelationshipTypeBadge(relation.relationship_type)}
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                          {t('outcomesTab.efficacyScore', { score: relation.efficacy_score })}
                        </Badge>
                      </div>
                      {relation.notes && (
                        <p className="text-sm text-muted-foreground">{relation.notes}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveRelation(relation.id)}
                      disabled={isSaving}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OutcomesTab;
