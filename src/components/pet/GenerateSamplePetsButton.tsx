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

// ───────────────────────────────────────────────────────────────────────────
// Histórico clínico longitudinal: cada pet recebe N consultas (= sua posição
// no ranking de complexidade). A última (`is_latest=true`, marcada pelo
// trigger refresh_pet_consultation_latest) dirige a inferência do
// MedGraphRAG; as anteriores entram como CLINICAL_TRAJECTORY com peso menor.
// ───────────────────────────────────────────────────────────────────────────

type DemoConsultation = {
  daysAgo: number;
  chief_complaint: string;
  clinical_exam?: string;
  weight_kg_at_visit?: number;
  body_condition_score?: number;
  assessment?: string;
  plan?: string;
  conditions?: Array<{ condition_name: string; severity: string; status: string; origin: string }>;
  medications?: Array<{ medication_name: string; dosage: string; frequency: string; status?: string }>;
  exams?: Array<{ exam_type: string; results: Record<string, any>; flags_abnormal?: string[] }>;
  notes?: Array<{ note_type: string; content: string }>;
};

type DemoNutritionItem = {
  raw_brand_text: string;
  raw_product_text: string;
  share_percent: number;
  /**
   * Catalog lookup hint: { brand, name } pointing to an existing pet_food_products row.
   * When set, the generator resolves product_id and persists it (preferred path).
   * If left undefined the item is treated as a free-text supplement / non-catalog item.
   */
  catalog?: { brand: string; name: string };
};

type DemoPet = {
  name: string;
  breed: string;
  age_years: number;
  weight_kg: number;
  sex: 'male' | 'female';
  neutered: boolean;
  owner_name: string;
  owner_email: string;
  notes: string;
  consultations: DemoConsultation[];
  nutrition: {
    diet_type: string;
    daily_amount_g?: number;
    meals_per_day?: number;
    treats_frequency?: string;
    water_intake?: string;
    restrictions?: string[];
    notes?: string;
    items?: DemoNutritionItem[];
    // se preenchido, dieta entrou em vigor a partir da consulta indicada:
    introducedAtConsultationIdx?: number;
  };
};

