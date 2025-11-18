import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    console.log('🔧 Starting fix-missing-keys edge function...');

    // Executa o script TypeScript usando Deno
    const command = new Deno.Command("npx", {
      args: ["tsx", "scripts/fix-missing-keys.ts"],
      stdout: "piped",
      stderr: "piped",
    });

    const { code, stdout, stderr } = await command.output();
    
    const stdoutText = new TextDecoder().decode(stdout);
    const stderrText = new TextDecoder().decode(stderr);

    console.log('📝 Script stdout:', stdoutText);
    if (stderrText) {
      console.error('⚠️ Script stderr:', stderrText);
    }

    if (code !== 0) {
      throw new Error(`Script failed with exit code ${code}: ${stderrText}`);
    }

    // Extrai o JSON de resultado do output
    const resultMatch = stdoutText.match(/📊 RESULT_JSON: (.+)/);
    let result = { fixed: 0, skipped: 0, keys: [] };
    
    if (resultMatch) {
      try {
        result = JSON.parse(resultMatch[1]);
      } catch (e) {
        console.error('Failed to parse result JSON:', e);
      }
    }

    console.log('✅ Fix completed:', result);

    // Agora re-executa o audit para atualizar o relatório
    console.log('🔍 Re-running translation audit...');
    
    const auditCommand = new Deno.Command("npx", {
      args: ["tsx", "scripts/audit-translations.ts"],
      stdout: "piped",
      stderr: "piped",
    });

    const auditOutput = await auditCommand.output();
    const auditStdout = new TextDecoder().decode(auditOutput.stdout);
    
    console.log('📝 Audit stdout:', auditStdout);
    console.log('✅ Audit complete');

    return new Response(
      JSON.stringify({
        success: true,
        fixed: result.fixed,
        skipped: result.skipped,
        keys: result.keys,
        message: `Successfully fixed ${result.fixed} missing translation keys`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Error in fix-missing-keys function:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
