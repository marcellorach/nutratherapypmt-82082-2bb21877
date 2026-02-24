import React from 'react';
import { FormDialogProps } from "../types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Languages, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAutoTranslate } from "@/hooks/useAutoTranslate";
import { useTranslation } from 'react-i18next';

interface DialogContentBilingualProps extends Omit<FormDialogProps, 'isOpen' | 'setIsOpen' | 'submitAction'> {
  setFormData: (data: any) => void;
}

const DialogContentBilingual: React.FC<DialogContentBilingualProps> = ({
  isCreate,
  formData,
  handleFormChange,
  handleOutcomeChange,
  handleEfficacyChange,
  handleStudyChange,
  handleAddRelation,
  handleRemoveRelation,
  relations,
  studies,
  outcomes,
  studiesLoading,
  selectedStudies,
  setFormData
}) => {
  const { translating, translateField, lastManualEdit } = useAutoTranslate();
  const { t } = useTranslation();

  const handleTranslatableChange = (
    field: string,
    value: string,
    lang: 'pt' | 'en',
    context: string
  ) => {
    const fieldKey = lang === 'pt' ? field : `${field}_en`;
    setFormData({ ...formData, [fieldKey]: value });
    lastManualEdit.current[lang][field] = Date.now();
    translateField(field, value, lang, context, formData, setFormData);
  };

  return (
    <Tabs defaultValue="info" className="w-full">
      <TabsList className="grid grid-cols-2">
        <TabsTrigger value="info">{t('bilingualForm.basicInfo')}</TabsTrigger>
        <TabsTrigger value="relations">{t('bilingualForm.relations')}</TabsTrigger>
      </TabsList>
      
      <TabsContent value="info" className="space-y-4 py-4">
        <Tabs defaultValue="pt" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pt">🇧🇷 Português</TabsTrigger>
            <TabsTrigger value="en">🇺🇸 English</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pt" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                {t('bilingualForm.nutraceuticalName')}
                {translating.name && <Languages className="h-3 w-3 animate-pulse text-primary" />}
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleTranslatableChange('name', e.target.value, 'pt', 'nutraceutical_name')}
                placeholder="Ex: Resveratrol, Ômega-3"
              />
              {translating.name && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {t('bilingualForm.translatingAuto')}
                </span>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center gap-2">
                {t('bilingualForm.descriptionLabel')}
                {translating.description && <Languages className="h-3 w-3 animate-pulse text-primary" />}
              </Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => handleTranslatableChange('description', e.target.value, 'pt', 'nutraceutical_description')}
                rows={4}
              />
              {translating.description && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {t('bilingualForm.translatingAuto')}
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="source" className="flex items-center gap-2">
                  {t('bilingualForm.sourceLabel')}
                  {translating.source && <Languages className="h-3 w-3 animate-pulse text-primary" />}
                </Label>
                <Input
                  id="source"
                  value={formData.source || ''}
                  onChange={(e) => handleTranslatableChange('source', e.target.value, 'pt', 'source')}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dosage" className="flex items-center gap-2">
                  {t('bilingualForm.dosageLabel')}
                  {translating.dosage && <Languages className="h-3 w-3 animate-pulse text-primary" />}
                </Label>
                <Input
                  id="dosage"
                  value={formData.dosage || ''}
                  onChange={(e) => handleTranslatableChange('dosage', e.target.value, 'pt', 'dosage')}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="chemical_compound">{t('bilingualForm.chemicalCompound')}</Label>
              <Input
                id="chemical_compound"
                value={formData.chemical_compound || ''}
                onChange={(e) => handleFormChange('chemical_compound', e.target.value)}
                placeholder="Ex: C14H12O3"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="en" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name_en" className="flex items-center gap-2">
                {t('bilingualForm.nutraceuticalName')}
                {translating.name && <Languages className="h-3 w-3 animate-pulse text-primary" />}
              </Label>
              <Input
                id="name_en"
                value={formData.name_en || ''}
                onChange={(e) => handleTranslatableChange('name', e.target.value, 'en', 'nutraceutical_name')}
                placeholder="Ex: Resveratrol, Omega-3"
              />
              {translating.name && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {t('bilingualForm.translatingAuto')}
                </span>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description_en" className="flex items-center gap-2">
                {t('bilingualForm.descriptionLabel')}
                {translating.description && <Languages className="h-3 w-3 animate-pulse text-primary" />}
              </Label>
              <Textarea
                id="description_en"
                value={formData.description_en || ''}
                onChange={(e) => handleTranslatableChange('description', e.target.value, 'en', 'nutraceutical_description')}
                rows={4}
              />
              {translating.description && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {t('bilingualForm.translatingAuto')}
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="source_en" className="flex items-center gap-2">
                  {t('bilingualForm.sourceLabel')}
                  {translating.source && <Languages className="h-3 w-3 animate-pulse text-primary" />}
                </Label>
                <Input
                  id="source_en"
                  value={formData.source_en || ''}
                  onChange={(e) => handleTranslatableChange('source', e.target.value, 'en', 'source')}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dosage_en" className="flex items-center gap-2">
                  {t('bilingualForm.dosageLabel')}
                  {translating.dosage && <Languages className="h-3 w-3 animate-pulse text-primary" />}
                </Label>
                <Input
                  id="dosage_en"
                  value={formData.dosage_en || ''}
                  onChange={(e) => handleTranslatableChange('dosage', e.target.value, 'en', 'dosage')}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="chemical_compound_en">{t('bilingualForm.chemicalCompound')}</Label>
              <Input
                id="chemical_compound_en"
                value={formData.chemical_compound || ''}
                onChange={(e) => handleFormChange('chemical_compound', e.target.value)}
                placeholder="Ex: C14H12O3"
              />
            </div>
          </TabsContent>
        </Tabs>
        
        <Separator />
        
        <div className="space-y-2">
          <Label htmlFor="contraindications">{t('bilingualForm.contraindicationsLabel')}</Label>
          <Textarea
            id="contraindications"
            value={formData.contraindications ? formData.contraindications.join('\n') : ''}
            onChange={(e) => handleFormChange('contraindications', e.target.value.split('\n').filter(Boolean))}
            placeholder={t('bilingualForm.contraindicationsPlaceholder')}
            rows={3}
          />
        </div>
      </TabsContent>
      
      <TabsContent value="relations" className="space-y-6 py-4">
        {relations.map((relation, index) => (
          <div key={`relation-${index}`} className="rounded-md border p-4 space-y-4 relative">
            {index > 0 && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="absolute top-2 right-2 h-8 w-8 text-destructive"
                onClick={(e) => handleRemoveRelation(index, e)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            
            <h3 className="font-medium">
              {index === 0 ? t('bilingualForm.mainRelation') : t('bilingualForm.relationN', { n: index + 1 })}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor={`outcome-${index}`} className="text-sm font-medium">
                  {t('bilingualForm.categoryOutcome')}
                </label>
                <select
                  id={`outcome-${index}`}
                  value={relation.outcome_id || 'none'}
                  onChange={(e) => handleOutcomeChange(index, e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="none">{t('bilingualForm.selectCategory')}</option>
                  {outcomes.map(outcome => (
                    <option key={outcome.id} value={outcome.id}>
                      {outcome.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  {t('bilingualForm.efficacyLevel', { score: relation.efficacy_score })}
                </label>
                <div className="pt-5">
                  <Slider
                    value={[relation.efficacy_score]}
                    min={0}
                    max={5}
                    step={1}
                    onValueChange={(values) => handleEfficacyChange(index, values[0])}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor={`notes-${index}`} className="text-sm font-medium">
                {t('bilingualForm.notesObservations')}
              </label>
              <textarea
                id={`notes-${index}`}
                value={relation.notes || ''}
                onChange={(e) => {
                  const newRelations = [...relations];
                  newRelations[index] = { ...newRelations[index], notes: e.target.value };
                }}
                placeholder={t('bilingualForm.observationsPlaceholder')}
                className="w-full border rounded px-3 py-2 min-h-[80px]"
              />
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">{t('bilingualForm.relatedStudiesTitle')}</h4>
              <Card>
                <CardContent className="p-3 max-h-[200px] overflow-y-auto">
                  {studiesLoading ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  ) : studies.length === 0 ? (
                    <div className="text-center py-3 text-sm text-muted-foreground">
                      {t('bilingualForm.noStudiesAvailable')}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {studies.map(study => (
                        <div key={study.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`study-${study.id}-${index}`}
                            checked={selectedStudies[index]?.includes(study.id) || false}
                            onChange={(e) => handleStudyChange(index, study.id, e.target.checked)}
                            className="h-4 w-4"
                          />
                          <label htmlFor={`study-${study.id}-${index}`} className="text-sm cursor-pointer flex-1">
                            {study.title}
                            {study.journal && (
                              <Badge variant="outline" className="ml-2 text-xs">{study.journal}</Badge>
                            )}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ))}
        
        <Button 
          type="button" 
          variant="outline" 
          className="w-full"
          onClick={handleAddRelation}
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('bilingualForm.addNewRelation')}
        </Button>
      </TabsContent>
    </Tabs>
  );
};

export default DialogContentBilingual;
