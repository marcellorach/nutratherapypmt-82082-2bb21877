

# Plano: Sistema de Acesso com Stanford.edu Auto-Aprovado e Solicitações Google

## Resumo

Implementar um novo sistema de autenticação com duas formas de acesso:
1. **Acesso automático** para emails `@stanford.edu` - aprovação imediata
2. **Solicitação de acesso** para emails `@gmail.com` via Google OAuth - requer aprovação de admin

Os administradores receberão alertas visuais no header quando houver solicitações pendentes.

## Fluxo de Acesso

```text
┌─────────────────────────────────────────────────────────────────────┐
│                        PÁGINA DE LOGIN                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │              "Continue with Google"                          │   │
│   │                 [Botão OAuth Google]                         │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│   ┌──────────────────────┐    ┌──────────────────────┐             │
│   │   @stanford.edu      │    │   @gmail.com         │             │
│   │   ────────────────   │    │   ────────────────   │             │
│   │   Acesso IMEDIATO    │    │   Aguarda APROVAÇÃO  │             │
│   │   role = 'user'      │    │   status = pending   │             │
│   │   ✅ Pode usar app   │    │   ⏳ Espera admin    │             │
│   └──────────────────────┘    └──────────────────────┘             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Componentes do Sistema

### 1. Nova Tabela: `access_requests`

Armazena solicitações de acesso pendentes de aprovação.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Chave primária |
| user_id | uuid | Referência ao auth.users |
| email | text | Email do solicitante |
| full_name | text | Nome completo (do Google) |
| avatar_url | text | Foto do perfil (do Google) |
| status | text | 'pending', 'approved', 'rejected' |
| requested_at | timestamptz | Data/hora da solicitação |
| reviewed_by | uuid | Admin que revisou |
| reviewed_at | timestamptz | Data/hora da revisão |
| rejection_reason | text | Motivo da rejeição (opcional) |

### 2. Autenticação Google OAuth

- Configurar Google OAuth via Lovable Cloud
- Após login, verificar domínio do email:
  - `@stanford.edu` → criar perfil + role 'user' automaticamente
  - `@gmail.com` → criar entrada em `access_requests` com status 'pending'

### 3. Lógica de Acesso Pós-Login

```text
┌─────────────────────────────────────────────────────────────────────┐
│                    APÓS AUTENTICAÇÃO GOOGLE                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   IF email.endsWith('@stanford.edu')                                │
│   ├── Criar profile (se não existir)                                │
│   ├── Adicionar role 'user' em user_roles                           │
│   └── Redirecionar para HOME ✅                                     │
│                                                                      │
│   ELSE IF email.endsWith('@gmail.com')                              │
│   ├── Verificar se já existe access_request                         │
│   │   ├── status = 'approved' → Criar profile + role 'user' ✅      │
│   │   ├── status = 'pending' → Mostrar tela "Aguardando" ⏳         │
│   │   └── status = 'rejected' → Mostrar tela "Rejeitado" ❌         │
│   └── Se não existe → Criar access_request com status 'pending'     │
│                                                                      │
│   ELSE (outros domínios)                                            │
│   └── Mostrar erro: "Domínio não permitido"                         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 4. Alerta no Header para Admins

Badge com contador de solicitações pendentes:

```text
┌────────────────────────────────────────────────────────────────────┐
│ [Logo]  NutraTherapy          [🔔 3] [⚙️ Admin] [Avatar] [Logout] │
└────────────────────────────────────────────────────────────────────┘
                                  ↑
                           Ícone de sino com badge
                           mostrando quantidade de
                           solicitações pendentes
```

### 5. Painel de Aprovação de Solicitações

Nova seção no admin para gerenciar solicitações:

```text
┌─────────────────────────────────────────────────────────────────────┐
│  📋 Solicitações de Acesso                              [Pendentes: 3]│
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ [👤 Avatar]  john.doe@gmail.com                              │    │
│  │              John Doe                                         │    │
│  │              Solicitado há 2 horas                           │    │
│  │                                                               │    │
│  │              [✅ Aprovar]  [❌ Rejeitar]                      │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ [👤 Avatar]  jane.smith@gmail.com                            │    │
│  │              Jane Smith                                       │    │
│  │              Solicitado há 1 dia                             │    │
│  │                                                               │    │
│  │              [✅ Aprovar]  [❌ Rejeitar]                      │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 6. Tela de Status para Usuários Pendentes

Quando um usuário @gmail faz login e está pendente:

```text
┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│                         ⏳                                           │
│                                                                      │
│              Solicitação de Acesso Enviada                          │
│                                                                      │
│   Sua solicitação de acesso à plataforma NutraTherapy foi           │
│   enviada com sucesso. Um administrador irá analisar seu            │
│   pedido em breve.                                                   │
│                                                                      │
│   Email: john.doe@gmail.com                                         │
│   Enviado em: 04/02/2026 às 10:30                                   │
│                                                                      │
│                    [Sair da Conta]                                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Arquivos a Criar/Modificar

