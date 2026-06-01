## Escopo aprovado: corrigir auto-auditor v7.0.1 (4.1-A) + teste CI de órfãos (4.2)

_(itens 4.3 deprecação de `medical_knowledge_graph[_edges]` e 4.4 expansão de `lab_reference_ranges` foram adiados; ficam registrados no CHANGELOG/Backlog mas sem implementação agora.)_

### O que vai mudar

**1. `supabase/functions/generate-audit/index.ts` — corrigir nomes e marcar tabelas inexistentes**
- Substituir o array `tableNames` por `tableSpecs: { label, table }[]`, mantendo os rótulos históricos da auditoria mas resolvendo para os nomes canônicos:
  - `studies → processed_studies` (+ adicionar `scientific_studies` separado)
  - `pets → pet_profiles`
  - `lab_ranges → lab_reference_ranges`
  - `medical_knowledge_graph_edges → medical_knowledge_edges`
  - Demais nomes seguem (já corretos).
- Quando `service.from(table).select(..., { count: "exact", head: true })` retornar `error` (caso típico: relação inexistente), gravar `counts[label] = null` e empilhar uma string descritiva em `snapshot.unknown_tables`. O prompt da auditoria passa a distinguir "tabela ausente" de "zero linhas" — elimina a classe de falso positivo da v7.0.1.
- Atualizar dois rótulos descritivos no checklist (linhas 125 e 137): `lab_ranges → lab_reference_ranges`, `flag is_demo em pets → flag is_demo em pet_profiles`.

**2. `scripts/__tests__/db-referential-integrity.test.mjs` — novo teste CI de órfãos**
- Padrão idêntico aos demais (`vitest` + `node:child_process`).
- Para cada par filho→pai abaixo, rodar `psql -tAc "SELECT COUNT(*) FROM <child> c LEFT JOIN <parent> p ON p.id=c.<fk> WHERE p.id IS NULL"` e exigir `=== 0`:
  - `pet_exams → pet_profiles`
  - `pet_consultations → pet_profiles`
  - `pet_conditions → pet_profiles`
  - `pet_medications → pet_profiles`
  - `study_embeddings → processed_studies`
  - `triplet_extractions → processed_studies`
- O teste faz `it.skip` quando `process.env.PGHOST` não estiver presente — assim roda no sandbox/local sem quebrar CI que não tem acesso ao Postgres.
- Garante regressão futura: se alguém trocar `ON DELETE CASCADE` por `NO ACTION`/`SET NULL` e gerar órfãos, o teste falha.

**3. CHANGELOG**
- Em `[Unreleased]`:
  - `Fixed` — "Auto-auditor (`generate-audit`) usava nomes legados (`pets`, `studies`, `lab_ranges`, `medical_knowledge_graph_edges`) e reportava `0` para tabelas que não existem. Agora resolve para os nomes canônicos e diferencia `unknown_tables` de `0 rows`. Corrige a classe de falso positivo da v7.0.1."
  - `Added` — "Teste CI `scripts/__tests__/db-referential-integrity.test.mjs` verifica zero órfãos em filhos de `pet_profiles` e `processed_studies` (CASCADE)."
- Manter no **Backlog**:
  - "Deprecar tabelas `medical_knowledge_graph` / `medical_knowledge_edges` (modelo legado — KG vivo já é `hierarchical_edges` + Neo4j)."
  - "Expandir `lab_reference_ranges` para 200+ analitos canino com curadoria veterinária (hoje: 31 linhas)."
- Rodar `npm run sync:changelog`.

**4. Deploy + re-auditoria**
- Deploy de `generate-audit`.
- Pedir para você (ou eu disparar via UI quando indicar) re-rodar a auditoria; comparar `snapshot.counts` com os valores reais (`pets: 728`, `studies: 59`, `lab_ranges: 31`, `medical_knowledge_*: 0` legítimo).

### Fora do escopo (confirmado)
- Não mexer em `medical_knowledge_graph[_edges]` (deprecação adiada).
- Não popular `lab_reference_ranges` (expansão adiada).
- Não tocar em FKs/CASCADE (já corretas; zero órfãos hoje).

Pode confirmar para sair do plan mode e aplicar?

---

## Histórico: Escopo anterior já entregue (Abordagem A — mascarar + travar por role)

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

_(escopo anterior — concluído e mantido como referência histórica)_