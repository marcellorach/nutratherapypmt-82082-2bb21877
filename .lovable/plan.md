
## Mudanças no Pipeline Clínico e Digital Twin

### a) Novo card "Sinergias" no Pipeline Workflow

Adicionar um 7o estágio `stage7_synergies` ao `ClinicalPipelineWorkflow`:
- Novo ícone `Sparkles` (ou `Zap`) com label bilíngue "Sinergias" / "Synergies"
- Contador de sinergias encontradas
- Atualizar `PipelineState` interface com `stage7_synergies`
- Atualizar `PetProfilePage` para alimentar o novo estágio (pode ser derivado dos dados de recomendação existentes ou de um novo cálculo no pipeline)

### b) Pipeline bilíngue

Atualizar as chaves de tradução em `src/locales/en/translation.json` para as labels do pipeline (profile, predispositions, labs, KG, interactions, recommendation, synergies) e todos os contadores. Incrementar `I18N_VERSION`.

### c) Tempos por etapa e tempo total

- O pipeline já emite `durationMs` no `meta` de cada `stage-end` event
- Capturar esses tempos em um state `stageTimes: Record<string, number>` no `PetProfilePage`
- Passar `stageTimes` ao `ClinicalPipelineWorkflow` para exibir abaixo de cada card completo (ex: "1.2s")
- Calcular e exibir tempo total no canto direito do componente (ex: "Total: 4.8s")

### d) Log de processamento do Digital Twin

Criar um componente `DigitalTwinLogPanel` (reutilizando a estrutura do `ClinicalPipelineLogPanel`):
- Capturar eventos do `usePetTrajectoryProjection` (início, chamada à edge function, resposta, parse, erros)
- Exibir log ao vivo abaixo do Digital Twin na tab correspondente
- Mesma UI: timestamps, ícones por nível, autoscroll, botões limpar/exportar

Faz total sentido ter esse log no Digital Twin -- ele faz chamadas pesadas à AI para projeção de trajetória e o usuário precisa de feedback visual do que está acontecendo internamente (similar ao pipeline clínico).

### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `src/components/pet/ClinicalPipelineWorkflow.tsx` | +stage7, +stageTimes prop, +total time |
| `src/pages/veterinario/PetProfilePage.tsx` | Capturar durationMs, passar stageTimes, novo state para DT log |
| `src/components/pet/DigitalTwinDog.tsx` | Integrar log callback |
| `src/components/pet/DigitalTwinLogPanel.tsx` | Novo componente (baseado no ClinicalPipelineLogPanel) |
| `src/hooks/usePetTrajectoryProjection.ts` | Adicionar callback de log |
| `src/locales/pt/translation.json` | Novas chaves sinergias + DT log |
| `src/locales/en/translation.json` | Mesmas chaves em inglês |
| `src/i18n.ts` | Incrementar I18N_VERSION |
| `CHANGELOG.md` | Registrar mudanças |
