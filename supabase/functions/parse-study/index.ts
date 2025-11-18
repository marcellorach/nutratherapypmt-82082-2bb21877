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
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt}/${maxRetries} to call Unstructured API...`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
        
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
        console.error(`Attempt ${attempt} failed:`, lastError);
        
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
          console.log(`Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        console.error(`Attempt ${attempt} failed with error:`, lastError);
        
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
          console.log(`Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    if (!unstructuredResponse) {
      console.error('All retry attempts failed. Last error:', lastError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to connect to Unstructured API after multiple attempts',
          details: lastError,
          suggestion: 'This may be a temporary network issue. Please try again in a few minutes.'
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

    // Update processed_studies with parsed content
    const { error: updateError } = await supabase
      .from('processed_studies')
      .update({
        analysis_data: structuredContent,
        kanban_status: 'parsed',
        updated_at: new Date().toISOString(),
      })
      .eq('study_id', studyId);

    if (updateError) {
      console.error('Failed to update processed_studies:', updateError);
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