const SAMPLE_PETS: DemoPet[] = [
  // 1) SIMPLES — 1 consulta (check-up)
  {
    name: 'Buddy',
    breed: 'Beagle',
    age_years: 4,
    weight_kg: 12,
    sex: 'male', neutered: true,
    owner_name: 'Carla Mendes', owner_email: 'carla@example.com',
    notes: 'Adulto jovem em check-up preventivo. Marcadores precoces de estresse oxidativo — janela ideal para protocolo geroprotetor antioxidante.',
    consultations: [
      {
        daysAgo: 7,
        chief_complaint: 'Check-up anual de rotina, tutor sem queixas',
        clinical_exam: 'Animal alerta, hidratado, mucosas normocoradas. ECC 5/9. Linfonodos não reativos. Sem alterações cardiopulmonares.',
        weight_kg_at_visit: 12,
        body_condition_score: 5,
        assessment: 'Pet hígido. Marcadores de estresse oxidativo discretamente elevados em painel preventivo.',
        plan: 'Iniciar protocolo antioxidante geroprotetor leve. Reavaliar painel oxidativo em 6 meses.',
        conditions: [
          { condition_name: 'Oxidative Stress', severity: 'mild', status: 'active', origin: 'exam_suggested' },
        ],
        exams: [
          { exam_type: 'Complete Blood Count', results: { wbc: 9800, rbc: 7.0, platelets: 290000, interpretation: 'normal' } },
          { exam_type: 'Oxidative Stress Panel', results: { '8_ohdg_ng_ml': 6.8, mda_umol_l: 3.2, gsh_gssg_ratio: 4.1, interpretation: 'Estresse oxidativo leve' }, flags_abnormal: ['8_ohdg_ng_ml', 'mda_umol_l'] },
        ],
      },
    ],
    nutrition: {
      diet_type: 'commercial_dry',
      daily_amount_g: 220, meals_per_day: 2, treats_frequency: 'occasional', water_intake: 'normal',
      notes: 'Ração seca super premium para adulto porte médio.',
      items: [{
        raw_brand_text: 'Premier Pet',
        raw_product_text: 'Formula Caes Adultos Racas Medias e Grandes',
        share_percent: 100,
        catalog: { brand: 'Premier Pet', name: 'Formula Caes Adultos Racas Medias e Grandes' },
      }],
    },
  },

  // 2) LEVE-INTERMEDIÁRIO — 2 consultas
  {
    name: 'Max',
    breed: 'Beagle',
    age_years: 9,
    weight_kg: 14,
    sex: 'male', neutered: true,
    owner_name: 'Lucia Oliveira', owner_email: 'lucia@example.com',
    notes: 'Beagle sênior. Sinais cognitivos iniciais e perda de massa muscular age-related — ambas com forte cobertura geroprotetora no KG.',
    consultations: [
      {
        daysAgo: 180,
        chief_complaint: 'Tutor relata episódios de desorientação noturna leves',
        clinical_exam: 'Animal alerta, responsivo. ECC 4/9 — leve perda de massa muscular paravertebral.',
        weight_kg_at_visit: 14.4, body_condition_score: 4,
        assessment: 'Suspeita de síndrome cognitiva canina inicial. Sarcopenia age-related em avaliação.',
        plan: 'Avaliação cognitiva formal e painel geriátrico em 30 dias. Aumentar enriquecimento ambiental.',
        conditions: [
          { condition_name: 'Cognitive Dysfunction Syndrome', severity: 'mild', status: 'active', origin: 'vet_diagnosis' },
        ],
        exams: [
          { exam_type: 'Cognitive Assessment', results: { disorientation: 'mild', sleep_wake_cycle: 'altered', interaction: 'slightly_reduced' } },
        ],
      },
      {
        daysAgo: 14,
        chief_complaint: 'Reavaliação geriátrica — confirmar achados anteriores',
        clinical_exam: 'Massa muscular reduzida confirmada. Cognição estável (sem progressão).',
        weight_kg_at_visit: 14, body_condition_score: 4,
        assessment: 'CDS leve estável. Sarcopenia leve confirmada. Função renal/hepática preservadas.',
        plan: 'Iniciar protocolo geroprotetor (NMN + Omega-3 + antioxidantes). Reavaliar em 90 dias.',
        conditions: [
          { condition_name: 'Sarcopenia', severity: 'mild', status: 'active', origin: 'vet_diagnosis' },
        ],
        exams: [
          { exam_type: 'Geriatric Panel', results: { glucose: 95, bun: 22, creatinine: 1.1, alt: 45, albumin: 3.4 } },
          { exam_type: 'Body Condition Score', results: { bcs: 4, muscle_mass: 'reduced', interpretation: 'Sarcopenia leve' } },
        ],
      },
    ],
    nutrition: {
      diet_type: 'commercial_dry',
      daily_amount_g: 240, meals_per_day: 2, treats_frequency: 'occasional', water_intake: 'normal',
      notes: 'Fórmula sênior super premium com glucosamina.',
      items: [{
        raw_brand_text: 'Royal Canin',
        raw_product_text: 'Maxi Adult 5+',
        share_percent: 100,
        catalog: { brand: 'Royal Canin', name: 'Maxi Adult 5+' },
      }],
    },
  },

  // 3) INTERMEDIÁRIO — 3 consultas
  {
    name: 'Rex',
    breed: 'Labrador Retriever',
    age_years: 8,
    weight_kg: 32,
    sex: 'male', neutered: true,
    owner_name: 'Maria Silva', owner_email: 'maria@example.com',
    notes: 'Labrador sênior com tríade clássica da raça: obesidade, osteoartrite e displasia coxofemoral leve. Trajetória de 3 consultas mostra progressão.',
    consultations: [
      {
        daysAgo: 365,
        chief_complaint: 'Ganho de peso progressivo — tutor solicita orientação nutricional',
        clinical_exam: 'Sobrepeso evidente. ECC 7/9. Sem queixa locomotora.',
        weight_kg_at_visit: 36, body_condition_score: 7,
        assessment: 'Obesidade moderada. Sem sinais articulares no momento.',
        plan: 'Iniciar dieta de controle de peso. Reduzir petiscos. Aumentar exercício gradual.',
        conditions: [
          { condition_name: 'Obesity', severity: 'moderate', status: 'active', origin: 'vet_diagnosis' },
        ],
        exams: [
          { exam_type: 'Body Condition Score', results: { bcs: 7, ideal: 5, interpretation: 'Obesidade moderada (BCS 7/9)' }, flags_abnormal: ['bcs'] },
        ],
      },
      {
        daysAgo: 120,
        chief_complaint: 'Rigidez matinal e dificuldade para subir escadas',
        clinical_exam: 'Dor à manipulação de quadril direito. Crepitação articular bilateral. ECC 6/9 (melhora vs visita anterior).',
        weight_kg_at_visit: 33, body_condition_score: 6,
        assessment: 'Osteoartrite secundária à obesidade — confirmação clínica. Investigar componente displásico.',
        plan: 'Iniciar Meloxicam 0.1mg/kg SID. Solicitar raio-X de quadril.',
        conditions: [
          { condition_name: 'Osteoarthritis', severity: 'moderate', status: 'active', origin: 'vet_diagnosis' },
        ],
        medications: [
          { medication_name: 'Meloxicam', dosage: '0.1mg/kg', frequency: 'Once daily', status: 'active' },
        ],
      },
      {
        daysAgo: 21,
        chief_complaint: 'Reavaliação — controle de dor e exames de imagem',
        clinical_exam: 'Locomoção melhor com Meloxicam. Persistência de rigidez matinal leve.',
        weight_kg_at_visit: 32, body_condition_score: 6,
        assessment: 'Tríade confirmada: obesidade controlada, OA moderada, displasia coxofemoral grau 3 bilateral.',
        plan: 'Manter Meloxicam. Adicionar protocolo nutracêutico (glucosamina, condroitina, ômega-3, curcuma). Fisioterapia.',
        conditions: [
          { condition_name: 'Hip Dysplasia', severity: 'mild', status: 'active', origin: 'exam_suggested' },
        ],
        exams: [
          { exam_type: 'X-Ray (Hip)', results: { grade: 3, bilateral: true, degeneration: 'moderate', interpretation: 'Displasia coxofemoral grau 3 + osteoartrite secundária' }, flags_abnormal: ['grade'] },
          { exam_type: 'Complete Blood Count', results: { wbc: 12500, rbc: 7.2, platelets: 280000 } },
        ],
      },
    ],
    nutrition: {
      diet_type: 'prescription',
      daily_amount_g: 320, meals_per_day: 2, treats_frequency: 'none', water_intake: 'normal',
      restrictions: ['low_calorie', 'joint_support'],
      notes: 'Dieta de controle de peso com suporte articular, iniciada na 1ª consulta há ~12 meses.',
      items: [{
        raw_brand_text: 'Hill\'s',
        raw_product_text: 'Prescription Diet Metabolic + Mobility',
        share_percent: 100,
        catalog: { brand: 'Hill\'s', name: 'Prescription Diet Metabolic + Mobility' },
      }],
      introducedAtConsultationIdx: 0,
    },
  },

  // 4) COMPLEXO — 4 consultas
  {
    name: 'Thor',
    breed: 'German Shepherd',
    age_years: 7,
    weight_kg: 38,
    sex: 'male', neutered: false,
    owner_name: 'Ana Costa', owner_email: 'ana@example.com',
    notes: 'Pastor Alemão de trabalho. Trajetória mostra OA → senescência → mielopatia em monitoramento. Mielopatia degenerativa típica da raça com cobertura nutracêutica limitada no KG (gap conhecido).',
    consultations: [
      {
        daysAgo: 540,
        chief_complaint: 'Avaliação ortopédica preventiva — cão de trabalho',
        clinical_exam: 'Animal atlético. Leve rigidez bilateral em quadril após exercício intenso.',
        weight_kg_at_visit: 39, body_condition_score: 5,
        assessment: 'Osteoartrite incipiente associada à atividade física intensa.',
        plan: 'Suporte articular preventivo. Reavaliar em 6 meses.',
        conditions: [
          { condition_name: 'Osteoarthritis', severity: 'mild', status: 'active', origin: 'vet_diagnosis' },
        ],
        exams: [
          { exam_type: 'Joint Evaluation', results: { hips: 'osteoartrite leve', elbows: 'normal', gait: 'rigidez pós-exercício' } },
        ],
      },
      {
        daysAgo: 270,
        chief_complaint: 'Progressão da rigidez articular e fadiga aumentada',
        clinical_exam: 'OA moderada bilateral. Massa muscular preservada.',
        weight_kg_at_visit: 38.5, body_condition_score: 5,
        assessment: 'OA moderada bilateral. Considerar AINE de longo prazo + suporte articular.',
        plan: 'Iniciar Carprofen 2mg/kg BID. Solicitar perfil bioquímico ampliado e marcadores de inflamação sistêmica (PCR, ferritina).',
        conditions: [
          { condition_name: 'Osteoarthritis', severity: 'moderate', status: 'active', origin: 'vet_diagnosis' },
        ],
        medications: [
          { medication_name: 'Carprofen', dosage: '2mg/kg', frequency: 'Twice daily', status: 'active' },
        ],
      },
      {
        daysAgo: 90,
        chief_complaint: 'Reavaliação clínica e resultados laboratoriais',
        clinical_exam: 'Sem alterações neurológicas no momento.',
        weight_kg_at_visit: 38, body_condition_score: 5,
        assessment: 'Marcadores laboratoriais (PCR elevada, ferritina elevada, perfil oxidativo alterado) compatíveis com envelhecimento acelerado para a idade.',
        plan: 'Manter Carprofen. Encaminhar para avaliação nutracêutica de longevidade.',
        conditions: [
          { condition_name: 'Inflammaging', severity: 'moderate', status: 'active', origin: 'exam_suggested' },
        ],
        exams: [
          { exam_type: 'Extended Inflammatory Panel', results: { crp_mg_l: 18.5, ferritin_ng_ml: 320, '8_ohdg_ng_ml': 9.2, mda_umol_l: 4.8, interpretation: 'Inflamação sistêmica leve a moderada + estresse oxidativo aumentado para a idade' }, flags_abnormal: ['crp_mg_l', 'ferritin_ng_ml', '8_ohdg_ng_ml', 'mda_umol_l'] },
        ],
      },
      {
        daysAgo: 10,
        chief_complaint: 'Tutor nota leve fraqueza em membros pélvicos',
        clinical_exam: 'Propriocepção reduzida em pélvicos. Reflexos preservados. Sem dor à palpação espinhal.',
        weight_kg_at_visit: 38, body_condition_score: 5,
        assessment: 'Suspeita clínica de mielopatia degenerativa em fase inicial — condição clássica de Pastor Alemão.',
        plan: 'Monitoramento neurológico mensal. Manter protocolo atual + suporte neurológico (PEA, vitaminas B).',
        conditions: [
          { condition_name: 'Degenerative Myelopathy', severity: 'mild', status: 'monitoring', origin: 'vet_diagnosis' },
        ],
        exams: [
          { exam_type: 'Neurological Examination', results: { proprioception: 'reduzida em membros pélvicos', reflexes: 'preservados', interpretation: 'Suspeita de mielopatia degenerativa em fase inicial' }, flags_abnormal: ['proprioception'] },
        ],
      },
    ],
    nutrition: {
      diet_type: 'mixed_commercial',
      daily_amount_g: 420, meals_per_day: 2, treats_frequency: 'daily', water_intake: 'high',
      restrictions: ['joint_support', 'antioxidant_rich'],
      notes: 'Mistura de ração super premium para grandes raças + suplemento natural ômega-3 (óleo de salmão).',
      items: [
        { raw_brand_text: 'Pro Plan', raw_product_text: 'Adult Large Breed Chicken & Rice', share_percent: 80, catalog: { brand: 'Pro Plan', name: 'Adult Large Breed Chicken & Rice' } },
        { raw_brand_text: 'Suplemento natural', raw_product_text: 'Óleo de salmão prensado a frio', share_percent: 20 },
      ],
    },
  },

  // 5) MAIS COMPLEXO — 5 consultas (Cavalier sênior multissistêmico)
  {
    name: 'Luna',
    breed: 'Cavalier King Charles Spaniel',
    age_years: 9,
    weight_kg: 7.5,
    sex: 'female', neutered: true,
    owner_name: 'João Pereira', owner_email: 'joao@example.com',
    notes: 'Cavalier sênior — caso multissistêmico com 5 consultas mostrando progressão MMVD B2 → C, polifarmácia, DRC IRIS 2 secundária à furosemida e HP secundária. Troca de ração para fórmula renal na 4ª consulta.',
    consultations: [
      {
        daysAgo: 730,
        chief_complaint: 'Sopro cardíaco detectado em check-up de rotina',
        clinical_exam: 'Sopro sistólico grau 3/6 em foco mitral. Sem sinais de insuficiência.',
        weight_kg_at_visit: 7.6, body_condition_score: 5,
        assessment: 'MMVD estágio B1 (assintomático sem remodelamento).',
        plan: 'Monitoramento ecocardiográfico anual. Sem terapia farmacológica indicada.',
        conditions: [
          { condition_name: 'Myxomatous Mitral Valve Disease', severity: 'mild', status: 'active', origin: 'vet_diagnosis' },
        ],
        exams: [
          { exam_type: 'Echocardiogram', results: { lvedd: 30, lvesd: 18, fs: '40%', murmur_grade: '3/6', stage: 'B1' } },
        ],
      },
      {
        daysAgo: 450,
        chief_complaint: 'Reavaliação cardiológica anual',
        clinical_exam: 'Sopro 4/6. Sem dispneia. Sem tosse.',
        weight_kg_at_visit: 7.7, body_condition_score: 5,
        assessment: 'Progressão para MMVD B2 — remodelamento cardíaco identificado. Indicação de Pimobendan conforme EPIC.',
        plan: 'Iniciar Pimobendan 0.25mg/kg BID. Reavaliação em 6 meses.',
        conditions: [],
        medications: [
          { medication_name: 'Pimobendan', dosage: '0.25mg/kg', frequency: 'Twice daily', status: 'active' },
        ],
        exams: [
          { exam_type: 'Echocardiogram', results: { lvedd: 35, lvesd: 22, fs: '36%', murmur_grade: '4/6', stage: 'B2' }, flags_abnormal: ['lvedd', 'stage'] },
          { exam_type: 'Thoracic X-Ray', results: { heart_size: 'mildly enlarged', vhs: 10.8 } },
        ],
      },
      {
        daysAgo: 240,
        chief_complaint: 'Tosse noturna e cansaço fácil há 2 semanas',
        clinical_exam: 'Crepitações pulmonares basais. Taquipneia em repouso (40 mpm).',
        weight_kg_at_visit: 7.4, body_condition_score: 5,
        assessment: 'Progressão para MMVD estágio C — primeiro episódio de descompensação congestiva.',
        plan: 'Adicionar Furosemida 2mg/kg SID e Benazepril 0.5mg/kg SID. Reavaliar função renal em 30 dias.',
        conditions: [],
        medications: [
          { medication_name: 'Furosemide', dosage: '2mg/kg', frequency: 'Once daily', status: 'active' },
          { medication_name: 'Benazepril', dosage: '0.5mg/kg', frequency: 'Once daily', status: 'active' },
        ],
        exams: [
          { exam_type: 'Thoracic X-Ray', results: { heart_size: 'enlarged', vhs: 11.5, pulmonary_pattern: 'edema intersticial', interpretation: 'Insuficiência cardíaca congestiva' }, flags_abnormal: ['vhs', 'pulmonary_pattern'] },
        ],
      },
      {
        daysAgo: 90,
        chief_complaint: 'Reavaliação — função renal pós-diurético',
        clinical_exam: 'Cardiologicamente compensada. Tutor nota poliúria.',
        weight_kg_at_visit: 7.2, body_condition_score: 5,
        assessment: 'DRC IRIS 2 — parcialmente associada à furosemida crônica. Necessária ração renal.',
        plan: 'Trocar dieta para fórmula renal. Manter cardioterapia. Reavaliar SDMA em 60 dias.',
        conditions: [
          { condition_name: 'Chronic Kidney Disease', severity: 'mild', status: 'active', origin: 'exam_suggested' },
        ],
        exams: [
          { exam_type: 'Renal Panel', results: { creatinine: 2.1, sdma: 22, bun: 38, usg: 1.018, interpretation: 'IRIS Stage 2' }, flags_abnormal: ['creatinine', 'sdma', 'bun', 'usg'] },
        ],
      },
      {
        daysAgo: 14,
        chief_complaint: 'Avaliação geriátrica integrada — cognição e pressão pulmonar',
        clinical_exam: 'Episódios ocasionais de desorientação ao acordar. Doppler cardíaco mostra HP secundária leve a moderada.',
        weight_kg_at_visit: 7.5, body_condition_score: 5,
        assessment: 'CDS leve em monitoramento + HP pulmonar secundária ao MMVD. Caso multissistêmico complexo.',
        plan: 'Adicionar SAMe (suporte hepático), ômega-3 e CoQ10 — compatíveis com cardioterapia. Encaminhar para avaliação nutracêutica de longevidade. Evitar compostos com efeito hipotensor adicional.',
        conditions: [
          { condition_name: 'Cognitive Dysfunction Syndrome', severity: 'mild', status: 'monitoring', origin: 'vet_diagnosis' },
          { condition_name: 'Pulmonary Hypertension', severity: 'mild', status: 'active', origin: 'exam_suggested' },
        ],
        exams: [
          { exam_type: 'Doppler Pressure', results: { systolic_pap: 48, interpretation: 'Hipertensão pulmonar leve a moderada secundária ao MMVD' }, flags_abnormal: ['systolic_pap'] },
        ],
      },
    ],
    nutrition: {
      diet_type: 'prescription',
      daily_amount_g: 110, meals_per_day: 3, treats_frequency: 'occasional', water_intake: 'high',
      restrictions: ['renal', 'low_phosphorus', 'low_sodium'],
      notes: 'Dieta renal iniciada na 4ª consulta após diagnóstico de DRC IRIS 2.',
      items: [{
        raw_brand_text: 'Royal Canin',
        raw_product_text: 'Veterinary Diet Renal Small Dog',
        share_percent: 100,
        catalog: { brand: 'Royal Canin', name: 'Veterinary Diet Renal Small Dog' },
      }],
      introducedAtConsultationIdx: 3, // 4ª consulta (índice 3)
    },
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
        const { consultations, nutrition, ...profileData } = pet;

        // 1) Pet profile
        const { data: profile, error: profileError } = await supabase
          .from('pet_profiles')
          .insert({
            ...profileData,
            species: 'canine',
            created_by: userId,
            veterinarian_id: userId,
            photo_url: BREED_PHOTOS[pet.breed] || null,
            is_demo: true,
          } as any)
          .select()
          .single();

        if (profileError) throw profileError;

        // 2) Inserir consultas em ordem cronológica (mais antiga → mais recente)
        // O trigger refresh_pet_consultation_latest marcará a última como is_latest.
        const sorted = [...consultations].sort((a, b) => b.daysAgo - a.daysAgo);
        const consultationIds: string[] = [];

        for (const c of sorted) {
          const date = new Date(Date.now() - c.daysAgo * 24 * 60 * 60 * 1000)
            .toISOString().split('T')[0];

          // Deterministic machine interpretation for demo: derived from
          // existing assessment + linked conditions. Real visits get this
          // populated by the extract-pet-clinical-data edge function.
          const canonicalConditions = (c.conditions ?? []).map((cond) => ({
            name: cond.condition_name,
            stage: (cond as any).severity ?? null,
            confidence: 0.85,
          }));
          const tagSeeds: string[] = [];
          (c.conditions ?? []).forEach((cond) => {
            tagSeeds.push(
              cond.condition_name.toLowerCase().replace(/\s+/g, '_'),
            );
            if ((cond as any).severity) tagSeeds.push(String((cond as any).severity).toLowerCase());
          });
          if (/check[-\s]?up|rotina|preventiv/i.test(c.chief_complaint)) tagSeeds.push('check_up');
          if (/dor|rigidez|fraqueza|tosse|cansa|fadiga/i.test(c.chief_complaint)) tagSeeds.push('sintomatico');
          if (/reavaliação|controle|follow/i.test(c.chief_complaint)) tagSeeds.push('reavaliacao');
          const tags = Array.from(new Set(tagSeeds)).slice(0, 8);
          const machine_summary = c.assessment
            ? c.assessment.split(/\.\s/)[0] + (c.assessment.includes('.') ? '.' : '')
            : null;
          const assessment_interpretation = {
            canonical_conditions: canonicalConditions,
            systems_affected: [],
            ontology_refs: [],
          };

          const { data: consult, error: consultError } = await (supabase as any)
            .from('pet_consultations')
            .insert({
              pet_id: profile.id,
              consultation_date: date,
              veterinarian_id: userId,
              chief_complaint: c.chief_complaint,
              clinical_exam: c.clinical_exam,
              weight_kg_at_visit: c.weight_kg_at_visit,
              body_condition_score: c.body_condition_score,
              assessment: c.assessment,
              plan: c.plan,
              tags,
              machine_summary,
              assessment_interpretation,
              created_by: userId,
            })
            .select('id')
            .single();
          if (consultError) throw consultError;
          consultationIds.push(consult.id);

          // Conditions desta visita
          if (c.conditions?.length) {
            c.conditions.forEach((cond) => warnIfGenericCategory(cond.condition_name, `sample pet "${pet.name}"`));
            const { error: condError } = await supabase
              .from('pet_conditions')
              .insert(c.conditions.map(cond => ({ ...cond, pet_id: profile.id, consultation_id: consult.id } as any)));
            if (condError) throw condError;
          }

          // Medications desta visita
          if (c.medications?.length) {
            const { error: medError } = await supabase
              .from('pet_medications')
              .insert(c.medications.map(m => ({ ...m, pet_id: profile.id, consultation_id: consult.id } as any)));
            if (medError) throw medError;
          }

          // Exams desta visita (já marcados como extraídos)
          if (c.exams?.length) {
            const { error: examError } = await (supabase as any)
              .from('pet_exams')
              .insert(c.exams.map(e => ({
                pet_id: profile.id,
                consultation_id: consult.id,
                exam_type: e.exam_type,
                results: e.results,
                exam_date: date,
                extraction_status: 'done',
                raw_extracted: e.results,
                flags_abnormal: e.flags_abnormal || null,
              })));
            if (examError) throw examError;
          }

          // Notas clínicas desta visita
          if (c.notes?.length) {
            const { error: noteError } = await (supabase as any)
              .from('pet_clinical_notes')
              .insert(c.notes.map(n => ({
                pet_id: profile.id,
                consultation_id: consult.id,
                note_type: n.note_type,
                content: n.content,
                created_by: userId,
              })));
            if (noteError) throw noteError;
          }
        }

        // 3) Dieta atual (1 registro vigente, ligado à consulta de introdução se aplicável)
        if (nutrition) {
          const introIdx = nutrition.introducedAtConsultationIdx ?? sorted.length - 1;
          const introConsultId = consultationIds[Math.min(introIdx, consultationIds.length - 1)];
          const introConsultDate = sorted[Math.min(introIdx, sorted.length - 1)].daysAgo;
          const startedAt = new Date(Date.now() - introConsultDate * 24 * 60 * 60 * 1000)
            .toISOString().split('T')[0];

          const { data: nut, error: nutError } = await (supabase as any)
            .from('pet_nutrition')
            .insert({
              pet_id: profile.id,
              consultation_id: introConsultId,
              diet_type: nutrition.diet_type,
              daily_amount_g: nutrition.daily_amount_g,
              meals_per_day: nutrition.meals_per_day,
              treats_frequency: nutrition.treats_frequency,
              water_intake: nutrition.water_intake,
              restrictions: nutrition.restrictions,
              notes: nutrition.notes,
              started_at: startedAt,
              is_current: true,
              created_by: userId,
            })
            .select('id')
            .single();
          if (nutError) throw nutError;

          if (nutrition.items?.length) {
            // Resolve product_id from catalog hint (brand+name) when present
            const itemsWithIds = await Promise.all(nutrition.items.map(async (i) => {
              let productId: string | null = null;
              if (i.catalog) {
                const { data: brand } = await (supabase as any)
                  .from('pet_food_brands').select('id').eq('name', i.catalog.brand).maybeSingle();
                if (brand?.id) {
                  const { data: prod } = await (supabase as any)
                    .from('pet_food_products').select('id')
                    .eq('brand_id', brand.id).eq('name', i.catalog.name).maybeSingle();
                  productId = prod?.id ?? null;
                }
              }
              return { i, productId };
            }));
            const { error: itemErr } = await (supabase as any)
              .from('pet_nutrition_items')
              .insert(itemsWithIds.map(({ i, productId }) => ({
                nutrition_id: nut.id,
                product_id: productId,
                raw_brand_text: i.raw_brand_text,
                raw_product_text: i.raw_product_text,
                share_percent: i.share_percent,
              })));
            if (itemErr) throw itemErr;
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ['pet-profiles'] });

      const totalConsultations = SAMPLE_PETS.reduce((s, p) => s + p.consultations.length, 0);
      toast({
        title: t('petRegistration.generator.success'),
        description: t('petRegistration.generator.successDescWithHistory', {
          count: SAMPLE_PETS.length,
          consultations: totalConsultations,
          defaultValue: '{{count}} pets demo criados com {{consultations}} consultas históricas e dietas atuais.',
        }),
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
    <Button variant="outline" onClick={handleGenerate} disabled={isGenerating} className="gap-2">
      {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
      {isGenerating ? t('petRegistration.generator.generating') : t('petRegistration.generator.button')}
    </Button>
  );
};

export default GenerateSamplePetsButton;
