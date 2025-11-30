import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DownloadRequest {
  pdfUrl: string;
  studyData: {
    title: string;
    authors?: string[];
    journal?: string;
    year?: number;
    doi?: string;
    pmid?: string;
    openalexId?: string;
    source: string;
    abstract?: string;
  };
}

// Sanitize filename for storage
function sanitizeFileName(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf('.');
  const name = lastDotIndex > 0 ? fileName.slice(0, lastDotIndex) : fileName;
  const extension = lastDotIndex > 0 ? fileName.slice(lastDotIndex) : '';
  
  let sanitized = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[—–−]/g, '-')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  
  if (sanitized.length > 100) {
    sanitized = sanitized.slice(0, 100);
  }
  
  return sanitized + extension;
}

// Generate a unique study ID
function generateStudyId(): string {
  return `study_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { pdfUrl, studyData }: DownloadRequest = await req.json();
    
    if (!pdfUrl) {
      return new Response(
        JSON.stringify({ error: 'PDF URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!studyData?.title) {
      return new Response(
        JSON.stringify({ error: 'Study title is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Downloading PDF from:', pdfUrl);
    console.log('Study:', studyData.title);
    
    // Step 1: Download the PDF
    const pdfResponse = await fetch(pdfUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; VetGraphBot/1.0; +https://vetgraph.ai)',
        'Accept': 'application/pdf,*/*'
      }
    });
    
    if (!pdfResponse.ok) {
      console.error('Failed to download PDF:', pdfResponse.status, pdfResponse.statusText);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to download PDF', 
          details: `HTTP ${pdfResponse.status}: ${pdfResponse.statusText}` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const contentType = pdfResponse.headers.get('content-type') || '';
    console.log('Content-Type:', contentType);
    
    // Check if it's actually a PDF (or HTML redirect)
    if (!contentType.includes('pdf') && !contentType.includes('octet-stream')) {
      console.warn('Warning: Content type is not PDF:', contentType);
      // Some servers return PDF with wrong content type, so we'll try anyway
    }
    
    const pdfBuffer = await pdfResponse.arrayBuffer();
    const pdfSize = pdfBuffer.byteLength;
    
    console.log('Downloaded PDF size:', pdfSize, 'bytes');
    
    if (pdfSize < 1000) {
      // Too small to be a real PDF, likely an error page
      return new Response(
        JSON.stringify({ 
          error: 'Downloaded file is too small to be a valid PDF',
          details: `Size: ${pdfSize} bytes`
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Step 2: Generate unique filename and path
    const studyId = generateStudyId();
    const safeTitle = sanitizeFileName(studyData.title);
    const fileName = `${safeTitle}.pdf`;
    const storagePath = `studies/${studyId}_${fileName}`;
    
    console.log('Storage path:', storagePath);
    
    // Step 3: Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('study_pdfs')
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false
      });
    
    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to upload PDF to storage', details: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('PDF uploaded successfully:', uploadData);
    
    // Step 4: Create record in processed_studies table
    const { data: studyRecord, error: dbError } = await supabase
      .from('processed_studies')
      .insert({
        study_id: studyId,
        original_filename: fileName,
        storage_path: storagePath,
        import_type: 'api_download',
        kanban_status: 'new',
        processed_by: 'system',
        title: studyData.title,
        description: studyData.abstract || null,
        journal: studyData.journal || null,
        authors: studyData.authors || null,
        year: studyData.year || null
      })
      .select()
      .single();
    
    if (dbError) {
      console.error('Database insert error:', dbError);
      // Try to clean up the uploaded file
      await supabase.storage.from('study_pdfs').remove([storagePath]);
      
      return new Response(
        JSON.stringify({ error: 'Failed to create study record', details: dbError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Study record created:', studyRecord.id);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'PDF downloaded and saved successfully',
        data: {
          studyId: studyRecord.id,
          fileName,
          storagePath,
          fileSize: pdfSize
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in download-study-pdf:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
