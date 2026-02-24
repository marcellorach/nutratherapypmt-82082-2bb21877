import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FamilySelector from "./FamilySelector";
import { useTranslation } from 'react-i18next';
import { useAutoTranslate } from '@/hooks/useAutoTranslate';
import { Languages, Loader2 } from 'lucide-react';

interface OutcomeFormDialogBilingualProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isCreate: boolean;
  formData: {
    name: string;
    name_en?: string;
    description: string;
    description_en?: string;
    family_id: string;
  };
  setFormData: (data: any) => void;
  handleFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleFamilyChange: (value: string) => void;
  submitAction: () => void;
}

const OutcomeFormDialogBilingual: React.FC<OutcomeFormDialogBilingualProps> = ({
  isOpen,
  setIsOpen,
  isCreate,
  formData,
  setFormData,
  handleFormChange,
  handleFamilyChange,
  submitAction,
}) => {
  const { t } = useTranslation();
  const { translating, translateField, lastManualEdit, resetManualEditTracking } = useAutoTranslate();

  useEffect(() => {
    if (isOpen) {
      resetManualEditTracking();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitAction();
  };

  const handleTranslatableChange = (
    field: 'name' | 'description',
    value: string,
    lang: 'pt' | 'en'
  ) => {
    const fieldKey = lang === 'pt' ? field : `${field}_en`;
    setFormData({ ...formData, [fieldKey]: value });
    lastManualEdit.current[lang][field] = Date.now();
    translateField(field, value, lang, `outcome_${field}`, formData, setFormData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isCreate ? t('outcomeManagement.form.createTitle') : t('outcomeManagement.form.editTitle')}
          </DialogTitle>
          <DialogDescription>
            {isCreate 
              ? t('outcomeManagement.form.createDescription')
              : t('outcomeManagement.form.editDescription')
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <Tabs defaultValue="pt" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pt">🇧🇷 Português</TabsTrigger>
                <TabsTrigger value="en">🇺🇸 English</TabsTrigger>
              </TabsList>
              
              {/* Conteúdo em Português */}
              <TabsContent value="pt" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    {t('outcomeManagement.form.nameLabel')}
                    {translating.name && <Languages className="h-3 w-3 animate-pulse text-primary" />}
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={(e) => handleTranslatableChange('name', e.target.value, 'pt')}
                    required
                  />
                  {translating.name && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {t('outcomeManagement.form.translatingAuto')}
                    </span>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description" className="flex items-center gap-2">
                    {t('outcomeManagement.form.descriptionLabel')}
                    {translating.description && <Languages className="h-3 w-3 animate-pulse text-primary" />}
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={(e) => handleTranslatableChange('description', e.target.value, 'pt')}
                    rows={4}
                  />
                  {translating.description && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {t('outcomeManagement.form.translatingAuto')}
                    </span>
                  )}
                </div>
              </TabsContent>
              
              {/* Conteúdo em English */}
              <TabsContent value="en" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name_en" className="flex items-center gap-2">
                    {t('outcomeManagement.form.outcomeName')}
                    {translating.name && <Languages className="h-3 w-3 animate-pulse text-primary" />}
                  </Label>
                  <Input
                    id="name_en"
                    name="name_en"
                    value={formData.name_en || ''}
                    onChange={(e) => handleTranslatableChange('name', e.target.value, 'en')}
                  />
                  {translating.name && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Translating automatically...
                    </span>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description_en" className="flex items-center gap-2">
                    {t('outcomeManagement.form.descriptionLabel')}
                    {translating.description && <Languages className="h-3 w-3 animate-pulse text-primary" />}
                  </Label>
                  <Textarea
                    id="description_en"
                    name="description_en"
                    value={formData.description_en || ''}
                    onChange={(e) => handleTranslatableChange('description', e.target.value, 'en')}
                    rows={4}
                  />
                  {translating.description && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Translating automatically...
                    </span>
                  )}
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="space-y-2">
              <Label htmlFor="family">
                {t('outcomeManagement.form.familyLabel')} / Family
              </Label>
              <FamilySelector
                value={formData.family_id}
                onValueChange={handleFamilyChange}
                placeholder={t('outcomeManagement.form.familyPlaceholder')}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              {t('outcomeManagement.form.cancel')}
            </Button>
            <Button type="submit">
              {isCreate ? t('outcomeManagement.form.create') : t('outcomeManagement.form.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OutcomeFormDialogBilingual;
