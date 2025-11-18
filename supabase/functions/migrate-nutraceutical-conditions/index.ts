import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CategorizationResult {
  category: string;
  category_en: string;
  severity: string;
}

const categorizeCondition = (conditionName: string): CategorizationResult => {
  const name = conditionName.toLowerCase();
  
  if (name.includes('artrite') || name.includes('articular') || name.includes('cartilagem') || 
      name.includes('mobilidade') || name.includes('osteo') || name.includes('arthritis')) {
    return { category: 'Musculoesquelética', category_en: 'Musculoskeletal', severity: 'high' };
  }
  
  if (name.includes('cardiovascular') || name.includes('cardíaco') || name.includes('cardiomiopatia') || 
      name.includes('aterosclerose') || name.includes('cardiac') || name.includes('cardiomyopathy')) {
    return { category: 'Cardiovascular', category_en: 'Cardiovascular', severity: 'high' };
  }
  
  if (name.includes('renal') || name.includes('nefro') || name.includes('proteinúria') ||
      name.includes('kidney') || name.includes('nephro')) {
    return { category: 'Renal', category_en: 'Renal', severity: 'high' };
  }
  
  if (name.includes('imun') || name.includes('infecç') || name.includes('immune') ||
      name.includes('infection')) {
    return { category: 'Imunológica', category_en: 'Immunological', severity: 'medium' };
  }
  
  if (name.includes('intestinal') || name.includes('digestiv') || name.includes('disbiose') ||
      name.includes('gastrointestinal')) {
    return { category: 'Digestiva', category_en: 'Digestive', severity: 'medium' };
  }
  
  if (name.includes('hepát') || name.includes('fígado') || name.includes('hepat') ||
      name.includes('liver')) {
    return { category: 'Hepática', category_en: 'Hepatic', severity: 'high' };
  }
  
  if (name.includes('dermat') || name.includes('pele') || name.includes('alérgica') ||
      name.includes('skin') || name.includes('allergic')) {
    return { category: 'Dermatológica', category_en: 'Dermatological', severity: 'medium' };
  }
  
  if (name.includes('fadiga') || name.includes('energia') || name.includes('metabolismo') || 
      name.includes('nutricional') || name.includes('fatigue') || name.includes('energy')) {
    return { category: 'Metabólica', category_en: 'Metabolic', severity: 'low' };
  }
  
  if (name.includes('câncer') || name.includes('tumor') || name.includes('cancer')) {
    return { category: 'Oncológica', category_en: 'Oncological', severity: 'critical' };
  }
  
  if (name.includes('ocular') || name.includes('olho') || name.includes('eye')) {
    return { category: 'Oftalmológica', category_en: 'Ophthalmic', severity: 'medium' };
  }
  
  if (name.includes('respiratór') || name.includes('alergia') || name.includes('respiratory')) {
    return { category: 'Respiratória', category_en: 'Respiratory', severity: 'medium' };
  }
  
  if (name.includes('oxidativ') || name.includes('antioxidante') || name.includes('oxidative')) {
    return { category: 'Oxidativa', category_en: 'Oxidative', severity: 'medium' };
  }
  
  if (name.includes('envelhecimento') || name.includes('telômero') || name.includes('epigenética') || 
      name.includes('longevidade') || name.includes('aging') || name.includes('telomere')) {
    return { category: 'Envelhecimento', category_en: 'Aging', severity: 'high' };
  }
  
  if (name.includes('inflam') || name.includes('inflamm')) {
    return { category: 'Inflamatória', category_en: 'Inflammatory', severity: 'high' };
  }
  
  return { category: 'Geral', category_en: 'General', severity: 'medium' };
};

