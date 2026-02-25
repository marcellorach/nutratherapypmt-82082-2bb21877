

## Plano: Cards de estudo em coluna única

Mudança simples: trocar `grid-cols-1 md:grid-cols-2` para `grid-cols-1` nas duas sub-abas (In Curation e Approved) do `SciImportSection.tsx`.

### Arquivo: `src/components/administrador/estudos/import/SciImportSection.tsx`

**Linha 232** — Sub-aba "In Curation":
```
grid grid-cols-1 md:grid-cols-2 gap-4  →  grid grid-cols-1 gap-4
```

**Linha 253** — Sub-aba "Approved":
```
grid grid-cols-1 md:grid-cols-2 gap-4  →  grid grid-cols-1 gap-4
```

Resultado: cada estudo ocupa uma linha inteira, facilitando a leitura cronológica de cima para baixo.

