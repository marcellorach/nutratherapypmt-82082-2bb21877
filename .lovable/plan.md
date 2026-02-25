

## Plano: Indicadores Visuais nas Tabs AI Processing e Curation

### Mudanças

**1. TabNavigation.tsx** — Aceitar 2 novas props opcionais:
- `isProcessing: boolean` — quando `true`, exibe ícone de `Loader2` animado ao lado de "AI Processing"
- `pendingCurationCount: number` — quando > 0, exibe `Badge` com o número ao lado de "Curation"

**2. SciImportSection.tsx** — Fornecer os dados:
- **AI Processing ativo**: Buscar de `processed_studies` se há algum com `processing_status = 'processing'` (ou usar realtime). Alternativa mais simples: manter um state `isAiProcessing` que é atualizado via query leve ao banco.
- **Pending curation**: Contar triplets com `curation_status = 'pending'` na tabela `triplet_extractions` (atualmente são 975). Fazer query leve no mount e quando a tab muda.

### Implementação Visual

```text
[ Library ]  →  [ Upload ]  →  [ ⟳ AI Processing ]  →  [ Curation (975) ]
                                   ^spinner                  ^badge
```

- O spinner usa `Loader2` com `animate-spin` (mesmo padrão usado em todo o projeto)
- O badge usa o componente `Badge` com `variant="destructive"` para destaque visual (mesmo padrão usado no `CurationDashboard`)

### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `TabNavigation.tsx` | Adicionar props `isProcessing` e `pendingCurationCount`, renderizar Loader2 e Badge condicionalmente |
| `SciImportSection.tsx` | Adicionar queries para `isAiProcessing` e `pendingCurationCount`, passar como props ao TabNavigation |

### Notas técnicas
- Não precisa de i18n novo (são apenas ícone e número)
- As queries são leves (COUNT) e feitas apenas no mount + quando relevante
- Sem impacto em outras páginas

