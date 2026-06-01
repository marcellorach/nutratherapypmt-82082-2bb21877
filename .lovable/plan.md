
# Hub de APIs Externas — Autossuficiente

Objetivo: você nunca mais precisa abrir o Lovable Cloud para gerenciar chaves de API. Tudo (cadastro, teste, status, documentação) vive na tab **Fontes Externas**.

## 1. Explicação no topo do Overview (colapsável)

Novo componente `OverviewIntro.tsx` — card shadcn `Collapsible`, aberto por padrão na primeira visita (salva estado em `localStorage`), com 4 seções:

- **O que é esta página** — Hub central das 7 APIs externas (PubMed, Semantic Scholar, OpenAlex, Europe PMC, Crossref, Unpaywall, OpenFDA) que alimentam a base de conhecimento.
- **Como operar** — Fluxo em 4 passos: (1) gerar chave no site do provedor, (2) colar no campo da API, (3) clicar em "Testar conexão", (4) status fica 🟢.
- **Como ler os status** — 🟢 conectado · 🟡 chave salva mas sem teste · 🔴 erro no último teste · ⚪ sem chave (APIs públicas funcionam sem chave, com rate-limit menor).
- **Quando depurar** — checklist: rate-limit excedido (429), chave expirada (401/403), API fora do ar, formato inválido. Botão "Ver logs" abre os logs da edge function `external-sources-status`.

## 2. Tabela `api_keys` (criptografada, admin-only)

Migration SQL com `pgcrypto`:

```sql
CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name text UNIQUE NOT NULL,           -- ex: PUBMED_API_KEY
  source_id text NOT NULL,                 -- ex: pubmed
  encrypted_value bytea NOT NULL,          -- pgp_sym_encrypt
  description text,
  last_tested_at timestamptz,
  last_test_status text,                   -- ok | error | untested
  last_test_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- View pública SEM o encrypted_value
CREATE VIEW public.api_keys_public AS
SELECT id, key_name, source_id, description, last_tested_at,
       last_test_status, last_test_message, created_at, updated_at,
       (encrypted_value IS NOT NULL) AS is_set
FROM public.api_keys;

GRANT SELECT ON public.api_keys_public TO authenticated;
GRANT ALL ON public.api_keys TO service_role;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage api_keys" ON public.api_keys
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
```

`decrypt_api_key(p_key_name text)` — função `SECURITY DEFINER`, só executável por `service_role`, usa `API_KEYS_ENCRYPTION_KEY` (já salvo) via `pgp_sym_decrypt`.

## 3. Edge functions

- **`api-keys-manage`** (admin-only via JWT + `has_role`):
  - `{ action: 'set', key_name, source_id, value }` → `pgp_sym_encrypt` + upsert
  - `{ action: 'delete', key_name }`
  - `{ action: 'test', key_name }` → decifra, faz ping leve no provedor, grava `last_test_*`
- **`external-sources-status`** (já existe) — refatorado para ler `api_keys_public` (campo `is_set`) em vez de só `Deno.env.get()`, e usar `getApiKey()` para os testes ativos. Retorna por fonte: nome, ícone, status, `feeds[]` (o que alimenta), `tables[]`, link "Gerar chave", docs.
- **`_shared/get-api-key.ts`** — helper: tenta `decrypt_api_key` na DB, fallback para `Deno.env.get()` (compatibilidade).
- Refatorar as 5 edge functions que hoje usam `Deno.env.get('PUBMED_API_KEY')` etc. para usar `getApiKey()`.

## 4. UI — `ApiKeysPanel.tsx` (substitui `SecretsPanel.tsx`)

Um card expansível por API, contendo:
- Ícone + nome + badge de status (🟢🟡🔴⚪)
- **O que esta API alimenta** (lista dinâmica de `feeds[]`)
- Link "🔗 Gerar chave" (abre site do provedor em nova aba)
- Input `type="password"` + botão "Salvar"
- Botão "Testar conexão" → mostra resultado inline
- Botão "Remover chave" (com confirmação)
- Último teste: data + mensagem

Hook `useApiKeys.ts` com React Query (lista de `api_keys_public` + mutations para set/delete/test).

## 5. Arquivos

**Novos:** migration SQL · `api-keys-manage/index.ts` · `_shared/get-api-key.ts` · `OverviewIntro.tsx` · `ApiKeysPanel.tsx` · `useApiKeys.ts`

**Editados:** `OverviewTab.tsx` (adiciona `OverviewIntro` no topo) · `ExternalSourcesHub.tsx` (substitui `SecretsPanel` por `ApiKeysPanel`) · `external-sources-status/index.ts` · 5 edge functions migráveis · `translation.json` PT/EN (~50 chaves) · `i18n.ts` (bump versão) · `CHANGELOG.md` · `projectOrganograma.ts` (se necessário)

**Removidos:** `SecretsPanel.tsx`

## 6. Segurança

- `encrypted_value` nunca exposto via PostgREST (só `api_keys_public` é selecionável)
- Decifragem só via edge function com `service_role`
- RLS exige `is_admin()` para escrita
- Input UI sempre `type="password"`
- Se `API_KEYS_ENCRYPTION_KEY` vazar, rotacionar todas as chaves armazenadas

## 7. Fora de escopo

Rotação automática, histórico de auditoria por chave, failover entre múltiplas chaves da mesma API.
