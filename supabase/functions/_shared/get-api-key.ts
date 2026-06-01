// Resolves an API key by name. Checks the encrypted api_keys table first
// (via decrypt_api_key RPC), then falls back to the environment variable.
// Use this in edge functions so admins can rotate keys from the in-app UI
// without redeploying.
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

let cachedClient: SupabaseClient | null = null;

function admin(): SupabaseClient {
  if (cachedClient) return cachedClient;
  cachedClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  return cachedClient;
}

const memo = new Map<string, { value: string | null; at: number }>();
const TTL_MS = 60_000;

export async function getApiKey(keyName: string): Promise<string | null> {
  const cached = memo.get(keyName);
  if (cached && Date.now() - cached.at < TTL_MS) return cached.value;

  const master = Deno.env.get('API_KEYS_ENCRYPTION_KEY');
  let value: string | null = null;

  if (master) {
    try {
      const { data } = await admin().rpc('decrypt_api_key', { p_key_name: keyName, p_master_key: master });
      if (typeof data === 'string' && data.length > 0) value = data;
    } catch (_) { /* fallthrough */ }
  }

  if (!value) value = Deno.env.get(keyName) ?? null;

  memo.set(keyName, { value, at: Date.now() });
  return value;
}