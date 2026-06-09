import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { studyId, storagePath } = await req.json();
    
    if (!studyId || !storagePath) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: studyId and storagePath' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get Unstructured API key from ai_configurations
    const { data: configData, error: configError } = await supabase
      .from('ai_configurations')
      .select('config_value')
      .eq('config_key', 'unstructured_api_key')
      .eq('is_active', true)
      .maybeSingle();
    
    if (configError || !configData) {
      console.error('Failed to get Unstructured API key:', configError);
      return new Response(
        JSON.stringify({ error: 'Unstructured API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const unstructuredApiKey = configData.config_value?.key || configData.config_value;
    
    if (!unstructuredApiKey || unstructuredApiKey === '') {
      return new Response(
        JSON.stringify({ error: 'Unstructured API key is empty. Please configure it in Settings.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Parsing study ${studyId} from ${storagePath}`);
    
    // Download PDF from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('study_pdfs')
      .download(storagePath);
    
    if (downloadError || !fileData) {
      console.error('Failed to download PDF:', downloadError);
      return new Response(
        JSON.stringify({ error: 'Failed to download PDF from storage' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert blob to base64 for Unstructured API
    const arrayBuffer = await fileData.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Create form data for Unstructured API
    const formData = new FormData();
    formData.append('files', new Blob([uint8Array], { type: 'application/pdf' }), 'study.pdf');
    formData.append('strategy', 'hi_res'); // High resolution parsing
    formData.append('extract_images_in_pdf', 'true');
    formData.append('infer_table_structure', 'true');

    // Call Unstructured API with retry logic
    console.log('Calling Unstructured API...');
    
    let unstructuredResponse;
    let lastError;
    const maxRetries = 10;
    const initialDelay = 2000; // 2 seconds initial delay
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${maxRetries} to call Unstructured API... (timeout: 60s)`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout
        
        unstructuredResponse = await fetch('https://api.unstructured.io/general/v0/general', {
          method: 'POST',
          headers: {
            'unstructured-api-key': unstructuredApiKey,
          },
          body: formData,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (unstructuredResponse.ok) {
          console.log('Unstructured API call successful');
          break;
        }
        
        lastError = `HTTP ${unstructuredResponse.status}: ${await unstructuredResponse.text()}`;
        console.error(`❌ Attempt ${attempt} failed:`, lastError);
        
        if (attempt < maxRetries) {
          // Delay exponencial: 2s, 4s, 8s, 16s, 32s, 60s (max)
          const baseDelay = initialDelay * Math.pow(2, attempt - 1);
          const jitter = Math.random() * 2000; // Randomiza 0-2s
          const totalDelay = Math.min(baseDelay + jitter, 60000); // Máximo 60s
          
          console.log(`⏳ Waiting ${Math.round(totalDelay/1000)}s before retry ${attempt + 1}/${maxRetries}...`);
          await new Promise(resolve => setTimeout(resolve, totalDelay));
        }
        
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        console.error(`❌ Attempt ${attempt} failed with error:`, lastError);
        
        if (attempt < maxRetries) {
          // Delay exponencial: 2s, 4s, 8s, 16s, 32s, 60s (max)
          const baseDelay = initialDelay * Math.pow(2, attempt - 1);
          const jitter = Math.random() * 2000; // Randomiza 0-2s
          const totalDelay = Math.min(baseDelay + jitter, 60000); // Máximo 60s
          
          console.log(`⏳ Waiting ${Math.round(totalDelay/1000)}s before retry ${attempt + 1}/${maxRetries}...`);
          await new Promise(resolve => setTimeout(resolve, totalDelay));
        }
      }
    }
    
    if (!unstructuredResponse) {
      console.error(`❌ All ${maxRetries} retry attempts failed. Last error:`, lastError);
      
      return new Response(
        JSON.stringify({ 
          error: 'Problema temporário de conexão com Unstructured API',
          errorType: 'DNS_RESOLUTION_FAILURE',
          details: lastError,
          isTemporary: true,
          suggestion: 'Este é um problema conhecido do Deno Deploy. Recomendações:\n' +
                      '1. Aguarde 5-10 minutos e tente novamente\n' +
                      '2. Use o botão "Tentar Novamente" na interface\n' +
                      '3. Se persistir, contate o suporte técnico',
          technicalInfo: `Tentativas: ${maxRetries}, Última falha: ${lastError}`
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!unstructuredResponse.ok) {
      const errorText = await unstructuredResponse.text();
      console.error('Unstructured API error:', unstructuredResponse.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: 'Unstructured API failed', 
          details: errorText,
          status: unstructuredResponse.status 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const parsedElements = await unstructuredResponse.json();
    console.log(`Parsed ${parsedElements.length} elements from PDF`);

    // Structure the parsed content
    const structuredContent = {
      elements: parsedElements,
      metadata: {
        totalElements: parsedElements.length,
        parsedAt: new Date().toISOString(),
        strategy: 'hi_res',
      },
      sections: extractSections(parsedElements),
      tables: extractTables(parsedElements),
    };

    // ✅ Stage telemetry: compute total chars of all parsed text elements.
    // Used downstream by gemini-file-search as the denominator of truncation_ratio.
    const totalChars = (parsedElements as any[]).reduce((acc, el) => {
      const t = typeof el?.text === 'string' ? el.text.length : 0;
      return acc + t;
    }, 0);
    const parseStageEntry = {
      status: 'ok',
      sections_count: structuredContent.sections.length,
      tables_count: structuredContent.tables.length,
      elements_count: parsedElements.length,
      total_chars: totalChars,
      finished_at: new Date().toISOString(),
    };

    // Update processed_studies with parsed content
    // Merge ingestion_stages.parse_study without overwriting other stage keys.
    const { data: existingRow } = await supabase
      .from('processed_studies')
      .select('ingestion_stages')
      .eq('study_id', studyId)
      .maybeSingle();
    const mergedStages = {
      ...((existingRow?.ingestion_stages as Record<string, unknown>) || {}),
      parse_study: parseStageEntry,
    };

    const { error: updateError } = await supabase
      .from('processed_studies')
      .update({
        analysis_data: structuredContent,
        kanban_status: 'parsed',
        ingestion_stages: mergedStages,
        updated_at: new Date().toISOString(),
      })
      .eq('study_id', studyId);

    if (updateError) {
      console.error('Failed to update processed_studies:', updateError);
      // Best-effort: record failure on the stage entry so UI surfaces it.
      try {
        await supabase
          .from('processed_studies')
          .update({
            ingestion_stages: {
              ...mergedStages,
              parse_study: { status: 'failed', error_message: updateError.message, finished_at: new Date().toISOString() },
            },
          })
          .eq('study_id', studyId);
      } catch {}
      return new Response(
        JSON.stringify({ error: 'Failed to save parsed content' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        studyId,
        elementsCount: parsedElements.length,
        sectionsCount: structuredContent.sections.length,
        tablesCount: structuredContent.tables.length,
        parsedData: structuredContent, // Incluir dados parseados na resposta
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in parse-study function:', error);
    
    return new Response(
      JSON.stringify({ error: 'Processing failed', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function to extract sections from elements
function extractSections(elements: any[]): any[] {
  const sections: any[] = [];
  let currentSection: any = null;

  for (const element of elements) {
    if (element.type === 'Title' || element.type === 'Header') {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        title: element.text,
        content: [],
        type: element.type,
      };
    } else if (currentSection) {
      currentSection.content.push({
        type: element.type,
        text: element.text,
      });
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
}

// Helper function to extract tables
function extractTables(elements: any[]): any[] {
  return elements
    .filter(el => el.type === 'Table')
    .map(el => ({
      text: el.text,
      metadata: el.metadata,
    }));
}
