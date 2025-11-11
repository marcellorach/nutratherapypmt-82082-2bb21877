
import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Languages } from 'lucide-react';
import { useDebouncedCallback } from '@/hooks/performance/useDebounce';

interface VeterinaryTargetCRUDDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  condition: any | null;
  onSuccess: () => void;
}

const VeterinaryTargetCRUDDialog: React.FC<VeterinaryTargetCRUDDialogProps> = ({
  open,
  onOpenChange,
  condition,
  onSuccess
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    name_en: '',
    description: '',
    description_en: '',
    category: '',
    category_en: '',
    severity_level: 'moderate'
  });

  const [translating, setTranslating] = useState({
    name: false,
    description: false,
    category: false
  });

  // Track last manual edits to prevent overwriting user input
  const lastManualEdit = useRef<{
    pt: { name: number; description: number; category: number };
    en: { name: number; description: number; category: number };
  }>({
    pt: { name: 0, description: 0, category: 0 },
    en: { name: 0, description: 0, category: 0 }
  });

  // Auto-translate function with debounce
  const translateField = useDebouncedCallback(
    async (field: 'name' | 'description' | 'category', value: string, sourceLang: 'pt' | 'en') => {
      if (!value.trim()) return;

      const targetLang = sourceLang === 'pt' ? 'en' : 'pt';
      const targetField = sourceLang === 'pt' ? `${field}_en` : field;
      const currentTargetValue = formData[targetField as keyof typeof formData];

      // Don't translate if target field was manually edited in the last 30 seconds
      const targetLangKey = targetLang as 'pt' | 'en';
      const timeSinceManualEdit = Date.now() - lastManualEdit.current[targetLangKey][field];
      if (timeSinceManualEdit < 30000 && currentTargetValue) {
        console.log(`Skipping translation: ${field} was manually edited ${timeSinceManualEdit}ms ago`);
        return;
      }

      setTranslating(prev => ({ ...prev, [field]: true }));

      try {
        const { data, error } = await supabase.functions.invoke('translate-text', {
          body: { 
            text: value, 
            sourceLang, 
            targetLang,
            context: field 
          }
        });

        if (error) throw error;

        if (data?.translatedText) {
          setFormData(prev => ({ 
            ...prev, 
            [targetField]: data.translatedText 
          }));
        }
      } catch (error) {
        console.error('Translation error:', error);
        // Don't show toast for translation errors to avoid disrupting user experience
      } finally {
        setTranslating(prev => ({ ...prev, [field]: false }));
      }
    },
    1500,
    []
  );

  useEffect(() => {
    if (condition) {
      setFormData({
        name: condition.name || '',
        name_en: condition.name_en || '',
        description: condition.description || '',
        description_en: condition.description_en || '',
        category: condition.category || '',
        category_en: condition.category_en || '',
        severity_level: condition.severity_level || 'moderate'
      });
    } else {
      setFormData({
        name: '',
        name_en: '',
        description: '',
        description_en: '',
        category: '',
        category_en: '',
        severity_level: 'moderate'
      });
    }
    // Reset manual edit tracking when dialog opens/closes
    lastManualEdit.current = {
      pt: { name: 0, description: 0, category: 0 },
      en: { name: 0, description: 0, category: 0 }
    };
  }, [condition, open]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: t('admin.veterinaryTargets.toast.nameRequired'),
        description: t('admin.veterinaryTargets.toast.nameRequiredDescription'),
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      if (condition) {
        // Update
        const { error } = await supabase
          .from('health_conditions')
          .update(formData)
          .eq('id', condition.id);

        if (error) throw error;

        toast({
          title: t('admin.veterinaryTargets.toast.conditionUpdated'),
          description: t('admin.veterinaryTargets.toast.conditionUpdatedDescription'),
        });
      } else {
        // Create
        const { error } = await supabase
          .from('health_conditions')
          .insert([formData]);

        if (error) throw error;

        toast({
          title: t('admin.veterinaryTargets.toast.conditionCreated'),
          description: t('admin.veterinaryTargets.toast.conditionCreatedDescription'),
        });
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: t('admin.veterinaryTargets.toast.errorSaving'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {condition ? t('admin.veterinaryTargets.crudDialog.titleEdit') : t('admin.veterinaryTargets.crudDialog.titleNew')}
          </DialogTitle>
          <DialogDescription>
            {condition 
              ? t('admin.veterinaryTargets.crudDialog.descriptionEdit')
              : t('admin.veterinaryTargets.crudDialog.descriptionNew')
            }
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="pt" className="py-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pt">{t('admin.veterinaryTargets.crudDialog.tabPT')}</TabsTrigger>
            <TabsTrigger value="en">{t('admin.veterinaryTargets.crudDialog.tabEN')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pt" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                {t('admin.veterinaryTargets.crudDialog.nameLabel')}
                {translating.name && <Languages className="h-3 w-3 animate-pulse text-primary" />}
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setFormData({ ...formData, name: newValue });
                  lastManualEdit.current.pt.name = Date.now();
                  translateField('name', newValue, 'pt');
                }}
                placeholder={t('admin.veterinaryTargets.crudDialog.namePlaceholder')}
              />
              {translating.name && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Traduzindo automaticamente...
                </span>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center gap-2">
                {t('admin.veterinaryTargets.crudDialog.descriptionLabel')}
                {translating.description && <Languages className="h-3 w-3 animate-pulse text-primary" />}
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setFormData({ ...formData, description: newValue });
                  lastManualEdit.current.pt.description = Date.now();
                  translateField('description', newValue, 'pt');
                }}
                placeholder={t('admin.veterinaryTargets.crudDialog.descriptionPlaceholder')}
                rows={4}
              />
              {translating.description && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Traduzindo automaticamente...
                </span>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="flex items-center gap-2">
                {t('admin.veterinaryTargets.crudDialog.categoryLabel')}
                {translating.category && <Languages className="h-3 w-3 animate-pulse text-primary" />}
              </Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setFormData({ ...formData, category: newValue });
                  lastManualEdit.current.pt.category = Date.now();
                  translateField('category', newValue, 'pt');
                }}
                placeholder={t('admin.veterinaryTargets.crudDialog.categoryPlaceholder')}
              />
              {translating.category && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Traduzindo automaticamente...
                </span>
              )}
            </div>
          </TabsContent>

          <TabsContent value="en" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name_en" className="flex items-center gap-2">
                {t('admin.veterinaryTargets.crudDialog.nameEnLabel')}
                {translating.name && <Languages className="h-3 w-3 animate-pulse text-primary" />}
              </Label>
              <Input
                id="name_en"
                value={formData.name_en}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setFormData({ ...formData, name_en: newValue });
                  lastManualEdit.current.en.name = Date.now();
                  translateField('name', newValue, 'en');
                }}
                placeholder={t('admin.veterinaryTargets.crudDialog.nameEnPlaceholder')}
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
                {t('admin.veterinaryTargets.crudDialog.descriptionEnLabel')}
                {translating.description && <Languages className="h-3 w-3 animate-pulse text-primary" />}
              </Label>
              <Textarea
                id="description_en"
                value={formData.description_en}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setFormData({ ...formData, description_en: newValue });
                  lastManualEdit.current.en.description = Date.now();
                  translateField('description', newValue, 'en');
                }}
                placeholder={t('admin.veterinaryTargets.crudDialog.descriptionEnPlaceholder')}
                rows={4}
              />
              {translating.description && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Translating automatically...
                </span>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category_en" className="flex items-center gap-2">
                {t('admin.veterinaryTargets.crudDialog.categoryEnLabel')}
                {translating.category && <Languages className="h-3 w-3 animate-pulse text-primary" />}
              </Label>
              <Input
                id="category_en"
                value={formData.category_en}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setFormData({ ...formData, category_en: newValue });
                  lastManualEdit.current.en.category = Date.now();
                  translateField('category', newValue, 'en');
                }}
                placeholder={t('admin.veterinaryTargets.crudDialog.categoryEnPlaceholder')}
              />
              {translating.category && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Translating automatically...
                </span>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-2 border-t pt-4">
          <Label htmlFor="severity">{t('admin.veterinaryTargets.crudDialog.severityLabel')}</Label>
          <Select
            value={formData.severity_level}
            onValueChange={(value) => setFormData({ ...formData, severity_level: value })}
          >
            <SelectTrigger id="severity">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">{t('admin.veterinaryTargets.crudDialog.severityLow')}</SelectItem>
              <SelectItem value="moderate">{t('admin.veterinaryTargets.crudDialog.severityModerate')}</SelectItem>
              <SelectItem value="high">{t('admin.veterinaryTargets.crudDialog.severityHigh')}</SelectItem>
              <SelectItem value="critical">{t('admin.veterinaryTargets.crudDialog.severityCritical')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VeterinaryTargetCRUDDialog;
