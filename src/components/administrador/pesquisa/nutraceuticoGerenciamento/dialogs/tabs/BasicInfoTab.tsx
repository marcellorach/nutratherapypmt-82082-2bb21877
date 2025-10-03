
import React from 'react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

interface BasicInfoTabProps {
  form: UseFormReturn<any>;
  isSubmitting: boolean;
  isEditMode: boolean;
  onCancel: () => void;
}

const BasicInfoTab: React.FC<BasicInfoTabProps> = ({
  form,
  isSubmitting,
  isEditMode,
  onCancel
}) => {
  const { t } = useTranslation();
  
  return (
    <Form {...form}>
      <div className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('nutraceuticals.form.name')}</FormLabel>
              <FormControl>
                <Input {...field} placeholder={t('nutraceuticals.form.namePlaceholder')} />
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
              <FormLabel>{t('nutraceuticals.form.description')}</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder={t('nutraceuticals.form.descriptionPlaceholder')} 
                  className="min-h-[100px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="dosage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('nutraceuticals.form.dosage')}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={t('nutraceuticals.form.dosagePlaceholder')} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="source"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('nutraceuticals.form.source')}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={t('nutraceuticals.form.sourcePlaceholder')} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="chemical_compound"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('nutraceuticals.form.chemicalCompound')}</FormLabel>
              <FormControl>
                <Input {...field} placeholder={t('nutraceuticals.form.chemicalPlaceholder')} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="contraindications"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('nutraceuticals.form.contraindications')}</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder={t('nutraceuticals.form.contraindicationsPlaceholder')} 
                  className="min-h-[80px]"
                />
              </FormControl>
              <FormMessage />
              <p className="text-xs text-muted-foreground">
                {t('nutraceuticals.form.contraindicationsHelp')}
              </p>
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {t('nutraceuticals.form.cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditMode ? t('nutraceuticals.form.saving') : t('nutraceuticals.form.creating')}
              </>
            ) : (
              isEditMode ? t('nutraceuticals.form.save') : t('nutraceuticals.form.create')
            )}
          </Button>
        </div>
      </div>
    </Form>
  );
};

export default BasicInfoTab;