// Dados mockados de condições por nutracêutico
const NUTRACEUTICAL_CONDITIONS_MAP: Record<string, {
  prevention: Array<{ name: string; name_en?: string; efficacyScore: number }>;
  treatment: Array<{ name: string; name_en?: string; efficacyScore: number }>;
  support: Array<{ name: string; name_en?: string; efficacyScore: number }>;
}> = {
  'Glucosamina': {
    prevention: [
      { name: 'Osteoartrite canina', name_en: 'Canine Osteoarthritis', efficacyScore: 3.2 },
      { name: 'Problemas articulares', name_en: 'Joint Problems', efficacyScore: 3.8 },
      { name: 'Degeneração cartilaginosa', name_en: 'Cartilage Degeneration', efficacyScore: 3.5 }
    ],
    treatment: [
      { name: 'Osteoartrite canina', name_en: 'Canine Osteoarthritis', efficacyScore: 4.2 },
      { name: 'Problemas articulares', name_en: 'Joint Problems', efficacyScore: 4.0 },
      { name: 'Dor articular', name_en: 'Joint Pain', efficacyScore: 3.9 }
    ],
    support: [
      { name: 'Osteoartrite canina', name_en: 'Canine Osteoarthritis', efficacyScore: 3.7 },
      { name: 'Mobilidade articular', name_en: 'Joint Mobility', efficacyScore: 4.0 },
      { name: 'Saúde das cartilagens', name_en: 'Cartilage Health', efficacyScore: 3.8 }
    ]
  },
  'Condroitina': {
    prevention: [
      { name: 'Osteoartrite canina', name_en: 'Canine Osteoarthritis', efficacyScore: 3.5 },
      { name: 'Degeneração articular', name_en: 'Joint Degeneration', efficacyScore: 3.7 },
      { name: 'Problemas articulares', name_en: 'Joint Problems', efficacyScore: 3.4 }
    ],
    treatment: [
      { name: 'Osteoartrite canina', name_en: 'Canine Osteoarthritis', efficacyScore: 4.1 },
      { name: 'Degeneração articular', name_en: 'Joint Degeneration', efficacyScore: 3.9 },
      { name: 'Dor articular', name_en: 'Joint Pain', efficacyScore: 3.8 }
    ],
    support: [
      { name: 'Osteoartrite canina', name_en: 'Canine Osteoarthritis', efficacyScore: 3.6 },
      { name: 'Estrutura cartilaginosa', name_en: 'Cartilage Structure', efficacyScore: 3.5 },
      { name: 'Saúde articular', name_en: 'Joint Health', efficacyScore: 3.7 }
    ]
  },
  'L-carnitina': {
    prevention: [
      { name: 'Problemas cardíacos', name_en: 'Heart Problems', efficacyScore: 3.8 },
      { name: 'Cardiomiopatia', name_en: 'Cardiomyopathy', efficacyScore: 3.5 },
      { name: 'Função cardíaca', name_en: 'Cardiac Function', efficacyScore: 3.6 }
    ],
    treatment: [
      { name: 'Cardiomiopatia dilatada', name_en: 'Dilated Cardiomyopathy', efficacyScore: 4.3 },
      { name: 'Função cardíaca', name_en: 'Cardiac Function', efficacyScore: 4.0 },
      { name: 'Insuficiência cardíaca', name_en: 'Heart Failure', efficacyScore: 3.9 }
    ],
    support: [
      { name: 'Função cardíaca', name_en: 'Cardiac Function', efficacyScore: 4.0 },
      { name: 'Metabolismo energético', name_en: 'Energy Metabolism', efficacyScore: 3.8 },
      { name: 'Saúde cardiovascular', name_en: 'Cardiovascular Health', efficacyScore: 3.7 }
    ]
  },
  'Equinácea': {
    prevention: [
      { name: 'Infecções respiratórias', name_en: 'Respiratory Infections', efficacyScore: 3.8 },
      { name: 'Infecções recorrentes', name_en: 'Recurrent Infections', efficacyScore: 3.5 },
      { name: 'Sistema imunológico enfraquecido', name_en: 'Weakened Immune System', efficacyScore: 3.7 }
    ],
    treatment: [
      { name: 'Infecções respiratórias', name_en: 'Respiratory Infections', efficacyScore: 4.2 },
      { name: 'Infecções recorrentes', name_en: 'Recurrent Infections', efficacyScore: 3.9 }
    ],
    support: [
      { name: 'Sistema imunológico', name_en: 'Immune System', efficacyScore: 4.0 }
    ]
  },
  'Quitosana': {
    prevention: [
      { name: 'Obesidade canina', name_en: 'Canine Obesity', efficacyScore: 3.5 },
      { name: 'Sobrepeso', name_en: 'Overweight', efficacyScore: 3.6 }
    ],
    treatment: [
      { name: 'Obesidade canina', name_en: 'Canine Obesity', efficacyScore: 3.8 },
      { name: 'Hipercolesterolemia', name_en: 'Hypercholesterolemia', efficacyScore: 3.7 }
    ],
    support: [
      { name: 'Controle de peso', name_en: 'Weight Control', efficacyScore: 3.9 },
      { name: 'Saúde digestiva', name_en: 'Digestive Health', efficacyScore: 3.5 }
    ]
  },
  'Coenzima Q10': {
    prevention: [
      { name: 'Problemas cardíacos', name_en: 'Heart Problems', efficacyScore: 3.9 },
      { name: 'Estresse oxidativo', name_en: 'Oxidative Stress', efficacyScore: 3.7 }
    ],
    treatment: [
      { name: 'Cardiomiopatia dilatada', name_en: 'Dilated Cardiomyopathy', efficacyScore: 4.1 },
      { name: 'Insuficiência cardíaca', name_en: 'Heart Failure', efficacyScore: 4.0 },
      { name: 'Função cardíaca', name_en: 'Cardiac Function', efficacyScore: 3.9 }
    ],
    support: [
      { name: 'Função cardíaca', name_en: 'Cardiac Function', efficacyScore: 4.0 },
      { name: 'Energia celular', name_en: 'Cellular Energy', efficacyScore: 3.8 },
      { name: 'Saúde cardiovascular', name_en: 'Cardiovascular Health', efficacyScore: 3.9 }
    ]
  },
  'EPA (Ácido eicosapentaenoico)': {
    prevention: [
      { name: 'Inflamação crônica', name_en: 'Chronic Inflammation', efficacyScore: 3.9 },
      { name: 'Problemas cardiovasculares', name_en: 'Cardiovascular Problems', efficacyScore: 3.7 },
      { name: 'Problemas articulares', name_en: 'Joint Problems', efficacyScore: 3.6 }
    ],
    treatment: [
      { name: 'Inflamação crônica', name_en: 'Chronic Inflammation', efficacyScore: 4.3 },
      { name: 'Osteoartrite canina', name_en: 'Canine Osteoarthritis', efficacyScore: 4.1 },
      { name: 'Dermatite atópica', name_en: 'Atopic Dermatitis', efficacyScore: 4.0 }
    ],
    support: [
      { name: 'Saúde cardiovascular', name_en: 'Cardiovascular Health', efficacyScore: 4.0 },
      { name: 'Função cerebral', name_en: 'Brain Function', efficacyScore: 3.8 },
      { name: 'Saúde da pele', name_en: 'Skin Health', efficacyScore: 3.9 }
    ]
  },
  'Prebióticos': {
    prevention: [
      { name: 'Disbiose intestinal', name_en: 'Gut Dysbiosis', efficacyScore: 3.8 },
      { name: 'Problemas digestivos', name_en: 'Digestive Problems', efficacyScore: 3.6 },
      { name: 'Sistema imunológico enfraquecido', name_en: 'Weakened Immune System', efficacyScore: 3.5 }
    ],
    treatment: [
      { name: 'Disbiose intestinal', name_en: 'Gut Dysbiosis', efficacyScore: 4.1 },
      { name: 'Diarreia crônica', name_en: 'Chronic Diarrhea', efficacyScore: 3.9 },
      { name: 'Constipação', name_en: 'Constipation', efficacyScore: 3.7 }
    ],
    support: [
      { name: 'Saúde digestiva', name_en: 'Digestive Health', efficacyScore: 4.0 },
      { name: 'Microbiota intestinal', name_en: 'Gut Microbiota', efficacyScore: 4.2 },
      { name: 'Sistema imunológico', name_en: 'Immune System', efficacyScore: 3.8 }
    ]
  },
  'Vitamina E': {
    prevention: [
      { name: 'Estresse oxidativo', name_en: 'Oxidative Stress', efficacyScore: 3.9 },
      { name: 'Problemas de pele', name_en: 'Skin Problems', efficacyScore: 3.6 },
      { name: 'Imunodeficiência', name_en: 'Immunodeficiency', efficacyScore: 3.5 }
    ],
    treatment: [
      { name: 'Dermatite', name_en: 'Dermatitis', efficacyScore: 3.8 },
      { name: 'Estresse oxidativo', name_en: 'Oxidative Stress', efficacyScore: 4.0 },
      { name: 'Problemas musculares', name_en: 'Muscle Problems', efficacyScore: 3.7 }
    ],
    support: [
      { name: 'Saúde da pele', name_en: 'Skin Health', efficacyScore: 3.9 },
      { name: 'Sistema imunológico', name_en: 'Immune System', efficacyScore: 3.7 },
      { name: 'Função celular', name_en: 'Cellular Function', efficacyScore: 3.8 }
    ]
  },
  'Silimarina': {
    prevention: [
      { name: 'Danos hepáticos', name_en: 'Liver Damage', efficacyScore: 3.9 }
    ],
    treatment: [
      { name: 'Hepatopatias crônicas e agudas', name_en: 'Chronic and Acute Liver Disease', efficacyScore: 4.1 }
    ],
    support: [
      { name: 'Função hepática', name_en: 'Liver Function', efficacyScore: 3.8 }
    ]
  },
  'Própolis Verde': {
    prevention: [
      { name: 'Infecções respiratórias', name_en: 'Respiratory Infections', efficacyScore: 2.5 },
      { name: 'Alergias sazonais', name_en: 'Seasonal Allergies', efficacyScore: 2.2 }
    ],
    treatment: [
      { name: 'Infecções bacterianas leves', name_en: 'Mild Bacterial Infections', efficacyScore: 2.5 }
    ],
    support: [
      { name: 'Sistema imune', name_en: 'Immune System', efficacyScore: 3.0 }
    ]
  },
  'Pólen de Abelha': {
    prevention: [
      { name: 'Deficiência nutricional', name_en: 'Nutritional Deficiency', efficacyScore: 1.8 }
    ],
    treatment: [
      { name: 'Fadiga', name_en: 'Fatigue', efficacyScore: 2.0 }
    ],
    support: [
      { name: 'Metabolismo', name_en: 'Metabolism', efficacyScore: 2.2 },
      { name: 'Energia', name_en: 'Energy', efficacyScore: 2.5 }
    ]
  },
  'Allicina': {
    prevention: [
      { name: 'Cardiovascular', name_en: 'Cardiovascular Disease', efficacyScore: 3.2 },
      { name: 'Infecções', name_en: 'Infections', efficacyScore: 2.8 }
    ],
    treatment: [],
    support: [
      { name: 'Saúde Cardiovascular', name_en: 'Cardiovascular Health', efficacyScore: 3.0 },
      { name: 'Sistema imunológico', name_en: 'Immune System', efficacyScore: 2.5 }
    ]
  },
  'Apigenina': {
    prevention: [
      { name: 'Câncer', name_en: 'Cancer', efficacyScore: 3.5 },
      { name: 'Inflamação', name_en: 'Inflammation', efficacyScore: 3.2 }
    ],
    treatment: [],
    support: [
      { name: 'Saúde Óssea', name_en: 'Bone Health', efficacyScore: 3.0 },
      { name: 'Câncer Canino', name_en: 'Canine Cancer', efficacyScore: 3.0 },
      { name: 'Sistema imunológico', name_en: 'Immune System', efficacyScore: 2.8 }
    ]
  },
  'Beta-Glucanas': {
    prevention: [
      { name: 'Infecções', name_en: 'Infections', efficacyScore: 3.8 },
      { name: 'Câncer', name_en: 'Cancer', efficacyScore: 3.2 }
    ],
    treatment: [],
    support: [
      { name: 'Suporte Imunológico', name_en: 'Immune Support', efficacyScore: 3.0 },
      { name: 'Saúde intestinal', name_en: 'Gut Health', efficacyScore: 3.2 },
      { name: 'Resposta imune', name_en: 'Immune Response', efficacyScore: 3.8 }
    ]
  },
  'Ácido Alfa-Lipóico': {
    prevention: [
      { name: 'Anti-envelhecimento', name_en: 'Anti-aging', efficacyScore: 4.0 },
      { name: 'Estresse oxidativo', name_en: 'Oxidative Stress', efficacyScore: 3.8 }
    ],
    treatment: [
      { name: 'Artrite', name_en: 'Arthritis', efficacyScore: 1.0 },
      { name: 'Cardiomiopatia dilatada', name_en: 'Dilated Cardiomyopathy', efficacyScore: 3.0 }
    ],
    support: [
      { name: 'Estresse Oxidativo', name_en: 'Oxidative Stress', efficacyScore: 3.0 },
      { name: 'Função antioxidante', name_en: 'Antioxidant Function', efficacyScore: 3.5 }
    ]
  },
  'Astaxantina': {
    prevention: [
      { name: 'Disfunção renal', name_en: 'Renal Dysfunction', efficacyScore: 3.5 },
      { name: 'Estresse oxidativo', name_en: 'Oxidative Stress', efficacyScore: 4.2 }
    ],
    treatment: [],
    support: [
      { name: 'Saúde Ocular', name_en: 'Eye Health', efficacyScore: 3.0 },
      { name: 'Estresse Oxidativo', name_en: 'Oxidative Stress', efficacyScore: 3.0 },
      { name: 'Função renal', name_en: 'Renal Function', efficacyScore: 3.2 }
    ]
  },
  'Quercetina': {
    prevention: [
      { name: 'Lesão renal', name_en: 'Kidney Injury', efficacyScore: 3.5 }
    ],
    treatment: [
      { name: 'Nefropatia', name_en: 'Nephropathy', efficacyScore: 3.2 }
    ],
    support: [
      { name: 'Função renal', name_en: 'Renal Function', efficacyScore: 3.8 }
    ]
  },
  'Astragalus': {
    prevention: [
      { name: 'Disfunção renal', name_en: 'Renal Dysfunction', efficacyScore: 2.8 },
      { name: 'Imunossupressão', name_en: 'Immunosuppression', efficacyScore: 3.8 }
    ],
    treatment: [],
    support: [
      { name: 'Proteinúria', name_en: 'Proteinuria', efficacyScore: 2.6 },
      { name: 'Sistema imunológico renal', name_en: 'Renal Immune System', efficacyScore: 3.0 },
      { name: 'Função imune', name_en: 'Immune Function', efficacyScore: 3.5 }
    ]
  }
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔄 Iniciando migração de condições de nutracêuticos...');

    // 1. Buscar todos os nutracêuticos
    const { data: nutraceuticals, error: nutraError } = await supabase
      .from('nutraceuticals')
      .select('id, name');

    if (nutraError) throw nutraError;

    console.log(`✅ ${nutraceuticals?.length || 0} nutracêuticos encontrados`);

    let totalRelationsCreated = 0;
    let nutraWithConditions = 0;
    const conditionCache = new Map<string, string>(); // name -> id

    // 2. Para cada nutracêutico, verificar se tem condições mockadas
    for (const nutra of nutraceuticals || []) {
      const mockConditions = NUTRACEUTICAL_CONDITIONS_MAP[nutra.name];
      if (!mockConditions) {
        console.log(`⏭️ Pulando ${nutra.name} (sem dados mockados)`);
        continue;
      }

      console.log(`📦 Processando ${nutra.name}...`);

      // Verificar se já tem condições associadas
      const { data: existingConditions, error: existError } = await supabase
        .from('nutraceutical_conditions')
        .select('id')
        .eq('nutraceutical_id', nutra.id)
        .limit(1);

      if (existError) throw existError;

      if (existingConditions && existingConditions.length > 0) {
        console.log(`⏭️ ${nutra.name} já tem condições associadas`);
        continue;
      }

      // 3. Processar condições de prevenção, tratamento e suporte
      const relationTypes = [
        { type: 'prevention', conditions: mockConditions.prevention },
        { type: 'treatment', conditions: mockConditions.treatment },
        { type: 'support', conditions: mockConditions.support }
      ];

      for (const { type, conditions } of relationTypes) {
        for (const condition of conditions) {
          // Buscar ou criar a condição
          let conditionId = conditionCache.get(condition.name);

          if (!conditionId) {
            // Verificar se a condição já existe
            const { data: existingCondition } = await supabase
              .from('health_conditions')
              .select('id')
              .ilike('name', condition.name)
              .single();

            if (existingCondition) {
              conditionId = existingCondition.id;
            } else {
              // Criar nova condição
              const { data: newCondition, error: condError } = await supabase
                .from('health_conditions')
                .insert({
                  name: condition.name,
                  description: `Condição de saúde: ${condition.name}`
                })
                .select('id')
                .single();

              if (condError) {
                console.error(`❌ Erro ao criar condição ${condition.name}:`, condError);
                continue;
              }

              conditionId = newCondition.id;
              console.log(`✅ Condição criada: ${condition.name}`);
            }

            if (conditionId) {
              conditionCache.set(condition.name, conditionId);
            }
          }

          // 4. Criar relação nutraceutical_conditions
          if (!conditionId) {
            console.error(`❌ Não foi possível obter ID da condição ${condition.name}`);
            continue;
          }
          const { error: relationError } = await supabase
            .from('nutraceutical_conditions')
            .insert({
              nutraceutical_id: nutra.id,
              condition_id: conditionId,
              relationship_type: type,
              efficacy_score: condition.efficacyScore // Valor direto 0-10
            });

          if (relationError) {
            console.error(`❌ Erro ao criar relação:`, relationError);
          } else {
            totalRelationsCreated++;
            console.log(`✅ Relação criada: ${nutra.name} -> ${condition.name} (${type}, eficácia: ${condition.efficacyScore})`);
          }
        }
      }

      nutraWithConditions++;
    }

    console.log(`\n🎉 Migração concluída!`);
    console.log(`📊 Total de relações criadas: ${totalRelationsCreated}`);
    console.log(`📦 Nutracêuticos com condições: ${nutraWithConditions}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Migração concluída com sucesso`,
        stats: {
          totalRelationsCreated,
          nutraWithConditions,
          totalNutraceuticals: nutraceuticals?.length || 0
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
