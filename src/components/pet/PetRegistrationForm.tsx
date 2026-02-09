import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PawPrint } from 'lucide-react';
import type { PetProfileData } from '@/hooks/usePetProfile';

const petFormSchema = z.object({
  name: z.string().min(1, 'Required'),
  breed: z.string().min(1, 'Required'),
  age_years: z.coerce.number().min(0).max(30),
  weight_kg: z.coerce.number().min(0.1).max(150),
  sex: z.enum(['male', 'female']),
  neutered: z.boolean(),
  chip_number: z.string().optional(),
  owner_name: z.string().optional(),
  owner_email: z.string().email().optional().or(z.literal('')),
  notes: z.string().optional(),
});

type PetFormValues = z.infer<typeof petFormSchema>;

interface PetRegistrationFormProps {
  onSubmit: (data: PetProfileData) => void;
  isLoading?: boolean;
  defaultValues?: Partial<PetFormValues>;
}

const COMMON_BREEDS = [
  'Labrador Retriever', 'Golden Retriever', 'German Shepherd', 'Bulldog',
  'Beagle', 'Poodle', 'Rottweiler', 'Yorkshire Terrier', 'Boxer',
  'Dachshund', 'Cavalier King Charles Spaniel', 'Siberian Husky',
  'Doberman', 'Shih Tzu', 'Border Collie', 'Cocker Spaniel',
  'Bernese Mountain Dog', 'Pug', 'French Bulldog', 'Maltese',
];

const PetRegistrationForm: React.FC<PetRegistrationFormProps> = ({ onSubmit, isLoading, defaultValues }) => {
  const { t } = useTranslation();

  const form = useForm<PetFormValues>({
    resolver: zodResolver(petFormSchema),
    defaultValues: {
      name: '',
      breed: '',
      age_years: 0,
      weight_kg: 0,
      sex: 'male',
      neutered: false,
      chip_number: '',
      owner_name: '',
      owner_email: '',
      notes: '',
      ...defaultValues,
    },
  });

  const handleSubmit = (values: PetFormValues) => {
    onSubmit({
      name: values.name,
      breed: values.breed,
      age_years: values.age_years,
      weight_kg: values.weight_kg,
      sex: values.sex,
      neutered: values.neutered,
      species: 'canine',
      chip_number: values.chip_number || undefined,
      owner_name: values.owner_name || undefined,
      owner_email: values.owner_email || undefined,
      notes: values.notes || undefined,
    });
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <PawPrint className="h-5 w-5" />
          {t('petRegistration.form.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('petRegistration.form.name')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('petRegistration.form.namePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="breed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('petRegistration.form.breed')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('petRegistration.form.breedPlaceholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {COMMON_BREEDS.map((breed) => (
                        <SelectItem key={breed} value={breed}>
                          {breed}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="age_years"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('petRegistration.form.age')}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.5" min="0" max="30" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="weight_kg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('petRegistration.form.weight')}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" min="0.1" max="150" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sex"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('petRegistration.form.sex')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">{t('petRegistration.form.male')}</SelectItem>
                        <SelectItem value="female">{t('petRegistration.form.female')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="neutered"
                render={({ field }) => (
                  <FormItem className="flex flex-col justify-end">
                    <FormLabel>{t('petRegistration.form.neutered')}</FormLabel>
                    <div className="flex items-center gap-2 h-10">
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                      <span className="text-sm text-muted-foreground">
                        {field.value ? t('common.yes') : t('common.no')}
                      </span>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="chip_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('petRegistration.form.chipNumber')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('petRegistration.form.chipPlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border-t pt-4 mt-4">
              <p className="text-sm font-medium text-muted-foreground mb-3">
                {t('petRegistration.form.ownerInfo')}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="owner_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('petRegistration.form.ownerName')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('petRegistration.form.ownerNamePlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="owner_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('petRegistration.form.ownerEmail')}</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder={t('petRegistration.form.ownerEmailPlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('petRegistration.form.notes')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('petRegistration.form.notesPlaceholder')}
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t('common.saving') : t('petRegistration.form.register')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default PetRegistrationForm;
