## Diagnóstico

A Rita (`ritazuanaze@petmoretime.com.br`) **já tem o papel `admin`** na tabela `public.user_roles` — que é o mesmo papel do "workspace owner / admin master". No banco, ela já tem acesso irrestrito a tudo (todas as RLS usam `public.is_admin()` e ela passa).

O que provavelmente está fazendo parecer que falta permissão **não é o papel no banco**, e sim o **"Visualizar como…"** (RoleViewSwitcher no header), que é um filtro **de UI** salvo no `localStorage` do navegador dela (`senex-role-view`). Se o valor armazenado for `vet_curador` ou `vet_responsavel`, várias tabs do `/administrador` ficam escondidas — mesmo ela sendo admin.

Os perfis de visualização disponíveis (definidos em `src/config/role-views.ts`) são:
- `platform_architect` — **vê tudo** (equivalente ao "admin master")
- `rnd_lead` — só Pesquisa + Governança IA
- `vet_curador` — Base de Conhecimento + Processamento + Análise Preditiva
- `vet_responsavel` — vai direto para `/veterinario`
- `tutor` — vai direto para `/tutor`

## Plano

Nenhuma mudança de banco é necessária — Rita já está com permissão máxima. O ajuste é apenas garantir que ela esteja no perfil de visualização correto:

1. **Confirmar (read-only)** que Rita está com role `admin` no DB (já verificado).
2. **Pedir para a Rita**, no navegador dela:
   - Abrir o app logada.
   - No header, abrir o seletor **"Ver como: …"**.
   - Selecionar **"Arquiteto da Plataforma" (Platform Architect)**.
   - Isso destrava todas as tabs administrativas e equivale ao acesso do admin master.
3. Se ela ainda assim não vir alguma tab/ação específica, ela me diz **qual tela/botão** está faltando e eu investigo o ponto exato (pode ser bug pontual, não permissão).

### Detalhes técnicos (para referência)

- Tabela `public.user_roles`: coluna `role` é `text` livre; valores em uso pelo código são `admin`, `veterinarian`, `tutor`. Rita tem `admin`.
- `AuthContext.hasRole('admin')` → `true` para ela.
- Função SQL `public.is_admin()` → `true` para ela (base de todas as RLS administrativas, incluindo `get_cohort_stats`, `activate_ai_prompt_version`, `approve_access_request`, etc.).
- `RoleViewSwitcher` **não é segurança**, é só filtro visual; o default é `platform_architect`, mas o valor é persistido por navegador.

### Fora do escopo deste plano

- Criar um novo papel "super admin" separado — desnecessário, `admin` já é o topo.
- Mexer em RLS — nenhuma política está bloqueando a Rita.
- Adicionar papel `veterinarian` a ela — só faria sentido se algum fluxo verificasse `hasRole('veterinarian')` exclusivamente (não é o caso hoje para áreas administrativas).

## O que farei ao aprovar

Como não há mudança de código nem de banco, ao aprovar o plano eu só **confirmo o status** e te passo o passo-a-passo curto para a Rita ajustar o "Ver como…" no navegador dela. Se você preferir, posso também **forçar via código o default `platform_architect` para o email dela** (sobrescrevendo o `localStorage` na primeira vez que ela logar) — me diga se quer essa trava extra.
