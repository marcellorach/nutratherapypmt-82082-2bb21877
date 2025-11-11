import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, sourceLang, targetLang, context } = await req.json();

    console.log('Translation request:', { text, sourceLang, targetLang, context });

    if (!text || !sourceLang || !targetLang) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Define context-specific prompts for better translations
    const contextPrompts = {
      // Health Conditions
      name: 'This is a veterinary health condition name. Translate it accurately, maintaining medical terminology.',
      description: 'This is a veterinary health condition description. Translate it clearly and professionally, maintaining medical accuracy.',
      category: 'This is a veterinary health condition category. Translate it accurately and consistently with medical terminology.',
      
      // Nutraceuticals
      nutraceutical_name: 'This is a nutraceutical compound name. Maintain scientific terminology and accuracy.',
      nutraceutical_description: 'This is a nutraceutical description. Use precise scientific language while keeping it clear.',
      nutraceutical_source: 'This is the natural source of a nutraceutical. Maintain botanical/chemical accuracy.',
      dosage: 'These are dosage instructions. Maintain medical precision and clarity.',
      source: 'This is the natural source of a nutraceutical. Maintain botanical/chemical accuracy.',
      
      // Scientific Studies
      title: 'This is a scientific study title. Use formal academic language.',
      abstract: 'This is a study abstract. Maintain technical precision and scientific terminology.',
      journal: 'This is a journal name. Maintain proper nouns and official names.',
      
      // Outcomes & Families
      outcome_name: 'This is a health outcome or goal name. Use clinical terminology.',
      outcome_description: 'This is an outcome description. Use professional medical language.',
      
      // Categories & Benefits
      category_name: 'This is a category name. Maintain consistent taxonomy and terminology.',
      benefit: 'This is a health benefit description. Keep it clear, concise, and accurate.'
    };

    const contextPrompt = contextPrompts[context as keyof typeof contextPrompts] || contextPrompts.name;

    const systemPrompt = sourceLang === 'pt' 
      ? `You are a professional veterinary medical translator. Translate the following text from Portuguese to English. ${contextPrompt} Return ONLY the translated text, without any additional explanation or formatting.`
      : `You are a professional veterinary medical translator. Translate the following text from English to Portuguese. ${contextPrompt} Return ONLY the translated text, without any additional explanation or formatting.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0.3, // Lower temperature for more consistent translations
        max_tokens: 500
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      return new Response(
        JSON.stringify({ error: 'Translation service error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const translatedText = data.choices[0].message.content.trim();

    console.log('Translation successful:', { original: text, translated: translatedText });

    return new Response(
      JSON.stringify({ 
        translatedText,
        originalText: text,
        sourceLang,
        targetLang
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in translate-text function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
