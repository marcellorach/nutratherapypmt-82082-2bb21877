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
    
    // Build list of URLs to try for PMC articles
    const urlsToTry: string[] = [];
    
    // Check if this is a PMC URL
    const pmcMatch = pdfUrl.match(/PMC(\d+)/i);
    if (pmcMatch) {
      const pmcId = pmcMatch[1];
      // Multiple URL formats that PMC uses
      urlsToTry.push(
        `https://www.ncbi.nlm.nih.gov/pmc/articles/PMC${pmcId}/pdf/`,
        `https://pmc.ncbi.nlm.nih.gov/articles/PMC${pmcId}/pdf/`,
        `https://europepmc.org/backend/ptpmcrender.fcgi?accid=PMC${pmcId}&blobtype=pdf`,
        pdfUrl // Original URL as fallback
      );
      console.log('📋 PMC article detected. Will try multiple URL formats for PMC' + pmcId);
    } else {
      urlsToTry.push(pdfUrl);
    }
    
    let pdfResponse: Response | null = null;
    let lastError = '';
    let successUrl = '';
    
    // Try each URL format
    for (const urlToTry of urlsToTry) {
      console.log('🔗 Trying URL:', urlToTry);
      
      try {
        const response = await fetch(urlToTry, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/pdf,application/octet-stream,*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
          },
          redirect: 'follow'
        });
        
        if (!response.ok) {
          console.log(`   ❌ HTTP ${response.status}`);
          lastError = `HTTP ${response.status}: ${response.statusText}`;
          continue;
        }
        
        const contentType = response.headers.get('content-type') || '';
        console.log('   Content-Type:', contentType);
        
        // Check if this is actually a PDF
        if (contentType.includes('application/pdf') || contentType.includes('application/octet-stream')) {
          pdfResponse = response;
          successUrl = urlToTry;
          console.log('   ✅ PDF found!');
          break;
        }
        
        // If HTML, try to extract PDF link
        if (contentType.includes('text/html')) {
          const htmlContent = await response.text();
          
          // Look for PDF links in the HTML
          const pdfPatterns = [
            /href="([^"]*\.pdf[^"]*)"/gi,
            /href="([^"]*\/pdf\/[^"]*)"/gi,
            /data-pdf-url="([^"]*)"/gi,
            /<a[^>]*href="([^"]*)"[^>]*>.*?PDF.*?<\/a>/gi,
          ];
          
          let foundPdfLink: string | null = null;
          for (const pattern of pdfPatterns) {
            const match = pattern.exec(htmlContent);
            if (match && match[1]) {
              foundPdfLink = match[1];
              break;
            }
          }
          
          if (foundPdfLink) {
            // Make the URL absolute if needed
            if (foundPdfLink.startsWith('/')) {
              const urlObj = new URL(urlToTry);
              foundPdfLink = `${urlObj.origin}${foundPdfLink}`;
            } else if (!foundPdfLink.startsWith('http')) {
              const urlObj = new URL(urlToTry);
              foundPdfLink = `${urlObj.origin}/${foundPdfLink}`;
            }
            
            console.log('   📥 Found PDF link in HTML:', foundPdfLink);
            
            // Try to fetch the extracted PDF link
            const pdfLinkResponse = await fetch(foundPdfLink, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/pdf,application/octet-stream,*/*',
              },
              redirect: 'follow'
            });
            
            if (pdfLinkResponse.ok) {
              const linkContentType = pdfLinkResponse.headers.get('content-type') || '';
              if (linkContentType.includes('application/pdf') || linkContentType.includes('application/octet-stream')) {
                pdfResponse = pdfLinkResponse;
                successUrl = foundPdfLink;
                console.log('   ✅ PDF from extracted link!');
                break;
              }
            }
          }
          
          console.log('   ⚠️ HTML response, no extractable PDF link');
          lastError = 'Received HTML instead of PDF';
          continue;
        }
        
        // Unknown content type - try reading first bytes to check if PDF
        const buffer = await response.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        const signature = String.fromCharCode(...bytes.slice(0, 4));
        
        if (signature === '%PDF') {
          // Create a new Response with the buffer
          pdfResponse = new Response(buffer, {
            status: 200,
            headers: response.headers
          });
          successUrl = urlToTry;
          console.log('   ✅ Valid PDF detected from content!');
          break;
        }
        
        console.log('   ⚠️ Unknown content, not a PDF');
        lastError = 'Content is not a valid PDF';
        
      } catch (fetchError) {
        console.error('   ❌ Fetch error:', fetchError);
        lastError = fetchError instanceof Error ? fetchError.message : 'Fetch failed';
      }
    }
    
    if (!pdfResponse) {
      console.error('❌ All URL attempts failed. Last error:', lastError);
      return new Response(
        JSON.stringify({ 
          error: 'PDF not directly accessible',
          details: `Could not download PDF after trying ${urlsToTry.length} URL formats. ${lastError}. The PDF may require institutional access or manual download.`,
          triedUrls: urlsToTry
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('✅ Successfully downloaded from:', successUrl);
    
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
