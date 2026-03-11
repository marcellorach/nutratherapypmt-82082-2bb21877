

## Diagnóstico e Plano de Correção

### Problemas identificados

**a) Chat não responde**: As duas requisições à edge function `relations-auditor` falharam com "Failed to fetch" — a função provavelmente não foi implantada ou está dando timeout. A função está registrada no `config.toml` mas precisa de deploy. Além disso, o contexto enviado é enorme (~77 relações com notas completas + 500 triplets + 45 predisposições), o que pode causar timeout no `gemini-2.5-pro` com `stream: false`.

**b) Posicionamento do Auditor**: Atualmente é uma aba separada (ao lado de Network e Matrix). O correto é ficar como um componente fixo no rodapé do `VisualizationCard`, abaixo da legenda, visível em todas as abas (Network e Matrix).

**c) Legenda incompleta**: O `VisualizationLegend.tsx` mostra apenas círculos coloridos e linhas genéricas. Faltam os sinais biológicos consensuados (→ ativação, ⊣ inibição, ⟷ ligação, --→ modulação) que já existem no `BiologicalLegend.tsx` do Knowledge Graph.

**d) Modelo**: O projeto já usa `gemini-3-pro-preview` diretamente via Google AI na extração de dados (ver `gemini-file-search`). Via Lovable AI Gateway, o melhor disponível para raciocínio complexo é `google/gemini-3.1-pro-preview`. Faz sentido usar esse em vez do `2.5-pro`.

### Mudanças

| Arquivo | Ação |
|---------|------|
| `supabase/functions/relations-auditor/index.ts` | Trocar modelo para `google/gemini-3.1-pro-preview`. Deploy da função. |
| `src/components/administrador/visualizations/relations/components/VisualizationTabs.tsx` | Remover aba "Auditor" — o chat sai daqui |
| `src/components/administrador/visualizations/relations/VisualizationCard.tsx` | Adicionar `RelationsAuditorChat` como seção fixa no rodapé, abaixo da legenda, colapsável (Collapsible) |
| `src/components/administrador/visualizations/relations/components/VisualizationLegend.tsx` | Substituir legenda genérica pela notação biológica padrão (→ ativação, ⊣ inibição, ⟷ ligação, --→ modulação) com cores, alinhada ao `BiologicalLegend` |
| `src/components/administrador/relations/RelationsAuditorChat.tsx` | Ajustar para funcionar como componente embutido (altura menor, responsivo) |

### Detalhes técnicos

**Edge function fix**: O problema principal é que a função não foi deployada após criação. Será redeployada com modelo atualizado para `google/gemini-3.1-pro-preview`.

**Layout do auditor no rodapé**: O chat ficará em um `Collapsible` abaixo da legenda, com um botão "🔍 Auditor de Relações" que expande o painel de chat. Altura fixa de ~400px quando aberto, fechado por padrão.

**Legenda biológica**: Reutilizar os conceitos do `BiologicalLegend.tsx` (já existente no KG) — setas (→) verde para ativação, T-bars (⊣) vermelho para inibição, setas duplas (⟷) azul para ligação, setas tracejadas (- -→) laranja para modulação, linhas simples (——) amarelo para associação.

