
## Objetivo

Permitir que o admin gerencie chaves de APIs externas **inteiramente dentro do app**, sem precisar abrir o painel do Lovable Cloud. Mais o bloco explicativo minimizável no topo da Visão Geral.

---

## 1. Bloco explicativo no topo (minimizável)

Novo componente `OverviewIntro.tsx` como primeiro filho do Overview, dentro de `<Collapsible>` (shadcn), **aberto por padrão na primeira visita** (estado em `localStorage: extSources.introOpen`).

Conteúdo (PT/EN, via `t()`):
- **O que é esta página** — hub único das 7 fontes externas (UMLS, SNOMED, MeSH, OMIA, ChEBI, PubMed, Perplexity).
- **Como ler os cards de status** — legenda: 🟢 Conectado · 🟡 Sem chave (opcional) · 🔴 Sem chave (obrigatório) · ⚪ Erro/timeout. Explica `last_sync`, `entries`, `latency_ms`.
- **Fluxo operacional em 4 passos** — (1) Identificar API faltando, (2) clicar "Gerar chave" → abre site oficial, (3) colar no campo do app + Salvar, (4) status fica verde + usar sub-aba correspondente.
- **Quando depurar** — checklist: card vermelho persistente → "Testar conexão", verificar quota, ver logs da edge function `external-sources-status`.
- **O que NÃO é gerenciado aqui** — raças, drogas/condições base, prompts da IA.

---

## 2. Tabela `api_keys` no Postgres (criptografada, admin-only)

### Migração

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name text NOT NULL UNIQUE,           -- ex.: 'NLM_UMLS_API_KEY'
  encrypted_value bytea NOT NULL,           -- pgp_sym_encrypt(value, key)
  description text,
  source_id text,                           -- 'umls' | 'ncbi' | 'perplexity' | ...
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  last_tested_at timestamptz,
  last_test_status text                     -- 'ok' | 'fail' | null
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_keys TO authenticated;
GRANT ALL ON public.api_keys TO service_role;

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Apenas admins veem METADATA (nunca o encrypted_value pela API direta — só via edge function)
CREATE POLICY "Admins read api_keys metadata"
  ON public.api_keys FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins write api_keys"
  ON public.api_keys FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TRIGGER trg_api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

**Criptografia:** valores criptografados via `pgp_sym_encrypt(value, encryption_key)`. A `encryption_key` é um novo secret `API_KEYS_ENCRYPTION_KEY` (32 bytes random) que vou pedir para você adicionar **uma única vez** via `add_secret`. Essa é a única chave que continua morando no Cloud — depois disso, todas as outras chaves de API ficam no app.

> **IMPORTANTE para segurança:** o frontend NUNCA recebe `encrypted_value`. A coluna nem é exposta via PostgREST select (uso `select` explícito sem o campo). Apenas as 2 edge functions abaixo descriptografam server-side.

### View pública para o frontend (sem o segredo)

```sql
CREATE VIEW public.api_keys_public AS
SELECT id, key_name, description, source_id, created_at, updated_at,
       last_tested_at, last_test_status,
       (encrypted_value IS NOT NULL) AS is_set
FROM public.api_keys;
GRANT SELECT ON public.api_keys_public TO authenticated;
```

---

## 3. Duas edge functions novas

### `api-keys-manage` (CRUD seguro)
- `POST { action: 'set', key_name, value }` → criptografa e faz upsert.
- `POST { action: 'delete', key_name }`.
- `POST { action: 'test', key_name }` → descriptografa, faz ping no provedor (UMLS, NCBI, Perplexity, ChEBI...), grava `last_test_status` + `last_tested_at`. Retorna `{ ok, latency_ms, error? }`.
- Valida `is_admin()` server-side via JWT.

### `external-api-proxy` (helper interno opcional, fase 2)
Não precisa agora — em vez disso, refatoro as edge functions existentes (`fetch-external-ontologies`, `kg-evidence-gap-fill`, `search-scientific-studies`, `query-perplexity`, `enrich-with-umls`) para uma função helper compartilhada `_shared/get-api-key.ts` que lê de `api_keys` primeiro e, se vazio, faz fallback para `Deno.env.get()` (compatibilidade com o estado atual).

```ts
// supabase/functions/_shared/get-api-key.ts
export async function getApiKey(name: string): Promise<string | null> {
  // 1. Tenta DB (descriptografa)
  const { data } = await supabase.rpc('decrypt_api_key', { p_name: name });
  if (data) return data;
  // 2. Fallback env (compat retroativa)
  return Deno.env.get(name) ?? null;
}
```

Com função SQL `SECURITY DEFINER`:
```sql
CREATE FUNCTION public.decrypt_api_key(p_name text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v text;
BEGIN
  SELECT pgp_sym_decrypt(encrypted_value, current_setting('app.encryption_key'))
    INTO v FROM public.api_keys WHERE key_name = p_name;
  RETURN v;
EXCEPTION WHEN OTHERS THEN RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION public.decrypt_api_key(text) FROM public, authenticated;
GRANT EXECUTE ON FUNCTION public.decrypt_api_key(text) TO service_role;
```

