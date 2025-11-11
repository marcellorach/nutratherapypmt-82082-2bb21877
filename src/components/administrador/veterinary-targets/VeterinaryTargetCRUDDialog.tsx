
import React, { useState, useEffect } from 'react';
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
import { Loader2 } from 'lucide-react';

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
              <Label htmlFor="name">{t('admin.veterinaryTargets.crudDialog.nameLabel')}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('admin.veterinaryTargets.crudDialog.namePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('admin.veterinaryTargets.crudDialog.descriptionLabel')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('admin.veterinaryTargets.crudDialog.descriptionPlaceholder')}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">{t('admin.veterinaryTargets.crudDialog.categoryLabel')}</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder={t('admin.veterinaryTargets.crudDialog.categoryPlaceholder')}
              />
            </div>
          </TabsContent>

          <TabsContent value="en" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name_en">{t('admin.veterinaryTargets.crudDialog.nameEnLabel')}</Label>
              <Input
                id="name_en"
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                placeholder={t('admin.veterinaryTargets.crudDialog.nameEnPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description_en">{t('admin.veterinaryTargets.crudDialog.descriptionEnLabel')}</Label>
              <Textarea
                id="description_en"
                value={formData.description_en}
                onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                placeholder={t('admin.veterinaryTargets.crudDialog.descriptionEnPlaceholder')}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category_en">{t('admin.veterinaryTargets.crudDialog.categoryEnLabel')}</Label>
              <Input
                id="category_en"
                value={formData.category_en}
                onChange={(e) => setFormData({ ...formData, category_en: e.target.value })}
                placeholder={t('admin.veterinaryTargets.crudDialog.categoryEnPlaceholder')}
              />
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
