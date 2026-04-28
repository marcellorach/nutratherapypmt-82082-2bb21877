import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { warnIfGenericCategory } from '@/utils/conditionValidation';

const BREED_PHOTOS: Record<string, string> = {
  'Labrador Retriever': '/images/breeds/labrador-retriever.jpg',
  'Cavalier King Charles Spaniel': '/images/breeds/cavalier-king-charles.jpg',
  'German Shepherd': '/images/breeds/german-shepherd.jpg',
  'Golden Retriever': '/images/breeds/golden-retriever.jpg',
  'Beagle': '/images/breeds/beagle.jpg',
};

const SAMPLE_PETS = [
  // ───────────────────────────────────────────────────────────────
  // Regra de complexidade crescente (1 → 4 condições):
  // Os 5 pets de exemplo evoluem em complexidade clínica.
  // Todos têm pelo menos uma doença específica (não categorias),
  // com coexistências plausíveis para a idade/raça.
  // ───────────────────────────────────────────────────────────────

  // 1) SIMPLES — adulto jovem com 1 condição leve, sem medicação contínua
  {
    name: 'Buddy',
    breed: 'Beagle',
    age_years: 4,
    weight_kg: 12,
    sex: 'male' as const,
    neutered: true,
    owner_name: 'Carla Mendes',
    owner_email: 'carla@example.com',
    notes: 'Cão adulto jovem. Check-up de rotina identificou doença periodontal leve.',
    conditions: [
      { condition_name: 'Mild Periodontal Disease', severity: 'mild', status: 'active', origin: 'vet_diagnosis' },
    ],
    medications: [],
    exams: [
      { exam_type: 'Complete Blood Count', results: { wbc: 9800, rbc: 7.0, platelets: 290000, interpretation: 'normal' } },
      { exam_type: 'Dental Examination', results: { tartar: 'mild', gingivitis: 'grade 1', interpretation: 'Periodontite inicial' } },
    ],
  },

  // 2) LEVE-INTERMEDIÁRIO — sênior com 2 condições age-related
  {
    name: 'Max',
    breed: 'Beagle',
    age_years: 9,
    weight_kg: 14,
    sex: 'male' as const,
    neutered: true,
    owner_name: 'Lucia Oliveira',
    owner_email: 'lucia@example.com',
    notes: 'Beagle sênior. Sinais cognitivos iniciais e perda de massa muscular relacionada à idade.',
    conditions: [
      { condition_name: 'Cognitive Dysfunction Syndrome', severity: 'mild', status: 'active', origin: 'vet_diagnosis' },
      { condition_name: 'Sarcopenia', severity: 'mild', status: 'active', origin: 'vet_diagnosis' },
    ],
    medications: [],
    exams: [
      { exam_type: 'Geriatric Panel', results: { glucose: 95, bun: 22, creatinine: 1.1, alt: 45, albumin: 3.4 } },
      { exam_type: 'Cognitive Assessment', results: { disorientation: 'mild', sleep_wake_cycle: 'normal', interaction: 'slightly_reduced' } },
      { exam_type: 'Body Condition Score', results: { bcs: 4, muscle_mass: 'reduced', interpretation: 'Sarcopenia leve' } },
    ],
  },

  // 3) INTERMEDIÁRIO — 3 condições musculoesqueléticas/metabólicas
  {
    name: 'Rex',
    breed: 'Labrador Retriever',
    age_years: 8,
    weight_kg: 32,
    sex: 'male' as const,
    neutered: true,
    owner_name: 'Maria Silva',
    owner_email: 'maria@example.com',
    notes: 'Cão sênior com rigidez articular, displasia coxofemoral leve e sobrepeso — tríade comum em Labradores.',
    conditions: [
      { condition_name: 'Osteoarthritis', severity: 'moderate', status: 'active', origin: 'vet_diagnosis' },
      { condition_name: 'Hip Dysplasia', severity: 'mild', status: 'active', origin: 'exam_suggested' },
      { condition_name: 'Overweight', severity: 'mild', status: 'active', origin: 'vet_diagnosis' },
    ],
    medications: [
      { medication_name: 'Meloxicam', dosage: '0.1mg/kg', frequency: 'Once daily' },
    ],
    exams: [
      { exam_type: 'X-Ray (Hip)', results: { grade: 3, bilateral: true, degeneration: 'moderate' } },
      { exam_type: 'Complete Blood Count', results: { wbc: 12500, rbc: 7.2, platelets: 280000 } },
      { exam_type: 'Body Condition Score', results: { bcs: 6, ideal: 5, interpretation: 'Sobrepeso leve' } },
    ],
  },

  // 4) COMPLEXO — 3 condições + mielopatia precoce (típico de Pastor Alemão)
  {
    name: 'Thor',
    breed: 'German Shepherd',
    age_years: 7,
    weight_kg: 38,
    sex: 'male' as const,
    neutered: false,
    owner_name: 'Ana Costa',
    owner_email: 'ana@example.com',
    notes: 'Pastor Alemão de trabalho. Tríade clássica da raça: osteoartrite, displasia coxofemoral e mielopatia degenerativa em fase inicial.',
    conditions: [
      { condition_name: 'Osteoarthritis', severity: 'moderate', status: 'active', origin: 'vet_diagnosis' },
      { condition_name: 'Hip Dysplasia', severity: 'moderate', status: 'active', origin: 'exam_suggested' },
      { condition_name: 'Degenerative Myelopathy', severity: 'mild', status: 'monitoring', origin: 'vet_diagnosis' },
    ],
    medications: [
      { medication_name: 'Carprofen', dosage: '2mg/kg', frequency: 'Twice daily' },
    ],
    exams: [
      { exam_type: 'Joint Evaluation', results: { hips: 'moderate dysplasia', elbows: 'normal', gait: 'mild ataxia hindlimbs' } },
      { exam_type: 'Inflammatory Markers', results: { crp: 15.2, reference: '<10', interpretation: 'Mildly elevated' } },
      { exam_type: 'Neurological Examination', results: { proprioception: 'reduced hindlimbs', reflexes: 'normal', interpretation: 'Suspeita de mielopatia degenerativa inicial' } },
    ],
  },

  // 5) MAIS COMPLEXO — 4 condições crônicas + polifarmácia (Cavalier sênior)
  {
    name: 'Luna',
    breed: 'Cavalier King Charles Spaniel',
    age_years: 9,
    weight_kg: 7.5,
    sex: 'female' as const,
    neutered: true,
    owner_name: 'João Pereira',
    owner_email: 'joao@example.com',
    notes: 'Cavalier sênior em estágio C de MMVD. Polifarmácia cardíaca, hipertensão pulmonar secundária, declínio cognitivo e DRC IRIS 2 (parcialmente associada ao uso crônico de furosemida).',
    conditions: [
      { condition_name: 'Degenerative Valve Disease (Myxomatous Mitral Valve Disease)', severity: 'moderate', status: 'active', origin: 'vet_diagnosis' },
      { condition_name: 'Pulmonary Hypertension', severity: 'mild', status: 'active', origin: 'exam_suggested' },
      { condition_name: 'Cognitive Dysfunction Syndrome', severity: 'mild', status: 'monitoring', origin: 'vet_diagnosis' },
      { condition_name: 'Chronic Kidney Disease (IRIS Stage 2)', severity: 'mild', status: 'active', origin: 'exam_suggested' },
    ],
    medications: [
      { medication_name: 'Pimobendan', dosage: '0.25mg/kg', frequency: 'Twice daily' },
      { medication_name: 'Furosemide', dosage: '2mg/kg', frequency: 'Once daily' },
      { medication_name: 'Benazepril', dosage: '0.5mg/kg', frequency: 'Once daily' },
    ],
    exams: [
      { exam_type: 'Echocardiogram', results: { lvedd: 38, lvesd: 26, fs: '32%', murmur_grade: '4/6' } },
      { exam_type: 'Thoracic X-Ray', results: { heart_size: 'enlarged', vhs: 11.5 } },
      { exam_type: 'Renal Panel', results: { creatinine: 2.1, sdma: 22, bun: 38, usg: 1.018, interpretation: 'IRIS Stage 2' } },
      { exam_type: 'Doppler Pressure', results: { systolic_pap: 48, interpretation: 'Hipertensão pulmonar leve a moderada' } },
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
          // Guard-rail: alerta se algum sample usar termo genérico (categoria)
          // em vez de doença específica.
          conditions.forEach((c) =>
            warnIfGenericCategory(c.condition_name, `sample pet "${pet.name}"`),
          );
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
