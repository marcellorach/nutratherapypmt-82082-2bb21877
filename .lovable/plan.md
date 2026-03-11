

## Plano: System Guide Interativo com Conexões Visuais e Painéis Explicativos

### Desafio 1 — Conexões gráficas entre seções + luz "working"

Transformar o grid estático atual em um **diagrama de fluxo visual** usando SVG lines/paths entre os cards para representar o pipeline de dados. As conexões mostram:
- **Ingestão → Ontologia**: estudos alimentam as entidades
- **Ontologia → Grafo**: entidades formam nós e arestas
- **Grafo → Inteligência**: relações geram insights

A **luz "working"** será um indicador animado (pulsing dot) no card da seção que estiver atualmente ativa (baseado no `?tab=` atual dos `searchParams`). Quando o admin está na tab `veterinary-targets`, o card correspondente no guia pulsa com uma luz verde.

### Desafio 2 — Click abre explicação gráfica inline

Em vez de navegar, o click expande um **painel inline** abaixo do card clicado com:
- Descrição detalhada do módulo (2-3 parágrafos)
- **Estatísticas em tempo real** do banco (contagem de registros, última atualização)
- Mini diagrama de inputs/outputs daquele módulo
- Botão "Ir para seção" para navegar de fato

As estatísticas serão consultadas via queries simples (count) nas tabelas relevantes de cada seção.

### Mudanças

| Arquivo | Ação |
|---|---|
| `src/components/administrador/estudos/SystemGuideCard.tsx` | **Reescrever** — Adicionar SVG flow lines entre grupos, pulsing indicator na tab ativa, click expande painel explicativo inline em vez de navegar |
| `src/components/administrador/estudos/SystemGuideDetailPanel.tsx` | **Criar** — Componente do painel expandido com stats real-time, descrição rica e mini diagrama de I/O |
| `src/hooks/useSystemGuideStats.ts` | **Criar** — Hook que busca contagens (estudos, nutracêuticos, condições, relações, etc.) para exibir no painel |
| `src/locales/pt/translation.json` | **Editar** — Adicionar descrições longas e labels para cada painel de seção |
| `src/locales/en/translation.json` | **Editar** — Idem em inglês |
| `src/i18n.ts` | **Editar** — Bump versão |

### Detalhes de implementação

**Conexões visuais**: Setas SVG curvas (tipo flowchart) desenhadas entre os blocos de grupo usando posicionamento relativo. Cada grupo tem um "connector" saindo do lado direito/inferior apontando para o próximo grupo, com gradiente de cor.

**Luz working**: Lê `searchParams.get('tab')` e compara com o `step` de cada seção. O card ativo recebe uma classe com `animate-pulse` em um dot verde ao lado do ícone.

**Painel de detalhes**: State local `expandedSection`. Ao clicar, expande com animação (framer-motion) mostrando:
- Descrição expandida (i18n key `systemGuide.details.{step}`)
- Stats: query count nas tabelas mapeadas (ex: `nutraceuticals` → count de `nutraceuticals`, `veterinary-targets` → count de `health_conditions`)
- Inputs/Outputs: lista visual do que entra e sai daquele módulo
- CTA "Abrir seção" para navegar

