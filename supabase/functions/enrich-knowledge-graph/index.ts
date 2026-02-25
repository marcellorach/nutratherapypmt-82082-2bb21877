import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const DEFAULT_QUERIES = [
  "curcumin canine aging neuroprotection",
  "omega-3 fatty acids dog osteoarthritis longevity",
  "resveratrol canine cardiac aging",
  "NAD+ NMN canine geriatric supplementation",
  "probiotics gut microbiome elderly dogs"
];

interface EnrichRequest {
  queries?: string[];
  autoApproveThreshold?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // SSE streaming setup
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: any) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const body: EnrichRequest = await req.json().catch(() => ({}));
        const queries = body.queries?.length ? body.queries : DEFAULT_QUERIES;
        const threshold = body.autoApproveThreshold ?? 70;

        send('start', { totalQueries: queries.length, queries });

        let totalStudiesProcessed = 0;
        let totalTripletsCreated = 0;
        let totalTripletsApproved = 0;
        const results: any[] = [];

        for (let qi = 0; qi < queries.length; qi++) {
          const query = queries[qi];
          send('query_start', { index: qi, query });

          // Step 1: Search for studies
          send('step', { index: qi, step: 'searching', query });
          let searchResults: any[] = [];
          try {
            const searchResp = await fetch(`${supabaseUrl}/functions/v1/search-scientific-studies`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`,
              },
              body: JSON.stringify({
                query,
                source: 'both',
                maxResults: 3,
                openAccessOnly: true,
              }),
            });

            if (!searchResp.ok) {
              const errText = await searchResp.text();
              send('step_error', { index: qi, step: 'searching', error: `Search failed: ${errText}` });
              results.push({ query, status: 'search_failed', error: errText });
              continue;
            }

            const searchData = await searchResp.json();
            searchResults = searchData.results || [];
            send('step_complete', { index: qi, step: 'searching', found: searchResults.length });
          } catch (err) {
            send('step_error', { index: qi, step: 'searching', error: String(err) });
            results.push({ query, status: 'search_error', error: String(err) });
            continue;
          }

          if (searchResults.length === 0) {
            send('query_complete', { index: qi, query, status: 'no_results' });
            results.push({ query, status: 'no_results' });
            continue;
          }

          // Pick the first result with a PDF URL
          const study = searchResults.find((s: any) => s.pdfUrl) || searchResults[0];
          send('step', { index: qi, step: 'selected_study', title: study.title, hasPdf: !!study.pdfUrl });

          if (!study.pdfUrl) {
            send('query_complete', { index: qi, query, status: 'no_pdf', title: study.title });
            results.push({ query, status: 'no_pdf', title: study.title });
            continue;
          }

          // Step 2: Download PDF
          send('step', { index: qi, step: 'downloading', title: study.title });
          let studyId: string | null = null;
          try {
            const dlResp = await fetch(`${supabaseUrl}/functions/v1/download-study-pdf`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`,
              },
              body: JSON.stringify({
                pdfUrl: study.pdfUrl,
                studyData: {
                  title: study.title,
                  authors: study.authors,
                  journal: study.journal,
                  year: study.year,
                  doi: study.doi,
                  pmid: study.pmid,
                  openalexId: study.openalexId,
                  source: study.source,
                  abstract: study.abstract,
                },
              }),
            });

            if (!dlResp.ok) {
              const errText = await dlResp.text();
              send('step_error', { index: qi, step: 'downloading', error: `Download failed: ${errText}` });
              results.push({ query, status: 'download_failed', title: study.title, error: errText });
              continue;
            }

            const dlData = await dlResp.json();
            studyId = dlData.data?.studyId;
            send('step_complete', { index: qi, step: 'downloading', studyId });
          } catch (err) {
            send('step_error', { index: qi, step: 'downloading', error: String(err) });
            results.push({ query, status: 'download_error', title: study.title, error: String(err) });
            continue;
          }

          if (!studyId) {
            send('query_complete', { index: qi, query, status: 'no_study_id', title: study.title });
            results.push({ query, status: 'no_study_id', title: study.title });
            continue;
          }

          // Step 3: Extract with Gemini
          send('step', { index: qi, step: 'extracting', studyId });
          try {
            const extractResp = await fetch(`${supabaseUrl}/functions/v1/gemini-file-search`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`,
              },
              body: JSON.stringify({ studyId, mode: 'extract' }),
            });

            if (!extractResp.ok) {
              const errText = await extractResp.text();
              send('step_error', { index: qi, step: 'extracting', error: errText });
              // Continue anyway, triplets might still work
            } else {
              send('step_complete', { index: qi, step: 'extracting' });
            }
          } catch (err) {
            send('step_error', { index: qi, step: 'extracting', error: String(err) });
          }

          // Step 4: Generate triplets
          send('step', { index: qi, step: 'generating_triplets', studyId });
          let tripletsGenerated = 0;
          try {
            const tripResp = await fetch(`${supabaseUrl}/functions/v1/generate-triplets`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`,
              },
              body: JSON.stringify({ studyId }),
            });

            if (!tripResp.ok) {
              const errText = await tripResp.text();
              send('step_error', { index: qi, step: 'generating_triplets', error: errText });
            } else {
              const tripData = await tripResp.json();
              tripletsGenerated = tripData.triplets_saved || tripData.count || 0;
              totalTripletsCreated += tripletsGenerated;
              send('step_complete', { index: qi, step: 'generating_triplets', count: tripletsGenerated });
            }
          } catch (err) {
            send('step_error', { index: qi, step: 'generating_triplets', error: String(err) });
          }

          // Step 5: Auto-approve triplets >= threshold
          send('step', { index: qi, step: 'auto_approving', threshold });
          let approvedCount = 0;
          try {
            // Get triplets for this study
            const { data: triplets } = await supabase
              .from('triplet_extractions')
              .select('id, extraction_confidence, curation_status')
              .eq('study_id', studyId)
              .is('curation_status', null);

            if (triplets && triplets.length > 0) {
              const toApprove = triplets.filter(
                (t: any) => (t.extraction_confidence || 0) >= threshold
              );

              if (toApprove.length > 0) {
                const { error: approveErr } = await supabase
                  .from('triplet_extractions')
                  .update({ curation_status: 'approved' })
                  .in('id', toApprove.map((t: any) => t.id));

                if (!approveErr) {
                  approvedCount = toApprove.length;
                  totalTripletsApproved += approvedCount;
                }
              }
            }

            // Mark study as approved
            await supabase
              .from('processed_studies')
              .update({ kanban_status: 'approved' })
              .eq('id', studyId);

            send('step_complete', { index: qi, step: 'auto_approving', approved: approvedCount });
          } catch (err) {
            send('step_error', { index: qi, step: 'auto_approving', error: String(err) });
          }

          // Step 6: Consolidate knowledge graph
          send('step', { index: qi, step: 'consolidating' });
          try {
            const consResp = await fetch(`${supabaseUrl}/functions/v1/consolidate-knowledge-graph`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`,
              },
              body: JSON.stringify({ studyId }),
            });

            if (consResp.ok) {
              send('step_complete', { index: qi, step: 'consolidating' });
            } else {
              const errText = await consResp.text();
              send('step_error', { index: qi, step: 'consolidating', error: errText });
            }
          } catch (err) {
            send('step_error', { index: qi, step: 'consolidating', error: String(err) });
          }

          // Step 7: Sync to Neo4j
          send('step', { index: qi, step: 'syncing_neo4j', studyId });
          try {
            const syncResp = await fetch(`${supabaseUrl}/functions/v1/sync-study-to-neo4j`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`,
              },
              body: JSON.stringify({ studyId }),
            });

            if (syncResp.ok) {
              send('step_complete', { index: qi, step: 'syncing_neo4j' });
            } else {
              const errText = await syncResp.text();
              send('step_error', { index: qi, step: 'syncing_neo4j', error: errText });
            }
          } catch (err) {
            send('step_error', { index: qi, step: 'syncing_neo4j', error: String(err) });
          }

          // Only mark as success if triplets were actually generated
          if (tripletsGenerated === 0) {
            // Mark study as error instead of approved
            await supabase
              .from('processed_studies')
              .update({ kanban_status: 'error', error_message: 'No triplets generated (possible timeout or empty extraction)' })
              .eq('id', studyId);

            send('query_complete', {
              index: qi,
              query,
              status: 'error_no_triplets',
              title: study.title,
              studyId,
              tripletsGenerated: 0,
              tripletsApproved: 0,
            });

            results.push({
              query,
              status: 'error_no_triplets',
              title: study.title,
              studyId,
            });
            continue;
          }

          totalStudiesProcessed++;
          send('query_complete', {
            index: qi,
            query,
            status: 'success',
            title: study.title,
            studyId,
            tripletsGenerated,
            tripletsApproved: approvedCount,
          });

          results.push({
            query,
            status: 'success',
            title: study.title,
            studyId,
            tripletsGenerated,
            tripletsApproved: approvedCount,
          });
        }

        send('complete', {
          totalStudiesProcessed,
          totalTripletsCreated,
          totalTripletsApproved,
          results,
        });

      } catch (err) {
        send('error', { message: String(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
});
