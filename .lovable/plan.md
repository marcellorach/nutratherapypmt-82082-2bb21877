## Diagnóstico: por que "Predisposições" demora e os outros pulam

Em `src/pages/veterinario/PetProfilePage.tsx` (linhas 92–112), o handler `handleAnalyzeWithKG` faz isto:

```ts
setPipelineState(s => ({ ...s, stage1_profile: 'running' }));
await new Promise(r => setTimeout(r, 200));
setPipelineState(s => ({ ...s, stage1_profile: 'complete', stage2_predispositions: 'running' }));

const result = await runClinicalAnalysisPipeline(...);   // ← TUDO acontece aqui (estágios 2 a 6)

setPipelineState(s => ({
  ...s,
  stage2_predispositions: 'complete', stage3_labs: 'complete',
  stage4_kg: 'complete', stage5_interactions: 'complete', stage6_recommendation: 'complete',
}));
```

Ou seja: enquanto o `runClinicalAnalysisPipeline` (que roda os 5 estágios pesados — breed, labs, KG, interações, recomendação híbrida) executa em uma única `await`, o UI fica preso em **"Predisposições — processando..."**. Quando a Promise resolve, os 5 estágios viram `complete` no mesmo tick → parecem "instantâneos". O tempo real é 100% real, mas a UI não recebe os marcos intermediários.

O serviço `clinical-analysis-pipeline.ts` é monolítico hoje (uma `runClinicalAnalysisPipeline` que chama tudo internamente sem callbacks), por isso a página não tem como avançar os estágios.

---

## Plano

### 1. Emitir progresso real do pipeline (callbacks)

Em `src/services/clinical-analysis-pipeline.ts`:

- Adicionar um parâmetro opcional `onProgress` em `runClinicalAnalysisPipeline`:
  ```ts
  type StageId = 'stage2_predispositions' | 'stage3_labs' | 'stage4_kg' | 'stage5_interactions' | 'stage6_recommendation';
  type ProgressEvent =
    | { kind: 'stage-start'; stage: StageId; message: string }
    | { kind: 'stage-end';   stage: StageId; message: string; meta?: Record<string, any> }
    | { kind: 'log';         level: 'info'|'warn'|'success'|'error'; message: string };
  type OnProgress = (e: ProgressEvent) => void;
  ```
- Envolver cada bloco interno (`fetchBreedPredispositions`, `interpretLabResults`, `queryKnowledgeGraph`, `checkInteractions`, geração de recomendação híbrida) com `onProgress?.({ kind: 'stage-start', ... })` antes e `stage-end` depois, com contagens reais (raças encontradas, alertas, hits/misses do KG por condição, interações detectadas, compostos finais).
- Trocar os `console.log/warn` ruidosos do KG por chamadas a `onProgress({ kind: 'log', ... })` (mantendo um `console.debug` para devtools).

### 2. Consumir o progresso na página

Em `src/pages/veterinario/PetProfilePage.tsx`:

- Substituir o "completar tudo de uma vez" (linha 112) por um callback passado ao serviço:
  ```ts
  const result = await runClinicalAnalysisPipeline(profile, conditions, medications, exams, {
    onProgress: handlePipelineEvent,
  });
  ```
- `handlePipelineEvent` faz o `setPipelineState` apropriado (`running`/`complete`) por estágio E faz `appendLog(entry)` no novo painel de log.
- Garantir `flushSync`/`setTimeout(0)` apenas se necessário para evitar batching que esconda transições rápidas (na prática o KG e a recomendação levam centenas de ms cada, então o React renderiza naturalmente).

### 3. Painel de log estilo "Digestão Científica"

Criar `src/components/pet/ClinicalPipelineLogPanel.tsx`, inspirado em `NtaiActiveProcessingCard` / `NtaiProcessingSection`:

- Lista rolável com no máximo ~200 entradas, autoscroll para o fim.
- Cada entrada: timestamp `HH:MM:SS.mmm`, ícone por nível (✅ success, ℹ️ info, ⚠️ warn, ❌ error) + cor pastel discreta, e mensagem.
- Cabeçalho compacto com: stage atual, contador de eventos, botões "Limpar" e "Exportar .log" (texto puro, mesma UX do export do NTAI).
- Visual: card fino com `border-primary/20`, fundo `bg-muted/40`, fonte `font-mono text-[11px]`, altura `max-h-48`.
- Só aparece quando `isAnalyzing || logs.length > 0`.

Renderizá-lo logo abaixo do `<ClinicalPipelineWorkflow />` na `PetProfilePage`.

### 4. Mensagens de log (PT/EN) — exemplos

- "Coletando perfil clínico de {{name}} ({{breed}}, {{age}}a, {{weight}}kg)" 
- "Buscando predisposições raciais para {{breed}}..." → "{{count}} predisposições encontradas, {{undiagnosed}} não diagnosticadas"
- "Comparando {{n}} resultados de exames com faixas de referência ({{ageGroup}})" → "{{alerts}} alertas laboratoriais detectados"
- "Consultando Knowledge Graph para {{condition}}..." → "✓ KG: {{nodes}} nós, {{edges}} relações via '{{canonical}}'" ou "⚠ Sem dados no KG para {{condition}}"
- "Verificando interações entre {{nC}} compostos e {{nM}} medicações" → "{{n}} interações detectadas"
- "Gerando recomendação híbrida (top {{k}} compostos sinérgicos)..." → "{{count}} compostos finais com posologia resolvida"

Todas as strings via `t()` em `src/locales/{pt,en}/translation.json` sob `petProfile.pipeline.log.*` (com interpolação).

### 5. Polimento bilíngue + versionamento

- Bump `I18N_VERSION` em `src/i18n.ts` para `1.30.0`.
- Adicionar entradas em `CHANGELOG.md` (Unreleased → Changed/Added):
  - "Pipeline clínico VetGraphRAG agora reporta progresso real de cada estágio (não mais avanço em bloco no final)."
  - "Novo painel de log ao vivo abaixo do workflow, estilo digestão de estudos científicos."
- Atualizar `docs/CURRENT_STATE.md` mencionando o novo feedback granular.

### 6. Não-objetivos

- Não mudar a lógica clínica nem os resultados.
- Não adicionar artificial `setTimeout` para "fingir" tempo — todo timing exibido será o real.
- Não tocar em `ClinicalPipelineWorkflow.tsx` além de garantir compatibilidade (talvez exibir o nome do estágio ativo no card; opcional).

---

## Arquivos afetados

- `src/services/clinical-analysis-pipeline.ts` (callbacks de progresso)
- `src/pages/veterinario/PetProfilePage.tsx` (consumir eventos, montar painel)
- `src/components/pet/ClinicalPipelineLogPanel.tsx` (novo)
- `src/locales/pt/translation.json`, `src/locales/en/translation.json`
- `src/i18n.ts` (bump versão)
- `CHANGELOG.md`, `docs/CURRENT_STATE.md`

Aprova para eu implementar?