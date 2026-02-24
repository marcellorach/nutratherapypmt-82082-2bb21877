import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Loader, Plus, Trash } from 'lucide-react';
import { useConditions } from '@/hooks/nutraceuticals/useConditions';
import { useStudies } from '@/hooks/nutraceuticals/useStudies';
import { useToast } from '@/hooks/use-toast';
import { nutraceuticalsService } from '@/services/nutraceuticals';
import { useTranslation } from 'react-i18next';

interface RelationsTabProps {
  nutraceutical: any;
  onUpdate?: () => void;
}

const RelationsTab: React.FC<RelationsTabProps> = ({ nutraceutical, onUpdate }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [healthConditions, setHealthConditions] = useState<any[]>([]);
  const [relatedStudies, setRelatedStudies] = useState<any[]>([]);
  const [conditionsLoading, setConditionsLoading] = useState(false);
  const [studiesLoading, setStudiesLoading] = useState(false);

  const [selectedCondition, setSelectedCondition] = useState('');
  const [relationshipType, setRelationshipType] = useState<'prevention' | 'treatment' | 'support'>('prevention');
  const [efficacyScore, setEfficacyScore] = useState<number[]>([3]);
  const [notes, setNotes] = useState('');

  const [selectedStudy, setSelectedStudy] = useState('');
  const [relevanceScore, setRelevanceScore] = useState<number[]>([3]);

  const { conditions } = useConditions();
  const { studies } = useStudies();

  useEffect(() => {
    if (nutraceutical?.id) {
      loadConditionRelations();
      loadStudyRelations();
    }
  }, [nutraceutical?.id]);

  const loadConditionRelations = async () => {
    if (!nutraceutical?.id) return;
    try {
      setConditionsLoading(true);
      setHealthConditions([]);
    } catch (error) {
      console.error('Error loading condition relations:', error);
      toast({ title: t('relationsTab.toasts.errorTitle'), description: t('relationsTab.toasts.loadConditionsError'), variant: "destructive" });
    } finally {
      setConditionsLoading(false);
    }
  };

  const loadStudyRelations = async () => {
    if (!nutraceutical?.id) return;
    try {
      setStudiesLoading(true);
      setRelatedStudies([]);
    } catch (error) {
      console.error('Error loading study relations:', error);
      toast({ title: t('relationsTab.toasts.errorTitle'), description: t('relationsTab.toasts.loadStudiesError'), variant: "destructive" });
    } finally {
      setStudiesLoading(false);
    }
  };

  const handleAddConditionRelation = async () => {
    if (!selectedCondition) {
      toast({ title: t('relationsTab.toasts.errorTitle'), description: t('relationsTab.toasts.selectConditionError'), variant: "destructive" });
      return;
    }
    try {
      setConditionsLoading(true);
      await nutraceuticalsService.addConditionRelation({
        nutraceutical_id: nutraceutical.id, condition_id: selectedCondition,
        relationship_type: relationshipType, efficacy_score: efficacyScore[0], notes
      });
      toast({ title: t('relationsTab.toasts.successTitle'), description: t('relationsTab.toasts.conditionAdded') });
      setSelectedCondition(''); setNotes(''); setEfficacyScore([3]);
      loadConditionRelations(); onUpdate?.();
    } catch (error) {
      console.error('Error adding relation:', error);
      toast({ title: t('relationsTab.toasts.errorTitle'), description: t('relationsTab.toasts.addRelationError'), variant: "destructive" });
    } finally { setConditionsLoading(false); }
  };

  const handleRemoveConditionRelation = async (relationId: string) => {
    try {
      setConditionsLoading(true);
      toast({ title: t('relationsTab.toasts.successTitle'), description: t('relationsTab.toasts.relationRemoved') });
      loadConditionRelations(); onUpdate?.();
    } catch (error) {
      console.error('Error removing relation:', error);
      toast({ title: t('relationsTab.toasts.errorTitle'), description: t('relationsTab.toasts.removeRelationError'), variant: "destructive" });
    } finally { setConditionsLoading(false); }
  };

  const handleAddStudyRelation = async () => {
    if (!selectedStudy) {
      toast({ title: t('relationsTab.toasts.errorTitle'), description: t('relationsTab.toasts.selectStudyError'), variant: "destructive" });
      return;
    }
    try {
      setStudiesLoading(true);
      await nutraceuticalsService.addStudyRelation({
        nutraceutical_id: nutraceutical.id, study_id: selectedStudy, relevance_score: relevanceScore[0]
      });
      toast({ title: t('relationsTab.toasts.successTitle'), description: t('relationsTab.toasts.studyAdded') });
      setSelectedStudy(''); setRelevanceScore([3]);
      loadStudyRelations(); onUpdate?.();
    } catch (error) {
      console.error('Error adding relation:', error);
      toast({ title: t('relationsTab.toasts.errorTitle'), description: t('relationsTab.toasts.addRelationError'), variant: "destructive" });
    } finally { setStudiesLoading(false); }
  };

  const handleRemoveStudyRelation = async (relationId: string) => {
    try {
      setStudiesLoading(true);
      toast({ title: t('relationsTab.toasts.successTitle'), description: t('relationsTab.toasts.relationRemoved') });
      loadStudyRelations(); onUpdate?.();
    } catch (error) {
      console.error('Error removing relation:', error);
      toast({ title: t('relationsTab.toasts.errorTitle'), description: t('relationsTab.toasts.studyRemoveError'), variant: "destructive" });
    } finally { setStudiesLoading(false); }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="conditions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="conditions">{t('relationsTab.tabs.conditions')}</TabsTrigger>
          <TabsTrigger value="studies">{t('relationsTab.tabs.studies')}</TabsTrigger>
        </TabsList>

        <TabsContent value="conditions" className="space-y-4">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-4">{t('relationsTab.addConditionRelation')}</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">{t('relationsTab.healthCondition')}</label>
                <Select value={selectedCondition} onValueChange={setSelectedCondition}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('relationsTab.selectCondition')} />
                  </SelectTrigger>
                  <SelectContent>
                    {conditions?.map((condition: any) => (
                      <SelectItem key={condition.id} value={condition.id}>{condition.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">{t('relationsTab.relationType')}</label>
                <Select value={relationshipType} onValueChange={(value: any) => setRelationshipType(value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prevention">{t('relationsTab.prevention')}</SelectItem>
                    <SelectItem value="treatment">{t('relationsTab.treatment')}</SelectItem>
                    <SelectItem value="support">{t('relationsTab.support')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium">{t('relationsTab.efficacyScore', { score: efficacyScore[0] })}</label>
              <Slider value={efficacyScore} onValueChange={setEfficacyScore} max={5} min={1} step={1} className="mt-2" />
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium">{t('relationsTab.notes')}</label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('relationsTab.notesPlaceholder')} className="mt-1" />
            </div>

            <Button onClick={handleAddConditionRelation} disabled={conditionsLoading || !selectedCondition} className="mt-4">
              {conditionsLoading ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              {t('relationsTab.addRelation')}
            </Button>
          </div>

          <div>
            <h4 className="font-medium mb-2">{t('relationsTab.existingRelations')}</h4>
            {conditionsLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader className="w-4 h-4 animate-spin mr-2" />
                {t('relationsTab.loading')}
              </div>
            ) : (
              <div className="space-y-2">
                {healthConditions.length === 0 ? (
                  <p className="text-muted-foreground text-sm">{t('relationsTab.noRelations')}</p>
                ) : (
                  healthConditions.map((relation: any) => (
                    <div key={relation.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <span className="font-medium">{relation.condition?.name}</span>
                        <Badge variant="secondary" className="ml-2">{relation.relationship_type}</Badge>
                        <span className="text-sm text-muted-foreground ml-2">
                          {t('relationsTab.efficacy', { score: relation.efficacy_score })}
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveConditionRelation(relation.id)}>
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="studies" className="space-y-4">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-4">{t('relationsTab.addStudyRelation')}</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">{t('relationsTab.scientificStudy')}</label>
                <Select value={selectedStudy} onValueChange={setSelectedStudy}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('relationsTab.selectStudy')} />
                  </SelectTrigger>
                  <SelectContent>
                    {studies?.map((study: any) => (
                      <SelectItem key={study.id} value={study.id}>{study.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">{t('relationsTab.relevanceScore', { score: relevanceScore[0] })}</label>
                <Slider value={relevanceScore} onValueChange={setRelevanceScore} max={5} min={1} step={1} className="mt-2" />
              </div>
            </div>

            <Button onClick={handleAddStudyRelation} disabled={studiesLoading || !selectedStudy} className="mt-4">
              {studiesLoading ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              {t('relationsTab.addRelation')}
            </Button>
          </div>

          <div>
            <h4 className="font-medium mb-2">{t('relationsTab.relatedStudies')}</h4>
            {studiesLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader className="w-4 h-4 animate-spin mr-2" />
                {t('relationsTab.loading')}
              </div>
            ) : (
              <div className="space-y-2">
                {relatedStudies.length === 0 ? (
                  <p className="text-muted-foreground text-sm">{t('relationsTab.noStudies')}</p>
                ) : (
                  relatedStudies.map((relation: any) => (
                    <div key={relation.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <span className="font-medium">{relation.study?.title}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          {t('relationsTab.relevance', { score: relation.relevance_score })}
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveStudyRelation(relation.id)}>
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RelationsTab;
