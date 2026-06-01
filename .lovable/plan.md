## Escopo aprovado: Abordagem A (mascarar + travar por role) + registro de B no kanban

### Mudanças a implementar agora

**1. `supabase/functions/ai-config/index.ts` — endurecer a função**
- Adicionar checagem de admin em TODAS as chamadas (GET, POST `get`, POST `set`, POST `test-neo4j`):
  - Ler `Authorization: Bearer <jwt>`, validar via `supabase.auth.getClaims(token)` → obter `userId`.
  - Consultar `public.user_roles` com service role: `user_id = userId AND role = 'admin'`.
  - Sem admin → `403 Forbidden`. Sem token → `401 Unauthorized`.
- Definir `SENSITIVE_KEY_PATTERN = /(_api_key|_password|_secret|_token)$/i`.
- No `GET`:
  - Para chaves sensíveis, devolver apenas máscara `"••••••••XXXX"` (últimos 4) em vez do valor cru.
  - Adicionar `_meta: { [key]: { is_set, last4, updated_at } }` para a UI mostrar status sem precisar do valor.
  - Chaves não-sensíveis (`neo4j_uri`, `neo4j_username`, prompts, model preferences) continuam voltando crus.
- No `POST action='get'`: bloquear leitura individual de chave sensível (`403`). Continua permitido para não-sensíveis.
- No `POST action='set'`: rejeitar (`400`) se o `value` enviado começar com `"••••"` (evita sobrescrever a chave real com o placeholder visual quando admin clica "Salvar" sem ter digitado nada).
- Remover qualquer `console.log` que imprima `config_value` para chaves sensíveis (já evitado, revisar).

**2. `src/components/administrador/ConfiguracoesIATab.tsx` — ajuste mínimo**
- Em `saveConfigToSupabase`: se `value.startsWith('••••')`, fazer early-return (não chamar a function). Evita o caso UX em que o admin salva sem editar e a validação de formato falha.
- Não precisa redesenhar a tela: o input continua aparecendo, só que pré-preenchido com a máscara. Para trocar a chave, admin apaga e cola a nova. Status visual em `ConfigurationsSummary` continua funcionando porque a máscara é truthy (`isConfigured: true`).

**3. `ConfigurationsSummary.tsx`**
- Sem mudança obrigatória. O botão "Mostrar tudo" passará a revelar `"••••3a2f"` em vez da chave real — esse é exatamente o comportamento desejado.
- (Opcional pós-A) usar `data._meta[key].updated_at` para mostrar "última rotação em…". Não bloqueante.

**4. `.gitignore`** — Lovable marca esse arquivo como read-only no sandbox. Vou tentar a edição; se falhar, abro um aviso pedindo que você adicione manualmente:
```
.env
.env.*
!.env.example
```
Lembrando: hoje o `.env` só tem `VITE_SUPABASE_*` (publicáveis), então o risco real é higiene/futuro — não é exfiltração ativa.

**5. `CHANGELOG.md` — registrar A como feito e B como kanban**
Entrada em `[Unreleased]`:
- `Security` → "ai-config edge function agora exige role admin via JWT e devolve apenas máscara (`••••XXXX`) para chaves sensíveis. Bloqueia leitura individual e salvamento de placeholder. `.env` adicionado ao `.gitignore`."
- Nova seção `Backlog` (ou item dentro de `Unreleased → Planned`):
  - "**[Kanban / Próximo ciclo de segurança]** Migrar segredos de `ai_configurations` para Supabase Secrets (Lovable Cloud). Refatorar edge functions consumidoras (`openai`, `claude`, `gemini`, `perplexity`, `neo4j`) para ler via `Deno.env.get`/helper `getApiKey`. Reescrever `ConfiguracoesIATab` como painel de status (sem inputs de chave). Limpar linhas de segredo da tabela após migração. Justificativa: elimina superfície de exposição residual via service role."
- Rodar `npm run sync:changelog` ao final.

### Fora do escopo (confirmado: B fica só registrada, sem implementação agora)
- Não mexer em `useAIConfig.ts` nem `useVetGraphRAGConfig.ts` (já são protegidos por RLS de admin na tabela e só leem chaves não-sensíveis ou são usados em contexto admin).
- Não mover segredos para Supabase Secrets nesta rodada.
- Não tocar nas edge functions consumidoras (openai, claude, etc.).

### Validação após deploy
1. Logado como admin: abrir `/administrador?tab=external-sources` (ou a aba "Configurações IA"). Esperado: campos pré-preenchidos com `"••••XXXX"`, status "Configurada", botão de teste Neo4j funcionando.
2. Logado como tutor/vet (não-admin): chamar `supabase.functions.invoke('ai-config', { method: 'GET' })` no console. Esperado: `403 Forbidden`.
3. Como admin, clicar "Salvar" sem editar um campo sensível: esperado no-op (early-return), nenhuma chamada à function.
4. Como admin, colar uma nova chave válida: esperado `200`, valor real salvo no DB.

Pode confirmar para eu sair do plan mode e aplicar?