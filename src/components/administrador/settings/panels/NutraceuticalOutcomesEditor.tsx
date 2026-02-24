
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { useOutcomes } from "@/hooks/nutraceuticals/useOutcomes";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from 'react-i18next';

interface NutraceuticalOutcome {
  id: string;
  relationship_type: string;
  efficacy_score: number;
  notes?: string;
  outcome: { id: string; name: string; };
}

interface NutraceuticalOutcomesEditorProps {
  nutraceutical: {
    id: string;
    name: string;
    nutraceutical_outcomes?: NutraceuticalOutcome[];
  };
  onComplete: () => void;
}

const NutraceuticalOutcomesEditor: React.FC<NutraceuticalOutcomesEditorProps> = ({ nutraceutical, onComplete }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { outcomes, isLoading: outcomesLoading, fetchOutcomes } = useOutcomes();
  
  useEffect(() => { fetchOutcomes(); }, [fetchOutcomes]);
  
  const [selectedOutcomeId, setSelectedOutcomeId] = useState("");
  const [selectedRelationType, setSelectedRelationType] = useState("prevention");
  const [efficacyScore, setEfficacyScore] = useState(3);
  const [notes, setNotes] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [existingRelations, setExistingRelations] = useState<NutraceuticalOutcome[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  
  useEffect(() => {
    setExistingRelations(nutraceutical.nutraceutical_outcomes || []);
  }, [nutraceutical]);
  
  const availableOutcomes = outcomes?.filter(outcome => 
    !existingRelations.some(relation => relation.outcome.id === outcome.id)
  ) || [];

  const relationshipTypes = [
    { id: 'prevention', label: t('outcomesEditor.prevention') },
    { id: 'treatment', label: t('outcomesEditor.treatment') },
    { id: 'support', label: t('outcomesEditor.support') },
  ];
  
  const handleAssociateOutcome = async () => {
    if (!selectedOutcomeId) {
      toast({ title: t('outcomesEditor.toasts.error'), description: t('outcomesEditor.toasts.selectOutcome'), variant: "destructive" });
      return;
    }
    setIsAdding(true);
    try {
      console.log('Associating outcome:', { nutraceutical: nutraceutical.id, outcome: selectedOutcomeId });
      const newOutcome = outcomes?.find(c => c.id === selectedOutcomeId);
      if (newOutcome) {
        setExistingRelations(prev => [...prev, {
          id: `temp-${Date.now()}`, relationship_type: selectedRelationType, efficacy_score: efficacyScore, notes,
          outcome: { id: newOutcome.id, name: newOutcome.name }
        }]);
      }
      setSelectedOutcomeId(""); setEfficacyScore(3); setNotes("");
      toast({ title: t('outcomesEditor.toasts.success'), description: t('outcomesEditor.toasts.outcomeAssociated') });
    } catch (error) {
      toast({ title: t('outcomesEditor.toasts.error'), description: t('outcomesEditor.toasts.associateError'), variant: "destructive" });
      console.error(error);
    } finally { setIsAdding(false); }
  };

  const handleRemoveAssociation = async (relationId: string) => {
    try {
      console.log('Removing relation:', relationId);
      setExistingRelations(prev => prev.filter(rel => rel.id !== relationId));
      toast({ title: t('outcomesEditor.toasts.success'), description: t('outcomesEditor.toasts.relationRemoved') });
    } catch (error) {
      toast({ title: t('outcomesEditor.toasts.error'), description: t('outcomesEditor.toasts.removeError'), variant: "destructive" });
      console.error(error);
    }
  };

  const getEfficiencyColor = (score: number) => {
    if (score >= 4) return "bg-green-100 text-green-800 border-green-200";
    if (score >= 2.5) return "bg-amber-100 text-amber-800 border-amber-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  const getRelationshipTypeLabel = (type: string) => {
    const relation = relationshipTypes.find(r => r.id === type);
    return relation ? relation.label : type;
  };

  const getFilteredRelations = () => {
    if (activeTab === "all") return existingRelations;
    return existingRelations.filter(rel => rel.relationship_type === activeTab);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-md border p-4 bg-muted/30">
        <h4 className="font-semibold mb-4">{t('outcomesEditor.addNewRelation')}</h4>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="outcome">{t('outcomesEditor.outcome')}</Label>
            <Select value={selectedOutcomeId} onValueChange={setSelectedOutcomeId} disabled={availableOutcomes.length === 0 || isAdding}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('outcomesEditor.selectOutcome')} />
              </SelectTrigger>
              <SelectContent>
                {availableOutcomes.length === 0 ? (
                  <SelectItem value="no_outcomes_available">{t('outcomesEditor.allOutcomesAssociated')}</SelectItem>
                ) : (
                  availableOutcomes.map((outcome) => (
                    <SelectItem key={outcome.id} value={outcome.id}>{outcome.name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="relationship">{t('outcomesEditor.relationType')}</Label>
            <Select value={selectedRelationType} onValueChange={setSelectedRelationType} disabled={isAdding}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {relationshipTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="md:col-span-2">
            <Label htmlFor="efficacy">{t('outcomesEditor.efficacy', { score: efficacyScore })}</Label>
            <Slider id="efficacy" min={1} max={5} step={0.5} value={[efficacyScore]} onValueChange={(v) => setEfficacyScore(v[0])} disabled={isAdding} className="py-4" />
          </div>
          
          <div className="md:col-span-2">
            <Label htmlFor="notes">{t('outcomesEditor.notesLabel')}</Label>
            <Textarea id="notes" placeholder={t('outcomesEditor.notesPlaceholder')} value={notes} onChange={(e) => setNotes(e.target.value)} disabled={isAdding} className="mt-1" />
          </div>
          
          <div className="md:col-span-2 flex justify-end">
            <Button onClick={handleAssociateOutcome} disabled={!selectedOutcomeId || isAdding}>{t('outcomesEditor.addRelation')}</Button>
          </div>
        </div>
      </div>
      
      <div>
        <h4 className="font-semibold mb-4">{t('outcomesEditor.existingRelations')}</h4>
        {outcomesLoading ? (
          <div className="space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
        ) : existingRelations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border rounded-md">{t('outcomesEditor.noRelations')}</div>
        ) : (
          <div className="space-y-4">
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">{t('outcomesEditor.all')}</TabsTrigger>
                <TabsTrigger value="prevention">{t('outcomesEditor.prevention')}</TabsTrigger>
                <TabsTrigger value="treatment">{t('outcomesEditor.treatment')}</TabsTrigger>
                <TabsTrigger value="support">{t('outcomesEditor.support')}</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="space-y-2">
              {getFilteredRelations().map((relation) => (
                <div key={relation.id} className="flex flex-col gap-2 p-3 border rounded-md">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{relation.outcome.name}</span>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveAssociation(relation.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">{getRelationshipTypeLabel(relation.relationship_type)}</Badge>
                    <Badge variant="outline" className={getEfficiencyColor(relation.efficacy_score)}>
                      {t('outcomesEditor.efficacyLabel', { score: relation.efficacy_score })}
                    </Badge>
                  </div>
                  {relation.notes && (
                    <div className="mt-1 text-sm text-muted-foreground border-t pt-2">
                      <p className="font-medium text-xs mb-1">{t('outcomesEditor.notes')}</p>
                      <p>{relation.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NutraceuticalOutcomesEditor;
