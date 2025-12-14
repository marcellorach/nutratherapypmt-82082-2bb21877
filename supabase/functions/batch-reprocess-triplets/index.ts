import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BatchReprocessRequest {
  studyIds: string[];
  deleteExisting?: boolean;
}

/**
 * Batch Reprocess Triplets Edge Function
 * Deletes existing triplets for specified studies and regenerates them
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { studyIds, deleteExisting = true }: BatchReprocessRequest = await req.json();

    if (!studyIds || !Array.isArray(studyIds) || studyIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'studyIds array is required and must not be empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Limit batch size
    if (studyIds.length > 10) {
      return new Response(
        JSON.stringify({ error: 'Maximum 10 studies can be reprocessed at once' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`🔄 Starting batch reprocess for ${studyIds.length} studies...`);

    const results: Array<{
      studyId: string;
      status: 'success' | 'error';
      deletedTriplets?: number;
      deletedEdges?: number;
      newTriplets?: number;
      error?: string;
    }> = [];

    for (const studyId of studyIds) {
      try {
        console.log(`📄 Processing study: ${studyId}`);

        // Step 1: Delete existing triplets and edges if requested
        let deletedTriplets = 0;
        let deletedEdges = 0;

        if (deleteExisting) {
          // Get triplet IDs first
          const { data: existingTriplets } = await supabase
            .from('triplet_extractions')
            .select('id')
            .eq('study_id', studyId);

          const tripletIds = existingTriplets?.map(t => t.id) || [];

          // Delete hierarchical_edges that reference these triplets
          if (tripletIds.length > 0) {
            const { count: edgeCount } = await supabase
              .from('hierarchical_edges')
              .delete({ count: 'exact' })
              .in('triplet_id', tripletIds);
            
            deletedEdges = edgeCount || 0;
          }

          // Delete triplets
          const { count: tripletCount } = await supabase
            .from('triplet_extractions')
            .delete({ count: 'exact' })
            .eq('study_id', studyId);

          deletedTriplets = tripletCount || 0;

          console.log(`   🗑️ Deleted ${deletedTriplets} triplets and ${deletedEdges} edges`);
        }

        // Step 2: Call generate-triplets function
        const generateResponse = await fetch(`${supabaseUrl}/functions/v1/generate-triplets`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ studyId })
        });

        if (!generateResponse.ok) {
          const errorText = await generateResponse.text();
          throw new Error(`Generate triplets failed: ${errorText}`);
        }

        const generateResult = await generateResponse.json();

        results.push({
          studyId,
          status: 'success',
          deletedTriplets,
          deletedEdges,
          newTriplets: generateResult.tripletsGenerated || 0
        });

        console.log(`   ✅ Generated ${generateResult.tripletsGenerated || 0} new triplets`);

      } catch (error: any) {
        console.error(`   ❌ Error processing study ${studyId}:`, error.message);
        results.push({
          studyId,
          status: 'error',
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    const totalNewTriplets = results.reduce((sum, r) => sum + (r.newTriplets || 0), 0);

    console.log(`🎉 Batch reprocess complete: ${successCount} success, ${errorCount} errors, ${totalNewTriplets} total triplets generated`);

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          total: studyIds.length,
          success: successCount,
          errors: errorCount,
          totalNewTriplets
        },
        results
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in batch-reprocess-triplets:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.toString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
