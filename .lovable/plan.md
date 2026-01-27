
# Plano: Sincronizar Dados de Estudos Entre Preview e Site Publicado

## Diagnóstico Confirmado

O problema não é de sincronização de dados, mas de **permissões de usuário**:

- **Dados**: Existem 2 estudos válidos no banco de dados ✅
- **RLS**: Tabela `processed_studies` só permite acesso a usuários com role `admin`
- **Preview**: Você está logado como `mrachlyn@gmail.com` (tem role admin) → vê 2 estudos
- **Site Publicado**: Usuário `marcello@healthprotection.com` (sem role admin) → vê 0 estudos

## Ação Necessária

Adicionar os usuários que precisam acessar o site publicado à tabela `user_roles` com role `admin`:

### Usuários para Adicionar como Admin

| Email | User ID |
|-------|---------|
| marcello@healthprotection.com | 8e154080-a33f-46d6-a8aa-cf85643df10d |
| arthur@healthprotection.com | 3de4a348-1386-45d4-9975-ea6f11fe0113 |
| marcello@lifespan.com.br | d457e518-d49d-43fe-9b37-9fcc0814ba63 |

## Implementação

### Passo 1: Inserir Roles para Usuários Existentes

Executar INSERT na tabela `user_roles` para cada usuário que precisa ter acesso admin:

```sql
INSERT INTO user_roles (user_id, role) VALUES
  ('8e154080-a33f-46d6-a8aa-cf85643df10d', 'admin'),  -- marcello@healthprotection.com
  ('3de4a348-1386-45d4-9975-ea6f11fe0113', 'admin'),  -- arthur@healthprotection.com
  ('d457e518-d49d-43fe-9b37-9fcc0814ba63', 'admin'); -- marcello@lifespan.com.br
```

### Passo 2: Verificar Resultado

Após a inserção, o usuário logado no site publicado terá acesso aos 2 estudos.

### Passo 3 (Opcional): Corrigir Erros de Console

Os logs mostram dois problemas secundários:

1. **React.Fragment Warning**: O componente `CompactPipeline.tsx` está recebendo prop inválida - corrigir estrutura do JSX
2. **Tradução Faltando**: Chave `common.refresh` não existe - adicionar nas locales PT/EN

## Resumo Técnico

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUXO ATUAL                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Preview (Lovable)                                          │
│  ┌────────────────────┐    ┌─────────────────┐              │
│  │ mrachlyn@gmail.com │───▶│ user_roles      │              │
│  │ (admin) ✅         │    │ role: admin ✅   │              │
│  └────────────────────┘    └─────────────────┘              │
│                                   │                         │
│                                   ▼                         │
│                            ┌─────────────────┐              │
│                            │ RLS Policy ✅    │              │
│                            │ PERMITE ACESSO  │              │
│                            └─────────────────┘              │
│                                   │                         │
│                                   ▼                         │
│                            ┌─────────────────┐              │
│                            │ 2 estudos       │              │
│                            │ visíveis ✅      │              │
│                            └─────────────────┘              │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Site Publicado                                             │
│  ┌────────────────────────────┐    ┌─────────────────┐      │
│  │ marcello@healthprotection │───▶│ user_roles      │      │
│  │ (sem role) ❌              │    │ role: ??? ❌    │      │
│  └────────────────────────────┘    └─────────────────┘      │
│                                          │                  │
│                                          ▼                  │
│                                   ┌─────────────────┐       │
│                                   │ RLS Policy ❌    │       │
│                                   │ BLOQUEIA ACESSO │       │
│                                   └─────────────────┘       │
│                                          │                  │
│                                          ▼                  │
│                                   ┌─────────────────┐       │
│                                   │ 0 estudos       │       │
│                                   │ visíveis ❌      │       │
│                                   └─────────────────┘       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Arquivos a Modificar

1. **Nenhuma modificação de código necessária** - apenas inserção de dados no banco

## Perguntas para Você

Antes de prosseguir, preciso saber:

1. **Quais usuários devem ter acesso admin?** Devo adicionar todos os 3 usuários mencionados ou apenas alguns específicos?

2. **Deseja que eu também corrija os erros de console** (React.Fragment e tradução faltando)?
