import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

interface SetBody { action: 'set'; key_name: string; source_id: string; value: string; description?: string }
interface DeleteBody { action: 'delete'; key_name: string }
interface TestBody { action: 'test'; key_name: string }

// Lightweight ping per known key (best-effort)
async function pingProvider(keyName: string, value: string): Promise<{ ok: boolean; message: string }> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 5000);
  try {
    let res: Response;
    switch (keyName) {
      case 'NLM_UMLS_API_KEY':
        res = await fetch(`https://uts-ws.nlm.nih.gov/rest/search/current?string=diabetes&apiKey=${encodeURIComponent(value)}&pageSize=1`, { signal: ctl.signal });
        break;
      case 'NCBI_API_KEY':
        res = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/einfo.fcgi?db=pubmed&api_key=${encodeURIComponent(value)}`, { signal: ctl.signal });
        break;
      case 'PERPLEXITY_API_KEY':
        res = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          signal: ctl.signal,
          headers: { 'Authorization': `Bearer ${value}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'sonar', messages: [{ role: 'user', content: 'ping' }], max_tokens: 1 }),
        });
        break;
      case 'OPENAI_API_KEY':
        res = await fetch('https://api.openai.com/v1/models', { signal: ctl.signal, headers: { 'Authorization': `Bearer ${value}` } });
        break;
      case 'GOOGLE_AI_API_KEY':
        res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(value)}`, { signal: ctl.signal });
        break;
      default:
        return { ok: true, message: 'Saved (no live test for this key)' };
    }
    const text = await res.text().catch(() => '');
    return res.ok
      ? { ok: true, message: `HTTP ${res.status}` }
      : { ok: false, message: `HTTP ${res.status}${text ? ` — ${text.slice(0, 120)}` : ''}` };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  } finally {
    clearTimeout(timer);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) return json({ error: 'Missing bearer token' }, 401);
    const token = authHeader.slice(7);

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
    const MASTER = Deno.env.get('API_KEYS_ENCRYPTION_KEY');
    if (!MASTER) return json({ error: 'API_KEYS_ENCRYPTION_KEY not configured' }, 500);

    // Validate user + admin
    const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: userData, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !userData?.user) return json({ error: 'Invalid session' }, 401);
    const userId = userData.user.id;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: roleRow } = await admin.from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin').maybeSingle();
    if (!roleRow) return json({ error: 'Admin role required' }, 403);

    const body = await req.json() as SetBody | DeleteBody | TestBody;

    if (body.action === 'set') {
      if (!body.key_name || !body.source_id || !body.value || body.value.length < 4) {
        return json({ error: 'key_name, source_id and value (min 4 chars) are required' }, 400);
      }
      const { error } = await admin.rpc('encrypt_api_key', {
        p_key_name: body.key_name,
        p_source_id: body.source_id,
        p_value: body.value,
        p_master_key: MASTER,
        p_description: body.description ?? null,
        p_user: userId,
      });
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    if (body.action === 'delete') {
      const { error } = await admin.from('api_keys').delete().eq('key_name', body.key_name);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    if (body.action === 'test') {
      const { data: dec, error: decErr } = await admin.rpc('decrypt_api_key', {
        p_key_name: body.key_name,
        p_master_key: MASTER,
      });
      if (decErr) return json({ error: decErr.message }, 500);
      if (!dec) return json({ error: 'Key not found' }, 404);

      const result = await pingProvider(body.key_name, dec as string);
      await admin.from('api_keys').update({
        last_tested_at: new Date().toISOString(),
        last_test_status: result.ok ? 'ok' : 'error',
        last_test_message: result.message,
      }).eq('key_name', body.key_name);

      return json({ ok: result.ok, message: result.message });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});