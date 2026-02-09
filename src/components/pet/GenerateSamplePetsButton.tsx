import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const SAMPLE_PETS = [
  {
    name: 'Rex',
    breed: 'Labrador Retriever',
    age_years: 8,
    weight_kg: 32,
    sex: 'male' as const,
    neutered: true,
    owner_name: 'Maria Silva',
    owner_email: 'maria@example.com',
    notes: 'Senior dog with joint issues. Active lifestyle.',
    conditions: [
      { condition_name: 'Hip Dysplasia', severity: 'moderate', status: 'active' },
      { condition_name: 'Osteoarthritis', severity: 'mild', status: 'monitoring' },
    ],
    medications: [
      { medication_name: 'Meloxicam', dosage: '0.1mg/kg', frequency: 'Once daily' },
    ],
    exams: [
      { exam_type: 'X-Ray (Hip)', results: { grade: 3, bilateral: true, degeneration: 'moderate' } },
      { exam_type: 'Complete Blood Count', results: { wbc: 12500, rbc: 7.2, platelets: 280000 } },
    ],
  },
  {
    name: 'Luna',
    breed: 'Cavalier King Charles Spaniel',
    age_years: 6,
    weight_kg: 7.5,
    sex: 'female' as const,
    neutered: true,
    owner_name: 'João Pereira',
    owner_email: 'joao@example.com',
    notes: 'Heart murmur detected at 4 years old. Regular cardiac monitoring.',
    conditions: [
      { condition_name: 'Mitral Valve Disease', severity: 'moderate', status: 'active' },
      { condition_name: 'Syringomyelia', severity: 'mild', status: 'monitoring' },
    ],
    medications: [
      { medication_name: 'Pimobendan', dosage: '0.25mg/kg', frequency: 'Twice daily' },
      { medication_name: 'Furosemide', dosage: '2mg/kg', frequency: 'Once daily' },
    ],
    exams: [
      { exam_type: 'Echocardiogram', results: { lvedd: 38, lvesd: 26, fs: 32, murmur_grade: '4/6' } },
      { exam_type: 'Thoracic X-Ray', results: { heart_size: 'enlarged', vhs: 11.5 } },
    ],
  },
  {
    name: 'Thor',
    breed: 'German Shepherd',
    age_years: 5,
    weight_kg: 38,
    sex: 'male' as const,
    neutered: false,
    owner_name: 'Ana Costa',
    owner_email: 'ana@example.com',
    notes: 'Working dog. Digestive sensitivity. Mild allergies.',
    conditions: [
      { condition_name: 'Exocrine Pancreatic Insufficiency', severity: 'moderate', status: 'active' },
      { condition_name: 'Atopic Dermatitis', severity: 'mild', status: 'active' },
    ],
    medications: [
      { medication_name: 'Pancreatic Enzymes', dosage: '1 tsp/meal', frequency: 'With every meal' },
    ],
    exams: [
      { exam_type: 'TLI Test', results: { tli: 1.8, reference: '5.7-45.2', interpretation: 'Low - EPI confirmed' } },
      { exam_type: 'Allergy Panel', results: { dust_mites: 'positive', grass_pollen: 'positive', beef: 'negative' } },
    ],
  },
  {
    name: 'Mel',
    breed: 'Golden Retriever',
    age_years: 10,
    weight_kg: 28,
    sex: 'female' as const,
    neutered: true,
    owner_name: 'Pedro Santos',
    owner_email: 'pedro@example.com',
    notes: 'Geriatric patient. Cognitive decline observed in last 6 months.',
    conditions: [
      { condition_name: 'Canine Cognitive Dysfunction', severity: 'moderate', status: 'active' },
      { condition_name: 'Hypothyroidism', severity: 'mild', status: 'active' },
      { condition_name: 'Lumbar Spondylosis', severity: 'moderate', status: 'monitoring' },
    ],
    medications: [
      { medication_name: 'Selegiline', dosage: '0.5mg/kg', frequency: 'Once daily morning' },
      { medication_name: 'Levothyroxine', dosage: '0.02mg/kg', frequency: 'Twice daily' },
    ],
    exams: [
      { exam_type: 'Thyroid Panel', results: { t4: 0.8, tsh: 0.65, reference_t4: '1.0-4.0' } },
      { exam_type: 'Spinal X-Ray', results: { spondylosis: 'L3-L5', severity: 'moderate' } },
    ],
  },
  {
    name: 'Max',
    breed: 'Beagle',
    age_years: 3,
    weight_kg: 14,
    sex: 'male' as const,
    neutered: true,
    owner_name: 'Lucia Oliveira',
    owner_email: 'lucia@example.com',
    notes: 'Young adult. History of seizures starting at 2 years. Well controlled.',
    conditions: [
      { condition_name: 'Idiopathic Epilepsy', severity: 'moderate', status: 'active' },
    ],
    medications: [
      { medication_name: 'Phenobarbital', dosage: '2.5mg/kg', frequency: 'Twice daily' },
      { medication_name: 'Potassium Bromide', dosage: '30mg/kg', frequency: 'Once daily' },
    ],
    exams: [
      { exam_type: 'MRI Brain', results: { findings: 'No structural abnormalities', contrast: 'normal' } },
      { exam_type: 'Complete Blood Count', results: { wbc: 9800, rbc: 6.8, platelets: 310000 } },
      { exam_type: 'Liver Panel', results: { alt: 85, alp: 120, albumin: 3.2, note: 'Mild elevation due to phenobarbital' } },
    ],
  },
];

const GenerateSamplePetsButton: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      for (const pet of SAMPLE_PETS) {
        const { conditions, medications, exams, ...profileData } = pet;

        // Insert pet profile
        const { data: profile, error: profileError } = await supabase
          .from('pet_profiles')
          .insert({
            ...profileData,
            species: 'canine',
            created_by: userId,
            veterinarian_id: userId,
          })
          .select()
          .single();

        if (profileError) throw profileError;

        // Insert conditions
        if (conditions.length > 0) {
          const { error: condError } = await supabase
            .from('pet_conditions')
            .insert(conditions.map(c => ({ ...c, pet_id: profile.id })));
          if (condError) throw condError;
        }

        // Insert medications
        if (medications.length > 0) {
          const { error: medError } = await supabase
            .from('pet_medications')
            .insert(medications.map(m => ({ ...m, pet_id: profile.id })));
          if (medError) throw medError;
        }

        // Insert exams
        if (exams.length > 0) {
          const { error: examError } = await supabase
            .from('pet_exams')
            .insert(exams.map(e => ({
              ...e,
              pet_id: profile.id,
              exam_date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            })));
          if (examError) throw examError;
        }
      }

      queryClient.invalidateQueries({ queryKey: ['pet-profiles'] });

      toast({
        title: t('petRegistration.generator.success'),
        description: t('petRegistration.generator.successDesc', { count: SAMPLE_PETS.length }),
      });
    } catch (error: any) {
      console.error('Error generating sample pets:', error);
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleGenerate}
      disabled={isGenerating}
      className="gap-2"
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="h-4 w-4" />
      )}
      {isGenerating
        ? t('petRegistration.generator.generating')
        : t('petRegistration.generator.button')}
    </Button>
  );
};

export default GenerateSamplePetsButton;
