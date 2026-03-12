import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conditions } = await req.json();

    if (!conditions || !Array.isArray(conditions) || conditions.length === 0) {
      return new Response(JSON.stringify({ error: 'conditions array is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const conditionNames = conditions.map((c: any) => c.condition_name || c.name || c);

    // 1. Treatments: compounds that TREATS/PREVENTS/INHIBITS/MODULATES/ACTIVATES each condition
    const treatmentResults: Record<string, any[]> = {};
    for (const condName of conditionNames) {
      const { data: treatments } = await supabase
        .from('triplet_extractions')
        .select('subject_name, subject_type, predicate, object_name, extraction_confidence, evidence_level, study_id')
        .ilike('object_name', `%${condName}%`)
        .in('predicate', ['TREATS', 'PREVENTS', 'AMELIORATES', 'INHIBITS', 'MODULATES', 'ACTIVATES'])
        .eq('curation_status', 'approved')
        .order('extraction_confidence', { ascending: false })
        .limit(20);

      treatmentResults[condName] = treatments || [];
    }

    // 2. Causal pathways: conditions connected via CAUSES, AGGRAVATES, LEADS_TO, TRIGGERS
    const allCausalLinks: any[] = [];
    for (const condName of conditionNames) {
      const { data: asObject } = await supabase
        .from('triplet_extractions')
        .select('subject_name, subject_type, predicate, object_name, object_type, extraction_confidence')
        .ilike('object_name', `%${condName}%`)
        .in('predicate', ['CAUSES', 'AGGRAVATES', 'LEADS_TO', 'TRIGGERS', 'ASSOCIATED_WITH'])
        .eq('curation_status', 'approved');

      const { data: asSubject } = await supabase
        .from('triplet_extractions')
        .select('subject_name, subject_type, predicate, object_name, object_type, extraction_confidence')
        .ilike('subject_name', `%${condName}%`)
        .in('predicate', ['CAUSES', 'AGGRAVATES', 'LEADS_TO', 'TRIGGERS', 'ASSOCIATED_WITH'])
        .eq('curation_status', 'approved');

      if (asObject) allCausalLinks.push(...asObject);
      if (asSubject) allCausalLinks.push(...asSubject);
    }

    // Deduplicate causal links
    const seenCausal = new Set<string>();
    const uniqueCausalLinks = allCausalLinks.filter(link => {
      const key = `${link.subject_name}|${link.predicate}|${link.object_name}`;
      if (seenCausal.has(key)) return false;
      seenCausal.add(key);
      return true;
    });

    // 3. Mechanisms: HAS_MECHANISM for each condition
    const mechanismResults: Record<string, any[]> = {};
    for (const condName of conditionNames) {
      const { data: mechanisms } = await supabase
        .from('triplet_extractions')
        .select('subject_name, predicate, object_name, extraction_confidence')
        .or(`subject_name.ilike.%${condName}%,object_name.ilike.%${condName}%`)
        .in('predicate', ['HAS_MECHANISM', 'MODULATES', 'ACTIVATES', 'INHIBITS'])
        .eq('curation_status', 'approved')
        .limit(10);

      mechanismResults[condName] = mechanisms || [];
    }

    // 4. Modulators: compounds that INHIBITS/MODULATES/ACTIVATES biological pathways linked to conditions
    const modulatorResults: Record<string, any[]> = {};
    for (const condName of conditionNames) {
      // Find pathways/mechanisms linked to this condition
      const { data: pathways } = await supabase
        .from('triplet_extractions')
        .select('subject_name, object_name')
        .or(`subject_name.ilike.%${condName}%,object_name.ilike.%${condName}%`)
        .in('predicate', ['HAS_MECHANISM', 'CAUSES', 'AGGRAVATES', 'LEADS_TO'])
        .eq('curation_status', 'approved')
        .limit(20);

      const pathwayNames = new Set<string>();
      (pathways || []).forEach((p: any) => {
        if (!p.subject_name.toLowerCase().includes(condName.toLowerCase())) {
          pathwayNames.add(p.subject_name);
        }
        if (!p.object_name.toLowerCase().includes(condName.toLowerCase())) {
          pathwayNames.add(p.object_name);
        }
      });

      // Find compounds that INHIBITS/MODULATES/ACTIVATES those pathways
      const modulators: any[] = [];
      for (const pathway of Array.from(pathwayNames).slice(0, 10)) {
        const { data: mods } = await supabase
          .from('triplet_extractions')
          .select('subject_name, subject_type, predicate, object_name, extraction_confidence')
          .ilike('object_name', `%${pathway}%`)
          .in('predicate', ['INHIBITS', 'MODULATES', 'ACTIVATES'])
          .eq('curation_status', 'approved')
          .limit(5);

        if (mods) modulators.push(...mods);
      }

      // Deduplicate
      const seen = new Set<string>();
      modulatorResults[condName] = modulators.filter(m => {
        const key = `${m.subject_name}|${m.predicate}|${m.object_name}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    // 5. Synergistic compounds: treat 2+ conditions
    const compoundConditionMap: Record<string, Set<string>> = {};
    for (const [condName, treatments] of Object.entries(treatmentResults)) {
      for (const t of treatments as any[]) {
        if (!compoundConditionMap[t.subject_name]) {
          compoundConditionMap[t.subject_name] = new Set();
        }
        compoundConditionMap[t.subject_name].add(condName);
      }
    }

    const synergisticCompounds = Object.entries(compoundConditionMap)
      .filter(([_, conditions]) => conditions.size >= 2)
      .map(([compound, conditions]) => ({
        compound,
        conditionsTreated: Array.from(conditions),
        coverageCount: conditions.size,
      }))
      .sort((a, b) => b.coverageCount - a.coverageCount);

    // 6. Build per-condition insights
    const conditionInsights = conditionNames.map((condName: string) => ({
      condition: condName,
      treatments: (treatmentResults[condName] || []).filter(
        (t: any) => ['TREATS', 'PREVENTS', 'AMELIORATES'].includes(t.predicate)
      ),
      modulators: [
        ...(treatmentResults[condName] || []).filter(
          (t: any) => ['INHIBITS', 'MODULATES', 'ACTIVATES'].includes(t.predicate)
        ),
        ...(modulatorResults[condName] || []),
      ],
      mechanisms: mechanismResults[condName] || [],
      causalLinks: uniqueCausalLinks.filter(
        (link) =>
          link.subject_name.toLowerCase().includes(condName.toLowerCase()) ||
          link.object_name.toLowerCase().includes(condName.toLowerCase())
      ),
    }));

    return new Response(
      JSON.stringify({
        conditionInsights,
        causalPathways: uniqueCausalLinks,
        synergisticCompounds,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('condition-insights error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
