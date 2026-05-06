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
  // CRITÉRIO ADICIONAL: TODA condição usada aqui DEVE ter ≥15 compostos
  // com triplets aprovados no VetGraphRAG (layer_4_outcome). Isso garante
  // que o Gêmeo Digital (project-pet-trajectory) opere em modo
  // `ai_kg_grounded` (não fallback heurístico) e mostre years_gained real.
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
    notes: 'Cão adulto jovem. Check-up preventivo identificou marcadores precoces de estresse oxidativo (8-OHdG e MDA elevados) — janela ideal para protocolo geroprotetor antioxidante.',
    conditions: [
      { condition_name: 'Oxidative Stress', severity: 'mild', status: 'active', origin: 'exam_suggested' },
    ],
    medications: [],
    exams: [
      { exam_type: 'Complete Blood Count', results: { wbc: 9800, rbc: 7.0, platelets: 290000, interpretation: 'normal' } },
      { exam_type: 'Oxidative Stress Panel', results: { '8_ohdg_ng_ml': 6.8, mda_umol_l: 3.2, gsh_gssg_ratio: 4.1, interpretation: 'Estresse oxidativo leve — antioxidante endógeno reduzido' } },
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
    notes: 'Beagle sênior. Sinais cognitivos iniciais (desorientação leve) e perda de massa muscular age-related — ambas com forte cobertura geroprotetora no KG.',
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
    notes: 'Labrador sênior com tríade metabólica clássica da raça: osteoartrite, obesidade e estresse oxidativo sistêmico — todas com forte resposta a protocolos nutracêuticos.',
    conditions: [
      { condition_name: 'Osteoarthritis', severity: 'moderate', status: 'active', origin: 'vet_diagnosis' },
      { condition_name: 'Obesity', severity: 'moderate', status: 'active', origin: 'vet_diagnosis' },
      { condition_name: 'Oxidative Stress', severity: 'moderate', status: 'active', origin: 'exam_suggested' },
    ],
    medications: [
      { medication_name: 'Meloxicam', dosage: '0.1mg/kg', frequency: 'Once daily' },
    ],
    exams: [
      { exam_type: 'X-Ray (Joints)', results: { grade: 3, bilateral: true, degeneration: 'moderate', interpretation: 'Osteoartrite bilateral moderada' } },
      { exam_type: 'Complete Blood Count', results: { wbc: 12500, rbc: 7.2, platelets: 280000 } },
      { exam_type: 'Body Condition Score', results: { bcs: 7, ideal: 5, interpretation: 'Obesidade moderada (BCS 7/9)' } },
      { exam_type: 'Oxidative Stress Panel', results: { '8_ohdg_ng_ml': 9.4, mda_umol_l: 5.1, interpretation: 'Estresse oxidativo moderado' } },
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
    notes: 'Pastor Alemão de trabalho. Eixo inflamatório-senescente: osteoartrite ativa, neuroinflamação subclínica e marcadores de senescência celular elevados — perfil ideal para protocolo senolítico + anti-inflamatório.',
    conditions: [
      { condition_name: 'Osteoarthritis', severity: 'moderate', status: 'active', origin: 'vet_diagnosis' },
      { condition_name: 'Neuroinflammation', severity: 'mild', status: 'active', origin: 'exam_suggested' },
      { condition_name: 'Cellular Senescence', severity: 'moderate', status: 'active', origin: 'exam_suggested' },
    ],
    medications: [
      { medication_name: 'Carprofen', dosage: '2mg/kg', frequency: 'Twice daily' },
    ],
    exams: [
      { exam_type: 'Joint Evaluation', results: { hips: 'osteoartrite moderada', elbows: 'normal', gait: 'rigidez matinal' } },
      { exam_type: 'Inflammatory Markers', results: { crp: 15.2, il6_pg_ml: 8.4, tnf_alpha: 'elevado', reference_crp: '<10', interpretation: 'Inflamação sistêmica de baixo grau (inflammaging)' } },
      { exam_type: 'Senescence Biomarkers', results: { p16_ink4a: 'elevado', sasp_panel: 'positivo', telomere_length: 'reduzido para idade', interpretation: 'Carga senescente compatível com envelhecimento acelerado' } },
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
    notes: 'Cavalier sênior em estágio C de MMVD. Polifarmácia cardíaca, declínio cognitivo, DRC IRIS 2 (parcialmente associada à furosemida crônica) e doença cardiovascular sistêmica — caso multissistêmico complexo com forte cobertura no KG.',
    conditions: [
      { condition_name: 'Myxomatous Mitral Valve Disease', severity: 'moderate', status: 'active', origin: 'vet_diagnosis' },
      { condition_name: 'Cardiovascular Disease', severity: 'moderate', status: 'active', origin: 'exam_suggested' },
      { condition_name: 'Cognitive Dysfunction Syndrome', severity: 'mild', status: 'monitoring', origin: 'vet_diagnosis' },
      { condition_name: 'Chronic Kidney Disease', severity: 'mild', status: 'active', origin: 'exam_suggested' },
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
      { exam_type: 'Cardiovascular Panel', results: { nt_probnp: 1850, troponin_i: 0.18, interpretation: 'Sobrecarga cardíaca compatível com MMVD estágio C' } },
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
