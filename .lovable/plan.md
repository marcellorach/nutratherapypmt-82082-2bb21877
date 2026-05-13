## Objetivo

Propagar o rebrand **VetGraphRAG → Senex AI** nas camadas que ainda referenciam o nome antigo (Knowledge File, Auditorias Técnicas, Organograma, Conformidade FDA/EMA/AVMA), reforçando em pontos pertinentes que **Senex AI é um sistema proprietário desenvolvido e operado exclusivamente pela PetMoreTime desde 2025** (sucessor da nomenclatura interna VetGraphRAG/VetMedGraph). Identificadores internos de código permanecem intactos.

## Mensagem de marca a reforçar (boilerplate curto)

> *"Senex AI é o motor proprietário de inferência clínica veterinária desenvolvido e operado exclusivamente pela **PetMoreTime** (2025–presente). Sucessor da arquitetura interna VetGraphRAG/VetMedGraph."*

Esse boilerplate (ou variações curtas como "© PetMoreTime · Senex AI") será inserido em:
- Header do Knowledge File do projeto
- Cabeçalho da tab **Conformidade FDA/EMA/AVMA** (contexto regulatório → autoria importa)
- Rodapé/intro de relatórios da tab **Auditorias Técnicas**
- Nó raiz do **Organograma** (descrição do projeto)
- Headers de `ARCHITECTURE.md`, `docs/TECHNICAL_DECISIONS.md`, `CHANGELOG.md`

## Escopo

### 1. Knowledge File do projeto (custom instructions / `<project-knowledge>`)
- Substituir menções a "VetGraphRAG" por "Senex AI" no texto descritivo
- Adicionar bloco de marca no topo: autoria PetMoreTime, período 2025–presente, natureza proprietária
- Nota técnica: *"Identificadores internos (`vetgraphrag-*`, `useVetGraphRAG*`, `VetGraphRAGAnalysisResult`, edge functions, colunas DB) foram preservados — não renomear em refactors."*

### 2. Organograma (`src/data/projectOrganograma.ts` + `OrganogramaTab.tsx` + `organogramaAreaMeta.ts`)
- Renomear nós/labels/descrições visíveis: "VetGraphRAG" → "Senex AI"
- Atualizar descrição do nó raiz / cabeçalho da tab para incluir: *"Senex AI · PetMoreTime · 2025–presente"*
- Manter estrutura hierárquica e IDs internos

### 3. Auditorias Técnicas (`src/components/administrador/audits/TechnicalAuditsTab.tsx`)
- Substituir "VetGraphRAG" por "Senex AI" em títulos de auditoria, descrições de checks e relatórios
- Adicionar linha de assinatura no header da tab: *"Auditoria do motor Senex AI · © PetMoreTime"*
- Atualizar valores correspondentes em `pt/translation.json` e `en/translation.json` (chaves preservadas)

### 4. Conformidade FDA/EMA/AVMA
- Localizar componente via `admin-tabs-info.ts` (provável `src/components/administrador/compliance/*`)
- Substituir menções a "VetGraphRAG" no copy regulatório
- Reforçar no header da tab: *"Sistema submetido à conformidade: **Senex AI** (PetMoreTime, 2025–presente). Sucessor da arquitetura interna VetGraphRAG."* — relevante para rastreabilidade regulatória
- Atualizar `admin-tabs-info.ts` e `admin-tabs-info-bilingual.ts` (campos `objective`/`description`)

### 5. Documentação técnica
- `docs/TECHNICAL_DECISIONS.md`: renomear "Tabelas Hierárquicas VetGraphRAG" → "Tabelas Hierárquicas Senex AI"; adicionar entrada de histórico "2026-05-13 — Rebrand visível VetGraphRAG → Senex AI · autoria PetMoreTime reforçada"
- `ARCHITECTURE.md`: nota de autoria no header
- `.lovable/plan.md`: substituir o plano antigo (que ainda menciona "VetGraphRAG → Senex AI" com placeholder) por este

### 6. URLs e screenshots
- Verificado: não há domínios, paths públicos ou assets de imagem com "vetgraphrag" — nada a renomear nessa camada
- Paths internos de arquivos (`vetgraphrag-service.ts` etc.) ficam fora deste escopo (refactor à parte se desejado)

### 7. i18n e changelog
- Bump `I18N_VERSION` para `1.74.1` (patch — completa o rebrand anterior)
- Entrada `[Unreleased]` em `CHANGELOG.md` com `<!-- area: branding · status: done · i18n: yes -->`, mencionando autoria PetMoreTime
- Rodar `npm run sync:changelog`

### 8. Memória
- Atualizar/criar `mem://branding/senex-ai-rename` consolidando: marca pública = Senex AI; **autoria exclusiva = PetMoreTime (2025–presente)**; sucessor de VetGraphRAG/VetMedGraph; identificadores internos preservados; áreas cobertas

## O que NÃO muda

- Arquivos: `vetgraphrag-service.ts`, `vetgraphrag.ts`, `vetgraphrag-enhanced.ts`
- Tipos: `VetGraphRAGAnalysisResult`, `VetGraphRAGConditionTag`
- Hooks: `useVetGraphRAG*`, `useNtai*`
- Edge functions, colunas DB, chaves i18n (paths) — só os valores

## Validação

- `grep -r "VetGraphRAG" src/locales src/data/admin-* src/components/administrador docs/` → zero ocorrências em strings visíveis
- Tela `/administrador` → tabs **Organograma**, **Conformidade FDA/EMA/AVMA**, **Auditorias Técnicas** revisadas: nome "Senex AI" + assinatura PetMoreTime visível
- Build limpo, sem quebra de imports
