import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AuditIssue {
  type: 'hardcoded' | 'missing-key' | 'incomplete-translation';
  file: string;
  line: number;
  text: string;
  severity: 'high' | 'medium' | 'low';
}

interface AuditReport {
  timestamp: string;
  summary: {
    totalFiles: number;
    totalIssues: number;
    hardcodedTexts: number;
    missingKeys: number;
    incompleteTranslations: number;
    dbTranslationsLoaded: number;
  };
  issues: AuditIssue[];
}

// Helper to get all keys from nested object
function getAllKeys(obj: any, prefix = ''): string[] {
  let keys: string[] = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys = keys.concat(getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

// Merge translations (DB overrides JSON)
function mergeTranslations(staticT: any, dynamicT: any): any {
  const merged = { ...staticT };

  Object.keys(dynamicT).forEach((key) => {
    if (typeof dynamicT[key] === 'object' && !Array.isArray(dynamicT[key])) {
      merged[key] = mergeTranslations(merged[key] || {}, dynamicT[key]);
    } else {
      merged[key] = dynamicT[key];
    }
  });

  return merged;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔍 Starting translation audit (Edge Function)...');

    // 1. Load static translations from JSON files
    // Note: In production, you'd need to fetch these from your repo or storage
    const ptStaticResponse = await fetch(`${supabaseUrl.replace('https://', 'https://raw.githubusercontent.com/yourusername/yourrepo/main/')}/src/locales/pt/translation.json`);
    const enStaticResponse = await fetch(`${supabaseUrl.replace('https://', 'https://raw.githubusercontent.com/yourusername/yourrepo/main/')}/src/locales/en/translation.json`);
    
    // Fallback: use empty objects if files not accessible
    const ptStaticTranslations = ptStaticResponse.ok ? await ptStaticResponse.json() : {};
    const enStaticTranslations = enStaticResponse.ok ? await enStaticResponse.json() : {};

    // 2. Load translations from database
    const { data: dbData, error: dbError } = await supabase
      .from('translations')
      .select('key, locale, value')
      .order('updated_at', { ascending: true });

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    // Organize DB translations by locale
    const dbTranslations: { pt: any; en: any } = { pt: {}, en: {} };
    let dbCount = 0;

    if (dbData && dbData.length > 0) {
      dbCount = dbData.length;
      dbData.forEach((row) => {
        const keys = row.key.split('.');
        let current = dbTranslations[row.locale as 'pt' | 'en'];

        // Create nested structure
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) {
            current[keys[i]] = {};
          }
          current = current[keys[i]];
        }

        // Set final value
        current[keys[keys.length - 1]] = row.value;
      });
    }

    // 3. Merge translations (DB overrides static)
    const ptTranslations = mergeTranslations(ptStaticTranslations, dbTranslations.pt);
    const enTranslations = mergeTranslations(enStaticTranslations, dbTranslations.en);

    // 4. Extract all keys
    const ptKeys = new Set(getAllKeys(ptTranslations));
    const enKeys = new Set(getAllKeys(enTranslations));

    console.log(`📊 Keys loaded: PT=${ptKeys.size}, EN=${enKeys.size}, DB=${dbCount}`);

    // 5. Find incomplete translations
    const issues: AuditIssue[] = [];

    // Keys in PT but not in EN
    ptKeys.forEach(key => {
      if (!enKeys.has(key)) {
        issues.push({
          type: 'incomplete-translation',
          file: 'src/locales/en/translation.json',
          line: 0,
          text: `Missing EN translation for: ${key}`,
          severity: 'high'
        });
      }
    });

    // Keys in EN but not in PT
    enKeys.forEach(key => {
      if (!ptKeys.has(key)) {
        issues.push({
          type: 'incomplete-translation',
          file: 'src/locales/pt/translation.json',
          line: 0,
          text: `Missing PT translation for: ${key}`,
          severity: 'high'
        });
      }
    });

    // 6. Create report
    const report: AuditReport = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFiles: 0, // Edge function doesn't scan files
        totalIssues: issues.length,
        hardcodedTexts: 0,
        missingKeys: 0,
        incompleteTranslations: issues.length,
        dbTranslationsLoaded: dbCount
      },
      issues: issues.sort((a, b) => {
        const severityOrder = { high: 0, medium: 1, low: 2 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      })
    };

    // 7. Save to database
    const { data: savedReport, error: saveError } = await supabase
      .from('audit_reports')
      .insert({
        report_data: report,
        created_by: null // System-generated
      })
      .select()
      .single();

    if (saveError) {
      console.error('⚠️ Failed to save report to database:', saveError.message);
    } else {
      console.log(`✅ Report saved to database (ID: ${savedReport.id})`);
    }

    // 8. Return report
    return new Response(
      JSON.stringify({
        success: true,
        report,
        saved: !saveError
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('❌ Error in audit function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
