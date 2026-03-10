

## Plano: Veterinary Targets e Nutracêuticos como Cards com Tags

### Problema

A tabela de Veterinary Targets (screenshot 1) mostra condições como linhas de texto simples com chevron. A tabela de nutracêuticos (screenshot 4) também mostra "No condition" como texto plano. Tudo deveria usar o mesmo sistema visual de cards/tags rico que já existe no screenshot 2 (cards com badges de categoria + severidade).

### O Que Mudar

#### 1. Refatorar `VeterinaryTargetsTable` — de tabela para cards com tags

Substituir a `<Table>` por uma lista de cards onde cada condição aparece como:

```text
┌──────────────────────────────────────────────────────────────┐
│ Atrito Telomérico  [Envelhecimento]  [high]   [Treat: 65%]  │
│ Degeneração hereditária dos fotorreceptores...    ✏️  🗑️     │
│                                                              │
│  ▸ 3 raças predispostas · 5 nutracêuticos · 2 estudos       │
└──────────────────────────────────────────────────────────────┘
```

- Usar `ConditionTag` para o nome
- Usar `Badge` existente para categoria e severidade (como screenshot 2 já faz)
- Adicionar contadores de conexões: raças predispostas, nutracêuticos relacionados, estudos
- Manter expandível para detalhes de treatability

#### 2. Adicionar contadores de conexões

Enriquecer os dados de cada condição com:
- **Raças predispostas**: count de `breed_predispositions` com `condition_id`
- **Nutracêuticos**: já existe (`nutraceutical_count`)
- **Estudos**: count via `nutraceutical_studies` → condições

Criar uma RPC ou query join para trazer esses counts.

#### 3. Nutracêuticos — enriquecer colunas Prevention/Treatment

Na tabela de nutracêuticos (screenshot 4), substituir "No condition" por:
- Se tem condição: `ConditionTag` com score
- Se não tem: badge "Sem vínculo" com ícone de link quebrado (em vez de texto "No condition")

#### 4. Arquivos a modificar

| Arquivo | Ação |
|---------|------|
| `src/components/administrador/veterinary-targets/VeterinaryTargetsTable.tsx` | Refatorar de table para card layout com tags e contadores |
| `src/hooks/nutraceuticals/useConditionsWithTreatability.ts` | Adicionar count de breed_predispositions na RPC ou query |
| Tabela de nutracêuticos (componente que renderiza Prevention/Treatment) | Usar ConditionTag em vez de texto "No condition" |

### Resultado

Todas as entidades (condições, nutracêuticos, predisposições) usam a mesma linguagem visual de cards + tags coloridos. Cada card mostra quantas conexões tem com outros elementos do sistema, tornando os elos visíveis.

