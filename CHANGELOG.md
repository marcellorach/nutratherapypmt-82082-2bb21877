# 📝 Changelog - NutraTherapy

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

---

## [Unreleased]

### Fixed
- ✅ Corrigida contagem de estudos científicos (usava números fictícios 150-300, agora usa dados reais do banco)
- ✅ Estudos associados agora aparecem corretamente na interface expandida de nutracêuticos
- ✅ Substituídos 15+ textos hardcoded por traduções completas (PT/EN) em componentes de tabelas
- ✅ Removida função `getRealisticStudyCount` que gerava contagens fictícias
- ✅ Melhorado mapeamento de dados para garantir consistência entre `studies` e `nutraceutical_studies`

### Added
- ✅ Sistema completo de gerenciamento de estudos científicos
- ✅ Componente StudyCard com informações enriquecidas (ano, autores, DOI, abstract, escala visual de relevância)
- ✅ Componente EditRelevanceDialog para ajustar scores de relevância (1-5 com descrições detalhadas)
- ✅ Componente StudyDetailModal para preview detalhado de estudos (abstracts PT/EN, autores, nutracêuticos relacionados)
- ✅ 18 estudos científicos-chave para os 8 novos nutracêuticos (Espermidina, NMN, Urolitina A, Fisetina, PQQ, Berberina, DHA, Boswellia)
- ✅ Sistema de busca e filtragem de estudos por título, journal e autores
- ✅ Validações robustas para associações (existência de estudo, duplicação)
- ✅ Escala visual de relevância nos cards (5 barras coloridas)
- ✅ Links externos para DOI e estudos completos
- ✅ Query dinâmica para nutracêuticos relacionados a cada estudo

### Changed
- ✅ Melhorado feedback visual durante salvamento de associações (loading states)
- ✅ Expandida exibição de informações de estudos relacionados (de 3 campos para 9 campos)
- ✅ StudiesTab agora exibe contador de resultados de busca

### Technical
- ✅ Adicionados queries para buscar nutracêuticos relacionados a um estudo via JOIN
- ✅ Implementada lógica de edição inline de relevância com UPDATE direto
- ✅ Otimizado carregamento de relações estudo-nutracêutico
- ✅ Base científica robusta: 18 estudos em journals tier-1 (Nature, Science, Cell Metabolism, JACC)
- ✅ Relevância média: 4.8/5 (95% dos estudos com score ≥4)

### Added
- ✅ Tab unificada "Nutracêuticos" com 3 sub-tabs (Catálogo, Relações, Matriz)
- ✅ Nova tab "Alvos Veterinários" para gerenciamento completo de Health Conditions
- ✅ CRUD completo para Health Conditions (criar, editar, deletar com confirmação)
- ✅ Componentes VeterinaryTargetsHeader, VeterinaryTargetsStats, VeterinaryTargetsTable, VeterinaryTargetCRUDDialog
- ✅ Filtros avançados por categoria e severidade em Alvos Veterinários
- ✅ Traduções bilíngues completas (PT/EN) para todas as novas funcionalidades
- ✅ Sistema de tabs interno para organização de funcionalidades de nutracêuticos

### Changed
- ✅ Reorganização completa da estrutura do sidebar Knowledge Base
- ✅ Unificação de tabs "Nutracêuticos" e "Banco de Nutracêuticos" em uma única tab unificada
- ✅ Atualização do `admin-tabs.ts` removendo tabs redundantes e adicionando novas
- ✅ Atualização do `KnowledgeBaseGroup.tsx` com nova estrutura de menu
- ✅ Incremento da versão do i18n para 1.1.0 (force reload de traduções)
- ✅ Total de tabs Knowledge Base: 8 → 6 tabs (eliminação de redundância)

### Removed
- ✅ Removida tab "Database Migrations" do sidebar
- ✅ Removida tab "Banco de Nutracêuticos" (agora sub-tab "Catálogo")
- ✅ Removida tab "Regras Clínicas" (funcionalidade pouco utilizada)
- ✅ Removida tab "Análise de Microbioma" (demo não essencial)

### Fixed
- ✅ Implementada lógica completa de limpeza de dados no hook `useDataManagement` (função `cleanSeedData` agora funcional)
- ✅ Adicionados toasts de feedback (sucesso/erro) na função cleanSeedData para melhor UX
- ✅ Nova tab administrativa "Análise de Microbioma" no grupo Knowledge Base (funcionalidade mockada para demonstração)
- Sistema de versionamento semântico para documentação
- Headers de versão em todos os arquivos de documentação

### Changed
- Total de tabs administrativas: 27 → 28 tabs
- Grupo Knowledge Base: 7 → 8 tabs

### Fixed
- ✅ **CRÍTICO:** Corrigida duplicação da chave `admin.settings` em arquivos de tradução PT/EN
- ✅ Mesclada estrutura `admin.settings.knowledgeBase` com `admin.settings.general/data/messages`
- ✅ Incrementada versão i18n para 1.0.15 (force reload total do cache)
- ✅ Implementado desenvolvimento bilíngue obrigatório no `DataManagementPanel` (39 textos traduzidos PT/EN)
- ✅ Implementado desenvolvimento bilíngue obrigatório no `KnowledgeBaseSettingsTab` (6 textos traduzidos PT/EN)
- ✅ Adicionada estrutura completa `dataManagement` com 39 chaves em `pt/translation.json` e `en/translation.json`
- ✅ Adicionada estrutura completa `admin.settings.knowledgeBase` com 6 chaves em ambos arquivos de tradução
- ✅ Todos os textos hardcoded substituídos por chamadas `t()` com `useTranslation` hook

