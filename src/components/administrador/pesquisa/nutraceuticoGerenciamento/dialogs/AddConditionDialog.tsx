
import React from 'react';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useConditions } from '@/hooks/nutraceuticals/useConditions';

const formSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
});

type FormData = z.infer<typeof formSchema>;

interface AddConditionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const AddConditionDialog: React.FC<AddConditionDialogProps> = ({ 
  open, 
  onOpenChange,
  onSuccess
}) => {
  const { t } = useTranslation();
  const { createCondition } = useConditions();
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', description: '' }
  });
  
  const { isSubmitting } = form.formState;

  const handleSubmit = async (values: FormData) => {
    try {
      await createCondition({ name: values.name, description: values.description });
      form.reset();
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error creating health condition:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('nutraceuticals.conditions.addTitle')}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('nutraceuticals.conditions.conditionName')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t('nutraceuticals.conditions.conditionNamePlaceholder')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('nutraceuticals.conditions.conditionDescription')}</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder={t('nutraceuticals.conditions.conditionDescriptionPlaceholder')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t('nutraceuticals.conditions.savingCondition') : t('nutraceuticals.conditions.saveCondition')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddConditionDialog;
