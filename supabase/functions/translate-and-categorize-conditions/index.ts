import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HealthCondition {
  id: string;
  name: string;
  name_en: string | null;
  category: string | null;
  category_en: string | null;
  severity_level: string | null;
}

interface CategorizationResult {
  category: string;
  category_en: string;
  severity: string;
}

const categorizeCondition = (conditionName: string): CategorizationResult => {
  const name = conditionName.toLowerCase();
  
  // Musculoesquelética
  if (name.includes('artrite') || name.includes('articular') || name.includes('cartilagem') || 
      name.includes('mobilidade') || name.includes('osteo') || name.includes('arthritis') ||
      name.includes('joint') || name.includes('cartilage') || name.includes('mobility')) {
    return { category: 'Musculoesquelética', category_en: 'Musculoskeletal', severity: 'high' };
  }
  
  // Cardiovascular
  if (name.includes('cardiovascular') || name.includes('cardíaco') || name.includes('cardiomiopatia') || 
      name.includes('aterosclerose') || name.includes('cardiac') || name.includes('cardiomyopathy') ||
      name.includes('atherosclerosis') || name.includes('heart')) {
    return { category: 'Cardiovascular', category_en: 'Cardiovascular', severity: 'high' };
  }
  
  // Renal
  if (name.includes('renal') || name.includes('nefro') || name.includes('proteinúria') ||
      name.includes('kidney') || name.includes('nephro') || name.includes('proteinuria')) {
    return { category: 'Renal', category_en: 'Renal', severity: 'high' };
  }
  
  // Imunológica
  if (name.includes('imun') || name.includes('infecç') || name.includes('immune') ||
      name.includes('infection') || name.includes('defens')) {
    return { category: 'Imunológica', category_en: 'Immunological', severity: 'medium' };
  }
  
  // Digestiva
  if (name.includes('intestinal') || name.includes('digestiv') || name.includes('disbiose') ||
      name.includes('gastrointestinal') || name.includes('dysbiosis') || name.includes('gut')) {
    return { category: 'Digestiva', category_en: 'Digestive', severity: 'medium' };
  }
  
  // Hepática
  if (name.includes('hepát') || name.includes('fígado') || name.includes('hepat') ||
      name.includes('liver')) {
    return { category: 'Hepática', category_en: 'Hepatic', severity: 'high' };
  }
  
  // Dermatológica
  if (name.includes('dermat') || name.includes('pele') || name.includes('alérgica') ||
      name.includes('skin') || name.includes('allergic') || name.includes('atopic')) {
    return { category: 'Dermatológica', category_en: 'Dermatological', severity: 'medium' };
  }
  
  // Metabólica
  if (name.includes('fadiga') || name.includes('energia') || name.includes('metabolismo') || 
      name.includes('nutricional') || name.includes('fatigue') || name.includes('energy') ||
      name.includes('metabolism') || name.includes('nutritional')) {
    return { category: 'Metabólica', category_en: 'Metabolic', severity: 'low' };
  }
  
  // Oncológica
  if (name.includes('câncer') || name.includes('tumor') || name.includes('cancer') ||
      name.includes('oncol') || name.includes('neoplasm')) {
    return { category: 'Oncológica', category_en: 'Oncological', severity: 'critical' };
  }
  
  // Oftalmológica
  if (name.includes('ocular') || name.includes('olho') || name.includes('eye') ||
      name.includes('ophthalm') || name.includes('vision')) {
    return { category: 'Oftalmológica', category_en: 'Ophthalmic', severity: 'medium' };
  }
  
  // Respiratória
  if (name.includes('respiratór') || name.includes('alergia') || name.includes('respiratory') ||
      name.includes('allergy') || name.includes('breathing')) {
    return { category: 'Respiratória', category_en: 'Respiratory', severity: 'medium' };
  }
  
  // Oxidativa
  if (name.includes('oxidativ') || name.includes('antioxidante') || name.includes('oxidative') ||
      name.includes('antioxidant') || name.includes('stress')) {
    return { category: 'Oxidativa', category_en: 'Oxidative', severity: 'medium' };
  }
  
  // Envelhecimento
  if (name.includes('envelhecimento') || name.includes('telômero') || name.includes('epigenética') || 
      name.includes('longevidade') || name.includes('aging') || name.includes('telomere') ||
      name.includes('epigenetic') || name.includes('longevity')) {
    return { category: 'Envelhecimento', category_en: 'Aging', severity: 'high' };
  }
  
  // Inflamatória
  if (name.includes('inflam') || name.includes('inflamm')) {
    return { category: 'Inflamatória', category_en: 'Inflammatory', severity: 'high' };
  }
  
  // Default
  return { category: 'Geral', category_en: 'General', severity: 'medium' };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔍 Fetching all health conditions...');
    const { data: conditions, error: fetchError } = await supabase
      .from('health_conditions')
      .select('*')
      .order('name');

    if (fetchError) {
      console.error('❌ Error fetching conditions:', fetchError);
      throw fetchError;
    }

    console.log(`📊 Found ${conditions?.length || 0} conditions`);

    const conditionsToTranslate = conditions?.filter(c => !c.name_en) || [];
    const conditionsToCategorize = conditions?.filter(c => !c.category) || [];

    console.log(`🌍 Conditions needing translation: ${conditionsToTranslate.length}`);
    console.log(`📂 Conditions needing categorization: ${conditionsToCategorize.length}`);

    let translatedCount = 0;
    let categorizedCount = 0;
    let errorCount = 0;

    // Process in batches of 10 to avoid rate limits
    const batchSize = 10;
    const allConditions = conditions || [];

    for (let i = 0; i < allConditions.length; i += batchSize) {
      const batch = allConditions.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (condition: HealthCondition) => {
        try {
          let needsUpdate = false;
          const updates: Partial<HealthCondition> = {};

          // Translate if needed
          if (!condition.name_en && condition.name) {
            console.log(`🔤 Translating: ${condition.name}`);
            
            const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${lovableApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'google/gemini-3-pro-preview',
                messages: [
                  {
                    role: 'system',
                    content: 'You are a professional veterinary medical translator. Translate condition names from Portuguese to English. Return ONLY the translated text, no explanations.'
                  },
                  {
                    role: 'user',
                    content: `Translate this veterinary condition to English: "${condition.name}"`
                  }
                ],
                temperature: 0.3,
              }),
            });

            if (response.ok) {
              const result = await response.json();
              const translation = result.choices?.[0]?.message?.content?.trim();
              
              if (translation) {
                updates.name_en = translation;
                translatedCount++;
                needsUpdate = true;
                console.log(`✅ Translated: ${condition.name} -> ${translation}`);
              }
            } else {
              console.error(`❌ Translation failed for ${condition.name}: ${response.status}`);
              errorCount++;
            }
          }

          // Categorize if needed
          if (!condition.category || !condition.severity_level) {
            const categorization = categorizeCondition(condition.name);
            updates.category = categorization.category;
            updates.category_en = categorization.category_en;
            updates.severity_level = categorization.severity;
            categorizedCount++;
            needsUpdate = true;
            console.log(`📂 Categorized: ${condition.name} -> ${categorization.category} (${categorization.severity})`);
          }

          // Update if needed
          if (needsUpdate) {
            const { error: updateError } = await supabase
              .from('health_conditions')
              .update(updates)
              .eq('id', condition.id);

            if (updateError) {
              console.error(`❌ Error updating condition ${condition.name}:`, updateError);
              errorCount++;
            }
          }
        } catch (error) {
          console.error(`❌ Error processing condition ${condition.name}:`, error);
          errorCount++;
        }
      }));

      // Small delay between batches to respect rate limits
      if (i + batchSize < allConditions.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('\n🎉 Translation and categorization complete!');
    console.log(`✅ Translated: ${translatedCount} conditions`);
    console.log(`📂 Categorized: ${categorizedCount} conditions`);
    console.log(`❌ Errors: ${errorCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processamento concluído: ${translatedCount} traduzidas, ${categorizedCount} categorizadas`,
        stats: {
          total: allConditions.length,
          translated: translatedCount,
          categorized: categorizedCount,
          errors: errorCount
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Error in translate-and-categorize-conditions:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
