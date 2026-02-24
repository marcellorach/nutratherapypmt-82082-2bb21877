
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import StudiesDropZone from '../StudiesDropZone';
import { FormSectionsProps } from './types';
import { useTranslation } from 'react-i18next';

export const BasicInfoSection: React.FC<Pick<FormSectionsProps, 'formData' | 'handleFormChange'>> = ({
  formData,
  handleFormChange
}) => {
  const { t } = useTranslation();
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t('formSections.name')}</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleFormChange}
            placeholder={t('formSections.namePlaceholder')}
            autoComplete="off"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="dosage">{t('formSections.dosage')}</Label>
          <Input
            id="dosage"
            name="dosage"
            value={formData.dosage}
            onChange={handleFormChange}
            placeholder={t('formSections.dosagePlaceholder')}
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground">
            {t('formSections.dosageHelp')}
          </p>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="source">{t('formSections.source')}</Label>
        <Input
          id="source"
          name="source"
          value={formData.source}
          onChange={handleFormChange}
          placeholder="Ex: Curcuma longa"
          autoComplete="off"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="chemical_compound">{t('formSections.chemicalCompound')}</Label>
        <Input
          id="chemical_compound"
          name="chemical_compound"
          value={formData.chemical_compound}
          onChange={handleFormChange}
          placeholder="Ex: Curcumina"
          autoComplete="off"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">{t('formSections.description')}</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleFormChange}
          placeholder={t('formSections.descriptionPlaceholder')}
          className="min-h-[80px]"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="contraindications">{t('formSections.contraindications')}</Label>
        <Textarea
          id="contraindications"
          name="contraindications"
          value={formData.contraindications}
          onChange={handleFormChange}
          placeholder={t('formSections.contraindicationsPlaceholder')}
          className="min-h-[80px]"
        />
      </div>
    </>
  );
};

export const RelationshipSection: React.FC<FormSectionsProps> = ({
  formData,
  handleOutcomeChange,
  handleEfficacyChange,
  handleAddRelation,
  outcomes,
  studies,
  studiesLoading,
  selectedStudies,
  handleStudiesDropped,
  handleFormChange
}) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-4 pt-4 border-t">
      <h3 className="font-medium">{t('formSections.relationTitle')}</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="outcome">{t('formSections.outcome')}</Label>
          <Select 
            value={formData.outcome_id} 
            onValueChange={handleOutcomeChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('formSections.selectOutcome')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no_outcome">
                {t('formSections.noOutcome')}
              </SelectItem>
              {outcomes?.map(outcome => (
                <SelectItem key={outcome.id} value={outcome.id}>
                  {outcome.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="efficacy_score">{t('formSections.efficacyLabel', { score: formData.efficacy_score })}</Label>
          <Slider
            id="efficacy_score"
            value={[formData.efficacy_score]}
            min={1}
            max={5}
            step={0.5}
            onValueChange={handleEfficacyChange}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>{t('formSections.relatedStudies')}</Label>
        <StudiesDropZone 
          studies={studies} 
          selectedStudies={selectedStudies}
          onStudiesDropped={handleStudiesDropped}
          loading={studiesLoading}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="notes">{t('formSections.notes')}</Label>
        <Textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleFormChange}
          placeholder={t('formSections.notesPlaceholder')}
          className="min-h-[80px]"
        />
      </div>
      
      <Button 
        type="button" 
        variant="outline" 
        onClick={handleAddRelation}
        disabled={!formData.outcome_id || formData.outcome_id === "no_outcome"}
        className="w-full"
      >
        {t('formSections.addRelation')}
      </Button>
    </div>
  );
};

export const RelationsList: React.FC<{
  relations: any[];
  handleRemoveRelation: (index: number) => void;
}> = ({ relations, handleRemoveRelation }) => {
  const { t } = useTranslation();
  if (relations.length === 0) return null;
  
  return (
    <div className="border rounded-md p-3 space-y-2">
      <h4 className="font-medium text-sm">{t('formSections.additionalRelations')}</h4>
      
      {relations.map((relation, index) => (
        <div key={index} className="flex items-center justify-between bg-muted/50 p-2 rounded">
          <div>
            <span className="font-medium">{relation.outcome_name}</span>
            <div className="text-xs text-muted-foreground">
              {t('formSections.efficacyValue', { score: relation.efficacy_score })}
              {relation.study_name && ` • ${t('formSections.studyLabel', { name: relation.study_name })}`}
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => handleRemoveRelation(index)}
            className="h-6 w-6"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  );
};