---

## [1.0.0] - 2025-11-10

### Added
- ✅ **Documentação Completa do Projeto**
  - Criado `ARCHITECTURE.md` com arquitetura técnica, modelo de dados, navegação e padrões
  - Criado `docs/STANFORD_DEMO.md` com estratégia de demo e funcionalidades prioritárias
  - Criado `docs/CURRENT_STATE.md` com estado atual (funcionalidades reais vs mockadas)
  - Adicionado sistema de versionamento semântico (MAJOR.MINOR.PATCH)
  - Adicionado `CHANGELOG.md` para histórico de mudanças

- ✅ **Sistema Administrativo**
  - 27 tabs administrativas organizadas em 5 grupos principais:
    - Knowledge Base (5 tabs)
    - Data Processing (6 tabs)
    - Research & Development (8 tabs)
    - Predictive Analysis (5 tabs)
    - Configuration (3 tabs)
  - Sistema de lazy loading para otimização de performance
  - Breadcrumb navigation para melhor UX

- ✅ **Backend Supabase**
  - Tabelas principais: `nutraceuticals`, `health_conditions`, `scientific_studies`, `nutraceutical_outcomes`
  - Tabelas de relacionamento: `health_condition_correlations`, `nutraceutical_health_conditions`
  - Tabelas de configuração: `research_sources`, `data_sources`, `user_feedback`
  - Storage buckets: `studies-pdfs`, `nutraceutical-images`, `pet-images`
  - Edge Functions: `ntai-process-study`
  - Row Level Security (RLS) habilitado em todas as tabelas

- ✅ **Frontend React**
  - React 18.3 + TypeScript + Vite
  - Sistema de design com Tailwind CSS e shadcn-ui
  - Visualizações avançadas: Recharts, Nivo, vis-network
  - Framer Motion para animações
  - React Query para gerenciamento de estado assíncrono
  - Modularização completa de serviços (NutraceuticalsService, etc.)

- ✅ **Internacionalização**
  - Sistema bilíngue completo (PT/EN)
  - i18next + react-i18next
  - Traduções completas em todos os componentes
  - Detecção automática de idioma do navegador
  - Versioning system para cache invalidation

- ✅ **Autenticação e Autorização**
  - Supabase Auth com email/password
  - Controle de acesso baseado em roles (Admin, Veterinário, Tutor)
  - Protected routes e role-based UI

- ✅ **Visualizações de Dados**
  - Gráficos de barra, linha, pizza (Recharts)
  - Heatmaps e gráficos radar (Nivo)
  - Grafos de relações interativos (vis-network)
  - Cards estatísticos e tabelas interativas
  - Sistema de drill-down para dados detalhados

### Mocked (Funcionalidades Simuladas)
- 🔶 **NTAI Processing**: Interface completa, mas sem integração real com OpenAI
- 🔶 **Predictive Models**: Visualizações prontas, mas modelos ML são simulados
- 🔶 **Longitudinal Studies**: Timeline visual criada, mas dados são mockados
- 🔶 **Combination Suggestions**: UI implementada, mas algoritmo não é real
- 🔶 **Correlation Discovery**: Heatmaps funcionais, mas correlações são pré-definidas

### Technical Debt
- 🔴 **Crítico**: Complexidade excessiva (27 tabs), features duplicadas
- 🟡 **Alto**: Excesso de dados mockados, modelos preditivos falsos
- 🟢 **Médio**: Integração incompleta (OpenAI não utilizado), queries não otimizadas
- 🔵 **Baixo**: Traduções incompletas, dark mode parcial

### Known Issues
- Edge Function `ntai-process-study` está configurada mas não utiliza OpenAI API
- Alguns componentes ainda têm textos hardcoded (não traduzidos)
- Dark mode não funciona perfeitamente em todos os componentes
- Performance pode degradar com muitos dados (falta paginação em algumas views)

---

## Formato de Versionamento

### MAJOR.MINOR.PATCH

- **MAJOR** (x.0.0): Mudanças incompatíveis com versões anteriores
  - Exemplos: Reescrita completa da arquitetura, mudança de framework, breaking changes na API
  
- **MINOR** (0.x.0): Adição de novas funcionalidades (compatível com versões anteriores)
  - Exemplos: Novas tabs, novos módulos, novos endpoints, novos gráficos
  
- **PATCH** (0.0.x): Correções de bugs e ajustes menores
  - Exemplos: Fix de bugs, ajustes de UI, correções de typos, otimizações de performance

---

## Convenções de Commit

Para facilitar a geração automática do changelog, use os seguintes prefixos:

- `feat:` - Nova funcionalidade (incrementa MINOR)
- `fix:` - Correção de bug (incrementa PATCH)
- `docs:` - Mudanças na documentação
- `style:` - Mudanças de formatação (não afetam código)
- `refactor:` - Refatoração de código (sem mudança funcional)
- `perf:` - Melhorias de performance
- `test:` - Adição/correção de testes
- `chore:` - Tarefas de manutenção

**Breaking changes**: Adicione `BREAKING CHANGE:` no corpo do commit (incrementa MAJOR)

---

## Links Úteis

- **Documentação do Projeto**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Plano de Demo Stanford**: [docs/STANFORD_DEMO.md](./docs/STANFORD_DEMO.md)
- **Estado Atual**: [docs/CURRENT_STATE.md](./docs/CURRENT_STATE.md)
- **Keep a Changelog**: https://keepachangelog.com/pt-BR/1.0.0/
- **Semantic Versioning**: https://semver.org/lang/pt-BR/