Apenas o `service_role` (usado pelas edge functions) pode descriptografar. `authenticated` (frontend) nunca consegue.

> **Nota técnica:** vou ajustar para passar a chave de criptografia via variável da sessão SQL setada pela edge function antes de chamar `decrypt_api_key`, evitando guardar em `current_setting` permanente.

---

## 4. UI: `ApiKeysPanel.tsx` (substitui `SecretsPanel.tsx`)

Painel com **um card expansível por API**, com tudo dentro do app:

| Campo | Conteúdo |
|---|---|
| Nome + ícone + status badge | Ex.: "UMLS Metathesaurus · 🟢 Conectado" |
| **O que alimenta** | Frase + lista de pipelines/tabelas (vem do `external-sources-status`) |
| **Link "Gerar chave"** | Abre URL oficial em nova aba (`docs_url`) |
| **Input + Salvar** | `<Input type="password">` + botão "Salvar" → chama `api-keys-manage` action=set |
| **Testar conexão** | Chama `api-keys-manage` action=test → atualiza badge |
| **Apagar** | Botão lixeira → action=delete |
| Status detalhado | "Última verificação: há 2 min · 320ms" |

Hook novo `useApiKeys.ts` com React Query para `api_keys_public` + mutations.

---

## 5. Ajustes em `external-sources-status` + `UsageMap`

- `external-sources-status` passa a consultar `api_keys_public.is_set` em vez de só `Deno.env.get()`, e usa `getApiKey()` para os testes ativos.
- Aceita `?source=umls` para teste pontual.
- Retorna `feeds[]` e `tables[]` por fonte (mover hardcoded do `UsageMap` para cá).
- `UsageMap.tsx` consome esses campos.

---

## 6. Migração suave (sem quebrar nada)

- Edge functions existentes continuam funcionando com env vars (fallback no `getApiKey`).
- Conforme o admin salva chaves na nova UI, elas passam a vir do DB automaticamente.
- Não removo nenhum secret do Cloud — eles ficam como backup.

---

## Arquivos afetados

**Novos:**
- Migração SQL (tabela `api_keys`, view, função `decrypt_api_key`)
- `supabase/functions/api-keys-manage/index.ts`
- `supabase/functions/_shared/get-api-key.ts`
- `src/components/administrador/external-sources/OverviewIntro.tsx`
- `src/components/administrador/external-sources/ApiKeysPanel.tsx`
- `src/hooks/useApiKeys.ts`

**Editados:**
- `src/components/administrador/external-sources/OverviewTab.tsx` (adiciona `OverviewIntro`, troca `SecretsPanel` → `ApiKeysPanel`)
- `src/components/administrador/external-sources/UsageMap.tsx` (consome dados do backend)
- `supabase/functions/external-sources-status/index.ts` (lê do DB + `?source=`)
- `supabase/functions/fetch-external-ontologies/index.ts`, `kg-evidence-gap-fill/index.ts`, `search-scientific-studies/index.ts`, `query-perplexity/index.ts`, `enrich-with-umls/index.ts` (usar `getApiKey` em vez de `Deno.env.get` para as chaves migráveis)
- `src/locales/{pt,en}/translation.json` (~40 chaves novas)
- `src/i18n.ts` (bump `I18N_VERSION` → 1.118.0)
- `CHANGELOG.md` + `npm run sync:changelog`

**Removido:**
- `SecretsPanel.tsx`

**Secret novo (peço via `add_secret`):**
- `API_KEYS_ENCRYPTION_KEY` (32 bytes random base64) — única chave que continua no Cloud.

---

## Considerações de segurança

- ✅ `encrypted_value` nunca exposto via PostgREST (view pública não inclui o campo).
- ✅ `decrypt_api_key` é `SECURITY DEFINER`, executável só por `service_role`.
- ✅ RLS exige `is_admin()` para metadata.
- ✅ Edge function `api-keys-manage` valida JWT + admin.
- ✅ Input do frontend é `type="password"` (não fica em logs do browser).
- ⚠️ Se `API_KEYS_ENCRYPTION_KEY` vazar, todas as chaves armazenadas precisam ser rotacionadas. Mitigação: a chave nunca aparece no frontend nem em logs.

---

## Fora do escopo (futuro)

- Rotação automática de `API_KEYS_ENCRYPTION_KEY`.
- Histórico de auditoria de quem trocou qual chave quando.
- Suporte a múltiplas chaves por provedor (failover).

---

**Pronto para implementar?** Vou começar pela migração SQL + pedir o `API_KEYS_ENCRYPTION_KEY` antes de seguir com o resto.
