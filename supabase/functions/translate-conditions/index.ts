import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔍 Buscando condições sem tradução...');

    // Buscar condições onde name_en é NULL
    const { data: conditions, error: fetchError } = await supabase
      .from('health_conditions')
      .select('id, name, description, category')
      .is('name_en', null);

    if (fetchError) {
      console.error('Erro ao buscar condições:', fetchError);
      throw fetchError;
    }

    if (!conditions || conditions.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Todas as condições já estão traduzidas!',
          translated: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📝 Encontradas ${conditions.length} condições para traduzir`);

    let translated = 0;
    let errors = 0;

    // Traduzir cada condição
    for (const condition of conditions) {
      try {
        console.log(`Traduzindo: ${condition.name}`);

        const prompt = `Translate the following veterinary health condition information from Portuguese to English. Return ONLY a valid JSON object with these exact fields: name_en, description_en, category_en. No markdown, no code blocks, just the JSON.

Portuguese data:
- Name: ${condition.name}
- Description: ${condition.description || 'No description'}
- Category: ${condition.category || 'No category'}

Example response format:
{"name_en":"Kidney Disease","description_en":"Chronic kidney disease description","category_en":"Renal"}`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { 
                role: 'system', 
                content: 'You are a professional translator specializing in veterinary terminology. Always respond with valid JSON only, no markdown or code blocks.'
              },
              { role: 'user', content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 500
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`OpenAI API error for ${condition.name}:`, response.status, errorText);
          errors++;
          continue;
        }

        const data = await response.json();
        const translationText = data.choices[0].message.content.trim();
        
        // Remove markdown code blocks se existirem
        const cleanedText = translationText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        let translation;
        try {
          translation = JSON.parse(cleanedText);
        } catch (parseError) {
          console.error(`JSON parse error for ${condition.name}:`, parseError, 'Text:', cleanedText);
          errors++;
          continue;
        }

        // Atualizar no banco
        const { error: updateError } = await supabase
          .from('health_conditions')
          .update({
            name_en: translation.name_en,
            description_en: translation.description_en || null,
            category_en: translation.category_en || null,
          })
          .eq('id', condition.id);

        if (updateError) {
          console.error(`Erro ao atualizar ${condition.name}:`, updateError);
          errors++;
        } else {
          translated++;
          console.log(`✅ Traduzido: ${condition.name} -> ${translation.name_en}`);
        }

        // Pequeno delay para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (err) {
        console.error(`Erro ao processar ${condition.name}:`, err);
        errors++;
      }
    }

    console.log(`✨ Tradução concluída: ${translated} sucesso, ${errors} erros`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Tradução concluída! ${translated} condições traduzidas com sucesso.`,
        translated,
        errors,
        total: conditions.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro fatal:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error)
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
