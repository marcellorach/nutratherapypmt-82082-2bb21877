
# Plano: Roadmap com 6 Fases + Progresso Visual

## Mudanca

Atualizar o roadmap de 4 para 6 fases com indicadores de progresso percentual e novos conteudos estrategicos.

### Novas 6 Fases

| # | Titulo EN | Titulo PT | Status | Progresso |
|---|-----------|-----------|--------|-----------|
| 1 | Knowledge Base | Base de Conhecimento | Done | 100% |
| 2 | Patient System | Sistema de Pacientes | Done | 100% |
| 3 | Recommendation Engine | Motor de Recomendacao | 90% | 90% |
| 4 | Go-to-Market | Go-to-Market | Done | 100% |
| 5 | Health Plan Integration | Integracao Plano de Saude | 10% | 10% |
| 6 | Scale: Discoveries, Patents and Monetization | Escala: Descobertas, Patentes e Monetizacao | Planned | 0% |

### Mudancas Visuais

- Cards com barra de progresso (Progress component) mostrando % de conclusao
- Fase 3: icone parcial (circlo com 90%) em amarelo/amber
- Fase 4: check verde (concluida)
- Fase 5: icone parcial (10%) em azul
- Fase 6: icone vazio (planejada)
- Status textual abaixo da barra: "Done", "90%", "10%", "Planned"

---

## Secao Tecnica

### Arquivos a Modificar

| Arquivo | Modificacao |
|---------|-------------|
| `src/components/landing/InvestmentSection.tsx` | Expandir roadmap para 6 fases com progresso |
| `src/locales/en/translation.json` | Atualizar textos das fases 3-4, adicionar fases 5-6 |
| `src/locales/pt/translation.json` | Mesmo em portugues |
| `src/i18n.ts` | Incrementar I18N_VERSION para 1.9.45 |

### InvestmentSection.tsx - Mudancas

Roadmap array atualizado:
```tsx
const roadmap = [
  { key: 'phase1', done: true, progress: 100 },
  { key: 'phase2', done: true, progress: 100 },
  { key: 'phase3', done: false, progress: 90 },
  { key: 'phase4', done: true, progress: 100 },
  { key: 'phase5', done: false, progress: 10 },
  { key: 'phase6', done: false, progress: 0 },
];
```

Cards com layout em grid 3x2 em desktop (grid-cols-3) e barra de progresso visual em cada card.

Logica de icone:
- `progress === 100` -> CheckCircle2 verde
- `progress > 0` -> Circle com texto do % em amber
- `progress === 0` -> Circle vazio cinza

### Traducoes EN (novas/modificadas)

- phase3.desc: "AI-powered personalized geroprotective protocols. 90% complete."
- phase4.phase: "Phase 4", title: "Go-to-Market", desc: "Commercial launch strategy, partnerships, initial customer acquisition. Done."
- phase5.phase: "Phase 5", title: "Health Plan Integration", desc: "Pet health insurance integration, recurring revenue model. Early stage."
- phase6.phase: "Phase 6", title: "Scale: Discoveries and Patents", desc: "Translational discoveries, IP portfolio, monetization via health plans at scale."

### Traducoes PT (novas/modificadas)

- phase3.desc: "Protocolos geroprotetores personalizados com IA. 90% concluido."
- phase4: "Go-to-Market", "Estrategia de lancamento comercial, parcerias, aquisicao inicial de clientes. Concluido."
- phase5: "Integracao Plano de Saude", "Integracao com seguros de saude pet, modelo de receita recorrente. Estagio inicial."
- phase6: "Escala: Descobertas e Patentes", "Descobertas translacionais, portfolio de PI, monetizacao via planos de saude em escala."
