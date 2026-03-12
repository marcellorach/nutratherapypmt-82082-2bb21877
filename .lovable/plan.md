

## Plano: Proposta de Tratamento para o Tutor (Owner Portal)

### Visão Geral
Quando o veterinário clica em "Aprovar" ou "Aprovar com Modificações", o sistema gera uma proposta formal e bonita para o tutor do cão, salvando-a no banco de dados. Essa proposta aparece no Owner Portal (`/tutor`) como um card pendente de aceite.

### 1. Nova tabela `treatment_proposals`

```sql
CREATE TABLE public.treatment_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID REFERENCES public.pet_profiles(id) ON DELETE CASCADE NOT NULL,
  veterinarian_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, rejected
  -- Clinical data snapshot
  conditions JSONB NOT NULL DEFAULT '[]',
  compounds JSONB NOT NULL DEFAULT '[]',
  scientific_summary JSONB, -- triplet count, study count, KG coverage
  confidence_level TEXT,
  rationale TEXT,
  -- Pricing
  monthly_price_brl NUMERIC(10,2) NOT NULL,
  subscription_months INTEGER NOT NULL DEFAULT 12,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);
-- RLS + policies for authenticated read/insert/update
-- Enable realtime for owner portal live updates
```

### 2. Gerar proposta na aprovação (PetProfilePage)

Alterar `handleApproveStack` em `PetProfilePage.tsx`:
- Coletar: pet profile, conditions, compounds aprovados, KG triplets/pathways, confidence, vet name
- Calcular preço mensal (R$105–R$270 baseado em quantidade de compostos e complexidade)
- Inserir na tabela `treatment_proposals` com status `pending`
- Toast de confirmação + indicação de que a proposta foi enviada ao tutor

### 3. Componente ProposalCard (bilíngue)

Criar `src/components/tutor/TreatmentProposalCard.tsx` — card bonito e profissional com seções:

1. **Header**: Logo/ícone + "Proposta de Tratamento Geroprotetor" / "Geroprotective Treatment Proposal"
2. **Seção Geroscience**: Explicação de que o caso foi analisado sob a ótica da Gerociência; que cães envelhecem ~7x mais rápido
3. **Condições identificadas**: Lista de condições com badges (X, Y, Z)
4. **Evidência científica**: Número de triplets, estudos, score de confiança — "pavoneio" científico
5. **Compostos recomendados**: Lista dos compostos com dosagem e racional resumido
6. **Projeção de melhora**: Potencial de tratabilidade (texto resumido do TreatabilityChart)
7. **Aprovação veterinária**: "Este protocolo foi revisado e aprovado pelo Dr. [Nome]"
8. **Programa vivo**: Explicação de que é um acompanhamento contínuo com ajustes
9. **Preço**: R$ X/mês — assinatura de 12 meses
10. **Botões**: "Aceitar Proposta" / "Tenho Dúvidas" (bilíngue)

### 4. Owner Portal — Tab "Propostas"

Atualizar `TutorPage.tsx`:
- Adicionar tab "Propostas" / "Proposals"
- Query `treatment_proposals` filtrado por `pet_id` e `status = 'pending'`
- Renderizar `TreatmentProposalCard` para cada proposta pendente
- Ao aceitar: `UPDATE status = 'accepted', accepted_at = now()`
- Toast de confirmação

### 5. Traduções i18n

Adicionar chaves em PT e EN para todos os textos da proposta (seções, botões, descrições científicas).

### Arquivos envolvidos
- **Novo**: migration SQL para `treatment_proposals`
- **Novo**: `src/components/tutor/TreatmentProposalCard.tsx`
- **Editar**: `src/pages/veterinario/PetProfilePage.tsx` (handleApproveStack)
- **Editar**: `src/pages/tutor/TutorPage.tsx` (nova tab + query)
- **Editar**: arquivos de tradução (PT/EN)

