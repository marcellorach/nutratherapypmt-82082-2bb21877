

# Plano: Adicionar jpedroazedo@gmail.com como Administrador

## Resumo

Adicionar o usuário `jpedroazedo@gmail.com` à tabela `user_roles` com role `admin` para que ele tenha acesso completo aos estudos curados no Kanban e demais funcionalidades administrativas.

## Dados do Usuário

| Campo | Valor |
|-------|-------|
| Email | jpedroazedo@gmail.com |
| User ID | cc1eeeec-9175-4240-ace8-4084135ba933 |
| Role a ser concedida | admin |

## Ação

Executar o seguinte comando SQL:

```sql
INSERT INTO user_roles (user_id, role) 
VALUES ('cc1eeeec-9175-4240-ace8-4084135ba933', 'admin');
```

## Resultado Esperado

Após a inserção, o usuário `jpedroazedo@gmail.com` terá acesso a:

- Estudos curados no Kanban (`processed_studies`)
- Triplets extraídos (`triplet_extractions`)
- Todas as funcionalidades do painel administrativo protegidas por RLS

## Seção Técnica

A tabela `user_roles` possui uma política RLS que permite apenas usuários com role `admin` visualizarem dados sensíveis. A função `is_admin()` verifica se o `auth.uid()` atual possui uma entrada com `role = 'admin'` nesta tabela.

```text
┌─────────────────────────────────────┐
│         ANTES DA INSERÇÃO           │
├─────────────────────────────────────┤
│ jpedroazedo@gmail.com               │
│ → user_roles: (vazio)               │
│ → is_admin(): FALSE                 │
│ → Acesso Kanban: BLOQUEADO ❌       │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│         DEPOIS DA INSERÇÃO          │
├─────────────────────────────────────┤
│ jpedroazedo@gmail.com               │
│ → user_roles: role = 'admin'        │
│ → is_admin(): TRUE                  │
│ → Acesso Kanban: LIBERADO ✅        │
└─────────────────────────────────────┘
```

