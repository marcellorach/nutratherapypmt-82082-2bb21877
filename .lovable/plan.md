## Continuação da implementação do pipeline de auditorias

O backend (edge function + checklist canônico + migração) já foi entregue. Falta a camada de UI e o redeploy.

### 1. Redeploy da edge function `generate-audit`
Já refatorada para snapshot ampliado + outline → blocos → cierre + `ready_with_warnings`. Precisa ser redeployada para passar a valer.

### 2. Atualizar `TechnicalAuditsTab.tsx`
- Importar `AUDIT_COVERAGE` de `src/data/audit-coverage.ts` e usar como **default scope** (agrupado por pilar), substituindo o texto fixo `DEFAULT_NEW_SCOPE`.
- Card de progresso novo:
  - mostra fase atual (`outline | blocks | cierre | validating | saving`)
  - barra com `blocks_done / blocks_total` quando em fase `blocks`
  - lista das seções já concluídas (lidas de `outline` no DB)
- Viewer condicional: enquanto `status === 'processing'`, esconder iframe e mostrar só o card de progresso (não carrega mais `pending.html`).
- Status `ready_with_warnings`: badge amarelo + seção "Lacunas reconhecidas" lida do JSON estruturado.
- Status `failed`: mostrar erro real + botão **"Retomar do último bloco"** que reenvia para a edge function passando o `outline` salvo.
- Polling: manter intervalo curto (2s) durante `processing`, parar ao chegar em estado terminal.

### 3. Novo componente `CoverageChecklistEditor.tsx`
- Renderiza o checklist canônico agrupado por pilar com checkbox por item.
- Permite desmarcar áreas (gera o `scope` enviado para a edge function como lista de IDs, não texto livre).
- Botão "Restaurar padrão" volta ao checklist completo.

### 4. Limpeza
- Remover a `v7.0.0` atual do DB (já está como `failed`) para a próxima geração começar limpa com o novo pipeline.

### Arquivos a alterar
```text
src/components/administrador/audits/TechnicalAuditsTab.tsx     (refatorar)
src/components/administrador/audits/CoverageChecklistEditor.tsx (novo)
supabase/functions/generate-audit/index.ts                     (já editada; só redeploy)
```

### Fora do escopo
- Geração nativa de PDF (continua via print do browser).
- Reorganização visual da aba além do card de progresso e do editor de checklist.

Sigo?
