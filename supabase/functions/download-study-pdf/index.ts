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
    
    // Normalize PMC URLs - many PMC links return HTML redirects
    let normalizedPdfUrl = pdfUrl;
    
    // PMC URLs: try to get the actual PDF
    if (pdfUrl.includes('ncbi.nlm.nih.gov/pmc/articles/')) {
      const pmcMatch = pdfUrl.match(/PMC(\d+)/i);
      if (pmcMatch) {
        const pmcId = pmcMatch[1];
        // Try direct PDF link format
        normalizedPdfUrl = `https://www.ncbi.nlm.nih.gov/pmc/articles/PMC${pmcId}/pdf/`;
        console.log('📋 Normalized PMC URL:', normalizedPdfUrl);
      }
    }
    
    // Step 1: Download the PDF with redirect following
    let pdfResponse = await fetch(normalizedPdfUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/pdf,application/octet-stream,*/*',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow'
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
    console.log('Final URL:', pdfResponse.url);
    
    // Check if we got an HTML page instead of PDF (common with PMC)
    const isHtmlResponse = contentType.includes('text/html');
    
    if (isHtmlResponse) {
      console.warn('⚠️ Received HTML instead of PDF, attempting to extract PDF link...');
      
      const htmlContent = await pdfResponse.text();
      
      // Try to find direct PDF link in HTML
      const pdfLinkMatch = htmlContent.match(/href="([^"]*\.pdf[^"]*)"/i) || 
                           htmlContent.match(/src="([^"]*\.pdf[^"]*)"/i);
      
      if (pdfLinkMatch) {
        let extractedPdfUrl = pdfLinkMatch[1];
        if (extractedPdfUrl.startsWith('/')) {
          extractedPdfUrl = `https://www.ncbi.nlm.nih.gov${extractedPdfUrl}`;
        }
        console.log('📥 Found PDF link in HTML:', extractedPdfUrl);
        
        pdfResponse = await fetch(extractedPdfUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/pdf,application/octet-stream,*/*',
          },
          redirect: 'follow'
        });
        
        if (!pdfResponse.ok) {
          return new Response(
            JSON.stringify({ 
              error: 'Failed to download PDF from extracted link',
              details: `HTTP ${pdfResponse.status}` 
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else {
        return new Response(
          JSON.stringify({ 
            error: 'PDF not directly accessible',
            details: 'The provided URL returned HTML instead of a PDF. The PDF may require institutional access or manual download.'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    const pdfBuffer = await pdfResponse.arrayBuffer();
    const pdfSize = pdfBuffer.byteLength;
    
    console.log('Downloaded PDF size:', pdfSize, 'bytes');
    
    // Check for valid PDF signature (starts with %PDF)
    const pdfBytes = new Uint8Array(pdfBuffer);
    const pdfSignature = String.fromCharCode(...pdfBytes.slice(0, 4));
    const isValidPdf = pdfSignature === '%PDF';
    
    if (!isValidPdf) {
      console.error('❌ Invalid PDF signature:', pdfSignature);
      return new Response(
        JSON.stringify({ 
          error: 'Downloaded file is not a valid PDF',
          details: `File does not start with PDF signature. Size: ${pdfSize} bytes. This URL may require institutional access.`
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (pdfSize < 5000) {
      // Too small to be a real PDF with content
      return new Response(
        JSON.stringify({ 
          error: 'Downloaded PDF is too small to contain valid content',
          details: `Size: ${pdfSize} bytes. The PDF may be incomplete or require authentication.`
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
