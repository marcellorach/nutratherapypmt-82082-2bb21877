import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Languages } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useAutoTranslate } from '@/hooks/useAutoTranslate';

interface BasicInfoTabBilingualProps {
  form: UseFormReturn<any>;
  isSubmitting: boolean;
  isEditMode: boolean;
  onCancel: () => void;
}

const BasicInfoTabBilingual: React.FC<BasicInfoTabBilingualProps> = ({
  form,
  isSubmitting,
  isEditMode,
  onCancel
}) => {
  const { t } = useTranslation();
  const { translating, translateField, lastManualEdit, resetManualEditTracking } = useAutoTranslate();
  
  const formData = form.getValues();
  const setFormData = (data: any) => {
    Object.keys(data).forEach(key => {
      form.setValue(key, data[key]);
    });
  };

  useEffect(() => {
    resetManualEditTracking();
  }, []);

  const handleTranslatableChange = (
    field: string,
    value: string,
    lang: 'pt' | 'en',
    context: string
  ) => {
    const fieldKey = lang === 'pt' ? field : `${field}_en`;
    form.setValue(fieldKey, value);
    lastManualEdit.current[lang][field] = Date.now();
    translateField(field, value, lang, context, formData, setFormData);
  };
  
  return (
    <Form {...form}>
      <div className="space-y-4 py-4">
        <Tabs defaultValue="pt" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pt">🇧🇷 Português</TabsTrigger>
            <TabsTrigger value="en">🇺🇸 English</TabsTrigger>
          </TabsList>
          
          {/* Conteúdo em Português */}
          <TabsContent value="pt" className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    {t('nutraceuticals.form.name')}
                    {translating.name && <Languages className="h-3 w-3 animate-pulse text-primary" />}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder={t('nutraceuticals.form.namePlaceholder')}
                      onChange={(e) => {
                        field.onChange(e);
                        handleTranslatableChange('name', e.target.value, 'pt', 'nutraceutical_name');
                      }}
                    />
                  </FormControl>
                  {translating.name && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Traduzindo automaticamente...
                    </span>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    {t('nutraceuticals.form.description')}
                    {translating.description && <Languages className="h-3 w-3 animate-pulse text-primary" />}
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder={t('nutraceuticals.form.descriptionPlaceholder')} 
                      className="min-h-[100px]"
                      onChange={(e) => {
                        field.onChange(e);
                        handleTranslatableChange('description', e.target.value, 'pt', 'nutraceutical_description');
                      }}
                    />
                  </FormControl>
                  {translating.description && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Traduzindo automaticamente...
                    </span>
                  )}
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
                    <FormLabel className="flex items-center gap-2">
                      {t('nutraceuticals.form.dosage')}
                      {translating.dosage && <Languages className="h-3 w-3 animate-pulse text-primary" />}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder={t('nutraceuticals.form.dosagePlaceholder')}
                        onChange={(e) => {
                          field.onChange(e);
                          handleTranslatableChange('dosage', e.target.value, 'pt', 'dosage');
                        }}
                      />
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
                    <FormLabel className="flex items-center gap-2">
                      {t('nutraceuticals.form.source')}
                      {translating.source && <Languages className="h-3 w-3 animate-pulse text-primary" />}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder={t('nutraceuticals.form.sourcePlaceholder')}
                        onChange={(e) => {
                          field.onChange(e);
                          handleTranslatableChange('source', e.target.value, 'pt', 'source');
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>
          
          {/* Conteúdo em English */}
          <TabsContent value="en" className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="name_en"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Nutraceutical Name
                    {translating.name && <Languages className="h-3 w-3 animate-pulse text-primary" />}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Ex: Resveratrol, Omega-3"
                      onChange={(e) => {
                        field.onChange(e);
                        handleTranslatableChange('name', e.target.value, 'en', 'nutraceutical_name');
                      }}
                    />
                  </FormControl>
                  {translating.name && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Translating automatically...
                    </span>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description_en"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Description
                    {translating.description && <Languages className="h-3 w-3 animate-pulse text-primary" />}
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Describe the nutraceutical and its main properties" 
                      className="min-h-[100px]"
                      onChange={(e) => {
                        field.onChange(e);
                        handleTranslatableChange('description', e.target.value, 'en', 'nutraceutical_description');
                      }}
                    />
                  </FormControl>
                  {translating.description && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Translating automatically...
                    </span>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dosage_en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Dosage
                      {translating.dosage && <Languages className="h-3 w-3 animate-pulse text-primary" />}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Ex: 500mg/day"
                        onChange={(e) => {
                          field.onChange(e);
                          handleTranslatableChange('dosage', e.target.value, 'en', 'dosage');
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="source_en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Source
                      {translating.source && <Languages className="h-3 w-3 animate-pulse text-primary" />}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Ex: Grapes, green tea"
                        onChange={(e) => {
                          field.onChange(e);
                          handleTranslatableChange('source', e.target.value, 'en', 'source');
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>
        </Tabs>
        
        <FormField
          control={form.control}
          name="chemical_compound"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t('nutraceuticals.form.chemicalCompound')} / Chemical Compound
              </FormLabel>
              <FormControl>
                <Input {...field} placeholder={t('nutraceuticals.form.chemicalPlaceholder')} />
              </FormControl>
              <FormMessage />
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

export default BasicInfoTabBilingual;
