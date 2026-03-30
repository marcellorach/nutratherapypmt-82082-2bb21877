import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const BREED_PHOTOS: Record<string, string> = {
  'Labrador Retriever': '/images/breeds/labrador-retriever.jpg',
  'Cavalier King Charles Spaniel': '/images/breeds/cavalier-king-charles.jpg',
  'German Shepherd': '/images/breeds/german-shepherd.jpg',
  'Golden Retriever': '/images/breeds/golden-retriever.jpg',
  'Beagle': '/images/breeds/beagle.jpg',
};

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
    notes: 'Senior dog with joint stiffness. Active lifestyle, showing signs of aging.',
    conditions: [
      { condition_name: 'Osteoarthritis', severity: 'moderate', status: 'active' },
      { condition_name: 'Cellular Senescence', severity: 'mild', status: 'monitoring' },
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
    notes: 'Heart murmur detected at 4 years old. Regular cardiac monitoring. Early cognitive signs.',
    conditions: [
      { condition_name: 'Cardiovascular Disease', severity: 'moderate', status: 'active' },
      { condition_name: 'Cognitive Dysfunction Syndrome', severity: 'mild', status: 'monitoring' },
    ],
    medications: [
      { medication_name: 'Pimobendan', dosage: '0.25mg/kg', frequency: 'Twice daily' },
      { medication_name: 'Furosemide', dosage: '2mg/kg', frequency: 'Once daily' },
    ],
    exams: [
      { exam_type: 'Echocardiogram', results: { lvedd: 38, lvesd: 26, fs: '32%', murmur_grade: '4/6' } },
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
    notes: 'Working dog. Joint stress from activity. Chronic low-grade inflammation.',
    conditions: [
      { condition_name: 'Osteoarthritis', severity: 'moderate', status: 'active' },
      { condition_name: 'Inflammaging', severity: 'mild', status: 'active' },
    ],
    medications: [
      { medication_name: 'Carprofen', dosage: '2mg/kg', frequency: 'Twice daily' },
    ],
    exams: [
      { exam_type: 'Joint Evaluation', results: { hips: 'mild dysplasia', elbows: 'normal', gait: 'slight stiffness' } },
      { exam_type: 'Inflammatory Markers', results: { crp: 15.2, reference: '<10', interpretation: 'Mildly elevated' } },
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
    notes: 'Geriatric patient. Cognitive decline observed in last 6 months. Joint pain and aging signs.',
    conditions: [
      { condition_name: 'Cognitive Dysfunction Syndrome', severity: 'moderate', status: 'active' },
      { condition_name: 'Osteoarthritis', severity: 'mild', status: 'active' },
      { condition_name: 'Cellular Senescence', severity: 'mild', status: 'monitoring' },
    ],
    medications: [
      { medication_name: 'Selegiline', dosage: '0.5mg/kg', frequency: 'Once daily morning' },
    ],
    exams: [
      { exam_type: 'Cognitive Assessment', results: { disorientation: 'moderate', sleep_wake_cycle: 'altered', interaction: 'reduced', house_soiling: 'occasional' } },
      { exam_type: 'Complete Blood Count', results: { wbc: 10200, rbc: 6.5, platelets: 265000 } },
    ],
  },
  {
    name: 'Max',
    breed: 'Beagle',
    age_years: 9,
    weight_kg: 14,
    sex: 'male' as const,
    neutered: true,
    owner_name: 'Lucia Oliveira',
    owner_email: 'lucia@example.com',
    notes: 'Senior beagle. Early cognitive changes and general aging. Overweight.',
    conditions: [
      { condition_name: 'Cognitive Dysfunction Syndrome', severity: 'mild', status: 'active' },
      { condition_name: 'Inflammation', severity: 'mild', status: 'monitoring' },
    ],
    medications: [],
    exams: [
      { exam_type: 'Geriatric Panel', results: { glucose: 95, bun: 22, creatinine: 1.1, alt: 45, albumin: 3.4 } },
      { exam_type: 'Cognitive Assessment', results: { disorientation: 'mild', sleep_wake_cycle: 'normal', interaction: 'slightly_reduced' } },
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

        const { data: profile, error: profileError } = await supabase
          .from('pet_profiles')
          .insert({
            ...profileData,
            species: 'canine',
            created_by: userId,
            veterinarian_id: userId,
            photo_url: BREED_PHOTOS[pet.breed] || null,
            is_demo: true,
          })
          .select()
          .single();

        if (profileError) throw profileError;

        if (conditions.length > 0) {
          const { error: condError } = await supabase
            .from('pet_conditions')
            .insert(conditions.map(c => ({ ...c, pet_id: profile.id })));
          if (condError) throw condError;
        }

        if (medications.length > 0) {
          const { error: medError } = await supabase
            .from('pet_medications')
            .insert(medications.map(m => ({ ...m, pet_id: profile.id })));
          if (medError) throw medError;
        }

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
