import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Dados mockados de condições por nutracêutico
const NUTRACEUTICAL_CONDITIONS_MAP: Record<string, {
  prevention: Array<{ name: string; efficacyScore: number }>;
  treatment: Array<{ name: string; efficacyScore: number }>;
  support: Array<{ name: string; efficacyScore: number }>;
}> = {
  'Glucosamina': {
    prevention: [
      { name: 'Osteoartrite canina', efficacyScore: 3.2 },
      { name: 'Problemas articulares', efficacyScore: 3.8 },
      { name: 'Degeneração cartilaginosa', efficacyScore: 3.5 }
    ],
    treatment: [
      { name: 'Osteoartrite canina', efficacyScore: 4.2 },
      { name: 'Problemas articulares', efficacyScore: 4.0 },
      { name: 'Dor articular', efficacyScore: 3.9 }
    ],
    support: [
      { name: 'Osteoartrite canina', efficacyScore: 3.7 },
      { name: 'Mobilidade articular', efficacyScore: 4.0 },
      { name: 'Saúde das cartilagens', efficacyScore: 3.8 }
    ]
  },
  'Condroitina': {
    prevention: [
      { name: 'Osteoartrite canina', efficacyScore: 3.5 },
      { name: 'Degeneração articular', efficacyScore: 3.7 },
      { name: 'Problemas articulares', efficacyScore: 3.4 }
    ],
    treatment: [
      { name: 'Osteoartrite canina', efficacyScore: 4.1 },
      { name: 'Degeneração articular', efficacyScore: 3.9 },
      { name: 'Dor articular', efficacyScore: 3.8 }
    ],
    support: [
      { name: 'Osteoartrite canina', efficacyScore: 3.6 },
      { name: 'Estrutura cartilaginosa', efficacyScore: 3.5 },
      { name: 'Saúde articular', efficacyScore: 3.7 }
    ]
  },
  'L-carnitina': {
    prevention: [
      { name: 'Problemas cardíacos', efficacyScore: 3.8 },
      { name: 'Cardiomiopatia', efficacyScore: 3.5 },
      { name: 'Função cardíaca', efficacyScore: 3.6 }
    ],
    treatment: [
      { name: 'Cardiomiopatia dilatada', efficacyScore: 4.3 },
      { name: 'Função cardíaca', efficacyScore: 4.0 },
      { name: 'Insuficiência cardíaca', efficacyScore: 3.9 }
    ],
    support: [
      { name: 'Função cardíaca', efficacyScore: 4.0 },
      { name: 'Metabolismo energético', efficacyScore: 3.8 },
      { name: 'Saúde cardiovascular', efficacyScore: 3.7 }
    ]
  },
  'Equinácea': {
    prevention: [
      { name: 'Infecções respiratórias', efficacyScore: 3.8 },
      { name: 'Infecções recorrentes', efficacyScore: 3.5 },
      { name: 'Sistema imunológico enfraquecido', efficacyScore: 3.7 }
    ],
    treatment: [
      { name: 'Infecções respiratórias', efficacyScore: 4.2 },
      { name: 'Infecções recorrentes', efficacyScore: 3.9 }
    ],
    support: [
      { name: 'Sistema imunológico', efficacyScore: 4.0 }
    ]
  },
  'Quitosana': {
    prevention: [
      { name: 'Obesidade canina', efficacyScore: 3.5 },
      { name: 'Sobrepeso', efficacyScore: 3.6 }
    ],
    treatment: [
      { name: 'Obesidade canina', efficacyScore: 3.8 },
      { name: 'Hipercolesterolemia', efficacyScore: 3.7 }
    ],
    support: [
      { name: 'Controle de peso', efficacyScore: 3.9 },
      { name: 'Saúde digestiva', efficacyScore: 3.5 }
    ]
  },
  'Coenzima Q10': {
    prevention: [
      { name: 'Problemas cardíacos', efficacyScore: 3.9 },
      { name: 'Estresse oxidativo', efficacyScore: 3.7 }
    ],
    treatment: [
      { name: 'Cardiomiopatia dilatada', efficacyScore: 4.1 },
      { name: 'Insuficiência cardíaca', efficacyScore: 4.0 },
      { name: 'Função cardíaca', efficacyScore: 3.9 }
    ],
    support: [
      { name: 'Função cardíaca', efficacyScore: 4.0 },
      { name: 'Energia celular', efficacyScore: 3.8 },
      { name: 'Saúde cardiovascular', efficacyScore: 3.9 }
    ]
  },
  'EPA (Ácido eicosapentaenoico)': {
    prevention: [
      { name: 'Inflamação crônica', efficacyScore: 3.9 },
      { name: 'Problemas cardiovasculares', efficacyScore: 3.7 },
      { name: 'Problemas articulares', efficacyScore: 3.6 }
    ],
    treatment: [
      { name: 'Inflamação crônica', efficacyScore: 4.3 },
      { name: 'Osteoartrite canina', efficacyScore: 4.1 },
      { name: 'Dermatite atópica', efficacyScore: 4.0 }
    ],
    support: [
      { name: 'Saúde cardiovascular', efficacyScore: 4.0 },
      { name: 'Função cerebral', efficacyScore: 3.8 },
      { name: 'Saúde da pele', efficacyScore: 3.9 }
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

            conditionCache.set(condition.name, conditionId);
          }

          // 4. Criar relação nutraceutical_conditions
          const { error: relationError } = await supabase
            .from('nutraceutical_conditions')
            .insert({
              nutraceutical_id: nutra.id,
              condition_id: conditionId,
              relationship_type: type,
              efficacy_score: Math.round(condition.efficacyScore * 10) // 3.2 -> 32
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
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
