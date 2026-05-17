
## Objetivo
Corrigir a inconsistência visual no sidebar admin: ícones principais sempre pretos, status comunicado exclusivamente pelas bolinhas de check (CircleCheck) coloridas.

## Mudanças

### 1. `KnowledgeBaseGroup.tsx`
- **Breeds & Predispositions** (`PawPrint`): remover `text-green-600` quando inativo → usar `text-foreground` (preto). O check verde (StatusBadge) é que indica status.
- **Lab References** (`FlaskConical`): remover `text-orange-500` quando inativo → `text-foreground`. **Adicionar** `StatusBadge` amarelo (em desenvolvimento) ao lado do label.
- **Pharmacology Base** (`Pill`): remover `text-orange-500` quando inativo → `text-foreground`. **Adicionar** `StatusBadge` amarelo ao lado do label.
- **Base Data** (`Database`): já está preto, sem mudança.

### 2. `DataProcessingGroup.tsx` — Patient Analysis
Substituir o grupo atual (🐾 → 🐾) por:
```
🐾 (preto) com um CircleCheck laranja sobreposto/adjacente
   ↓ ArrowRight (cinza/preto)
   CircleCheck verde
```
Layout proposto (inline, antes do label):
```tsx
<span className="flex items-center mr-2">
  <PawPrint className="h-4 w-4 text-foreground" />
  <CircleCheck className="h-3 w-3 ml-0.5 text-orange-500" />
  <ArrowRight className="h-3 w-3 mx-0.5 text-muted-foreground" />
  <CircleCheck className="h-3 w-3 text-green-600" />
</span>
```
Remover o `StatusBadge` amarelo redundante deste item (a transição laranja→verde já comunica o status).

### 3. i18n
- Bump `I18N_VERSION` em `src/i18n.ts` para `1.78.6`.
- Adicionar chaves (PT/EN) se necessárias para o tooltip do novo StatusBadge de Lab References / Pharmacology Base (status "em desenvolvimento").

## Arquivos afetados
- `src/components/administrador/sidebar/groups/KnowledgeBaseGroup.tsx`
- `src/components/administrador/sidebar/groups/DataProcessingGroup.tsx`
- `src/i18n.ts`
- `src/locales/pt/translation.json`
- `src/locales/en/translation.json`

## Fora de escopo
Nenhuma mudança de lógica, navegação ou outros grupos do sidebar.