### Novos Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `src/components/auth/GoogleAuthButton.tsx` | Botão de login com Google |
| `src/components/auth/AccessPendingScreen.tsx` | Tela para usuários aguardando aprovação |
| `src/components/auth/AccessRejectedScreen.tsx` | Tela para usuários rejeitados |
| `src/components/layout/PendingAccessBadge.tsx` | Badge de notificação no header |
| `src/components/administrador/access/AccessRequestsPanel.tsx` | Painel de gerenciamento de solicitações |
| `src/hooks/useAccessRequests.ts` | Hook para buscar/gerenciar solicitações |

### Arquivos a Modificar

| Arquivo | Modificação |
|---------|-------------|
| `src/pages/auth/AuthPage.tsx` | Adicionar botão Google OAuth |
| `src/components/auth/StanfordDemoForm.tsx` | Manter como fallback opcional |
| `src/components/layout/Header.tsx` | Adicionar badge de notificação |
| `src/contexts/AuthContext.tsx` | Adicionar lógica de verificação de domínio |

## Seção Técnica

### Migração SQL

```sql
-- Criar enum para status de solicitação
CREATE TYPE access_request_status AS ENUM ('pending', 'approved', 'rejected');

-- Criar tabela de solicitações de acesso
CREATE TABLE public.access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  status access_request_status DEFAULT 'pending' NOT NULL,
  requested_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  UNIQUE(user_id)
);

-- Habilitar RLS
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- Admins podem ver todas as solicitações
CREATE POLICY "Admins can view all access requests"
ON public.access_requests FOR SELECT
TO authenticated
USING (public.is_admin());

-- Admins podem atualizar solicitações (aprovar/rejeitar)
CREATE POLICY "Admins can update access requests"
ON public.access_requests FOR UPDATE
TO authenticated
USING (public.is_admin());

-- Usuários podem ver apenas sua própria solicitação
CREATE POLICY "Users can view own access request"
ON public.access_requests FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Qualquer autenticado pode inserir (criar solicitação)
CREATE POLICY "Authenticated users can insert access request"
ON public.access_requests FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Função para contar solicitações pendentes
CREATE OR REPLACE FUNCTION public.count_pending_access_requests()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.access_requests
  WHERE status = 'pending';
$$;

-- Índice para performance
CREATE INDEX idx_access_requests_status ON public.access_requests(status);
CREATE INDEX idx_access_requests_user_id ON public.access_requests(user_id);
```

### Lógica de Verificação de Domínio (AuthContext)

```typescript
const handlePostGoogleAuth = async (user: User) => {
  const email = user.email || '';
  
  // Emails @stanford.edu - acesso automático
  if (email.endsWith('@stanford.edu')) {
    await ensureUserProfile(user);
    await ensureUserRole(user.id, 'user');
    navigate('/');
    return;
  }
  
  // Emails @gmail.com - verificar/criar solicitação
  if (email.endsWith('@gmail.com')) {
    const { data: existingRequest } = await supabase
      .from('access_requests')
      .select('status')
      .eq('user_id', user.id)
      .single();
    
    if (existingRequest?.status === 'approved') {
      await ensureUserProfile(user);
      await ensureUserRole(user.id, 'user');
      navigate('/');
    } else if (existingRequest?.status === 'pending') {
      navigate('/access-pending');
    } else if (existingRequest?.status === 'rejected') {
      navigate('/access-rejected');
    } else {
      // Criar nova solicitação
      await supabase.from('access_requests').insert({
        user_id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name,
        avatar_url: user.user_metadata?.avatar_url,
      });
      navigate('/access-pending');
    }
    return;
  }
  
  // Outros domínios - não permitido
  toast({ title: 'Domínio não autorizado', variant: 'destructive' });
  await supabase.auth.signOut();
};
```

### Realtime para Notificações

```sql
-- Habilitar realtime para access_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.access_requests;
```

Isso permitirá que admins vejam o badge atualizar em tempo real quando novas solicitações chegarem.

### Traduções a Adicionar

Chaves de tradução para PT e EN:
- `accessRequest.pending.title`
- `accessRequest.pending.description`
- `accessRequest.rejected.title`
- `accessRequest.rejected.description`
- `accessRequest.badge.tooltip`
- `admin.accessRequests.title`
- `admin.accessRequests.approve`
- `admin.accessRequests.reject`
- `admin.accessRequests.pendingCount`

## Comportamento dos Admins Existentes

Os 5 administradores atuais (incluindo `jpedroazedo@gmail.com` recém-adicionado) **permanecerão com acesso total** e não serão afetados por essas mudanças. A verificação de admin é feita pela tabela `user_roles`, não pela `access_requests`.

## Prioridade de Implementação

1. Configurar Google OAuth via Lovable Cloud
2. Criar tabela `access_requests` com RLS
3. Modificar `AuthContext` com lógica de verificação
4. Criar telas de status (pending/rejected)
5. Adicionar badge no Header
6. Criar painel de aprovação no admin
7. Adicionar traduções PT/EN

