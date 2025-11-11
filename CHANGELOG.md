# 📝 Changelog - NutraTherapy

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

---

## [Unreleased]

### Removed
- 🗑️ **Sistema de inicialização automática de admin removido**:
  - Deletado `src/hooks/useInitAdmin.ts` (hook que expunha credenciais em toasts)
  - Removida chamada do hook de `src/pages/Index.tsx` (linhas 8 e 17)
  - Deletada edge function `supabase/functions/init-admin-user/index.ts` (189 linhas de código morto)
  - **Motivo da remoção**:
    - ❌ Toasts expunham credenciais hardcoded (`mrachlyn@gmail.com / nutra12`)
    - ❌ Gerava erros constantes nos logs (profiles.email não existe, violação de constraint unique)
    - ❌ Não mais necessário após desproteger rotas (commit anterior - qualquer usuário autenticado tem acesso total)
  - **Impacto**: Zero - sistema não era mais útil após remoção de `requiredRole` das rotas
  - **Segurança**: Melhoria significativa - credenciais não são mais expostas na interface

### Changed
- 🔓 **CRÍTICO: Acesso liberado para demo Stanford - Rotas desprotegidas**:
  - Removida verificação de `requiredRole` nas rotas `/veterinario` e `/administrador`
  - Agora **qualquer usuário autenticado** pode acessar todos os portais
  - Veterinarian Portal: Não requer mais role 'veterinarian'
  - Control Panel (Admin): Não requer mais role 'admin'
  - Owner Portal: Continua em construção (under construction)
  - ⚠️ **APROPRIADO PARA DEMO STANFORD (ambiente acadêmico controlado)**
  - ⚠️ **NÃO USAR EM PRODUÇÃO**: Para produção futura, restaurar verificações de role e implementar RLS policies específicas por role
  - Arquivo modificado: `src/App.tsx` (linhas 40-49)
  - Comportamento: `ProtectedRoute` apenas verifica se `user !== null` (autenticação básica)
  - Não autenticados: Continuam sendo redirecionados para `/auth`

- 🔄 **Reorganização dos cards da homepage**:
  - Nova ordem (esquerda → direita): Control Panel → Veterinarian Portal → Owner Portal
  - Layout adaptado para destacar primeiro o painel administrativo/pesquisa
  
- 📝 **Descrição do Owner Portal atualizada**:
  - PT: "Acompanhe os PETs que aderiram ao NutraTherapy e monitore seu plano de tratamento nutracêutico personalizado"
  - EN: "Follow the PETs enrolled in NutraTherapy and monitor their personalized nutraceutical treatment plan"
  - Reflete melhor o contexto de adesão ao programa e acompanhamento de planos personalizados
  - Atualizada tanto na área logada (`tutorAreaDesc`) quanto não-logada (`forTutorsDesc`)

### Added
- 🎓 **Sistema de Acesso Simplificado Stanford**:
  - Novo componente `StanfordDemoForm.tsx` para acesso demo simplificado
  - Autenticação com email único + senha fixa (`@stanford@`)
  - Login/signup automático: tenta login → se falhar, cria conta automaticamente
  - Validação de email com feedback visual (zod schema)
  - Interface minimalista: campo de email + botão de acesso
  - Ícone GraduationCap (🎓) para identidade visual Stanford
  - Toast notifications para feedback do usuário (bem-vindo, login existente, erros)
  - Nota visual explicando autenticação simplificada para demo
  - Traduções completas PT/EN para todas as mensagens (12 novas chaves)
  - Versão i18n: 1.2.6 → 1.2.7

### Changed
- 🔄 **AuthPage simplificada para Demo Stanford**:
  - Removidas tabs Login/Register (simplificação total)
  - Interface direta: Card único com `StanfordDemoForm`
  - Título: "Stanford Demo Access" (PT: "Acesso Demo Stanford")
  - Descrição: "Enter your email to explore the NutraTherapy platform"
  - Mantém redirecionamento automático se já autenticado
  - Removidas funções de registro manual (`handleRegister`)

### Changed
- 🔓 **Acesso liberado para demo Stanford**:
  - **Veterinarian Portal**: Removida validação de role (veterinarian) - todos os usuários logados podem acessar
  - **Control Panel (Admin)**: Removida validação de role (admin) - todos os usuários logados podem acessar
  - Removidos botões desabilitados e mensagens "Request access" dos portais liberados
  
- 🚧 **Owner Portal bloqueado temporariamente**:
  - Card do "Owner Portal" na homepage marcado como "Under Construction"
  - Botão desabilitado com estilo visual de bloqueio (opacity 60%, badge 🚧)
  - Nova chave de tradução `home.underConstruction` (PT: "Em Construção" / EN: "Under Construction")
  - Acesso ao `/tutor` será reabilitado em versão futura

- 📝 **Placeholder do email simplificado para demo Stanford**:
  - EN: `your.name@stanford.edu` → `yourname@stanford.edu` (sem ponto)
  - PT: `seu.nome@stanford.edu` → `seunome@stanford.edu` (sem ponto)
  - Reflete melhor a aceitação de qualquer formato de email na demo

### Removed
- ❌ **Componentes antigos de autenticação deletados**:
  - Arquivo `src/components/auth/LoginForm.tsx` deletado (não mais utilizado)
  - Arquivo `src/components/auth/RegisterForm.tsx` deletado (não mais utilizado)
  - Removidos do AuthPage: tabs de Login/Register (Tabs, TabsList, TabsTrigger)
  - Removido estado `activeTab` (não mais necessário)
  - Código limpo: redução de ~300 linhas de código obsoleto

### Technical
- ✅ Fluxo de autenticação: `signIn()` → se erro → `signUp()` automático
- ✅ Nome extraído do email: `email.split('@')[0]` (parte antes do @)
- ✅ Sobrenome fixo: "Stanford Demo" para todos os usuários demo
- ✅ Senha fixa conhecida: `@stanford@` (OK para ambiente acadêmico controlado)
- ✅ Loading states durante autenticação (botão desabilitado + spinner)
- ✅ Todos os emails registrados automaticamente na tabela `profiles`

### Changed
- 📝 **Refinamento de textos da plataforma**:
  - **Footer**: Adicionado "scalable" antes de "intelligent" (destaque escalabilidade)
  - **Hero subtitle**: Reescrito para melhor descrever atividades mantendo estatísticas (267 estudos, 35 compostos, 95 condições, índice 4.2/5)
    - Ênfase em "evidence-based", "peer-reviewed", "AI-driven personalized recommendations"
  - **Header slogan**: Quebrado em duas linhas para melhor legibilidade visual
    - Linha 1: "Mass-personalized nutraceutical therapy platform"
    - Linha 2: "& research"
  - Todas as mudanças mantêm suporte bilíngue completo (PT/EN)
- 📝 **Atualização massiva de textos da plataforma para apresentação profissional**:
  - **Header**: Novo slogan conciso "Mass-personalized nutraceutical therapy platform & research"
  - **Hero subtitle**: Incluídas estatísticas concretas "A scientific database built from 267 studies covering 35 nutraceuticals and 95 condition links, with an overall efficacy index of 4.2/5"
  - **Welcome message**: Simplificado para "Welcome back! You're signed in as [email]"
  - **Cards de áreas renomeados**:
    - "Área do Tutor" → "Owner Portal" (EN) / "Portal do Tutor" (PT)
    - "Área do Veterinário" → "Veterinarian Portal" (EN) / "Portal do Veterinário" (PT)
    - Descrições expandidas com foco em funcionalidades específicas
    - Botões com textos mais descritivos: "Go to Owner Portal", "Go to Vet Portal", "Open Admin"
  - **Footer**: Atualizado para "NutraTherapy Pet © 2025 — Intelligent nutraceutical recommendation system for pets"
  - Versão i18n: 1.2.4 → 1.2.5
  - Todas as mudanças mantêm suporte bilíngue completo (PT/EN)
- 🎨 **Redesign da página inicial**:
  - Card "R&D + Base de Conhecimento" renomeado para **"Painel de Controle"** (PT) / **"Control Panel"** (EN)
  - Descrição atualizada: "Central de gerenciamento da plataforma: pesquisa, base de conhecimento, configurações e administração do sistema"
  - Ícone alterado de Microscope (🔬) para UserCog (⚙️) para melhor representar o controle centralizado da plataforma
  - Layout otimizado: grid alterado de 4 para 3 cards (mais limpo e balanceado)
- 🔄 **Reorganização da Base de Conhecimento**:
  - "Relations" movido para antes de "A.I. Insights"
  - Nova ordem: Estudos → Nutracêuticos → Alvos → **Relations** → **A.I. Insights** → Configurações
  - Melhora a progressão lógica: primeiro visualiza relações, depois insights gerados pela IA

### Added
- ✨ **Nova aba "A.I. Insights" na Base de Conhecimento**:
  - Apresenta 3 tipos de insights: Descobertas Longitudinais, Novos Estudos, Análises de Eficácia
  - Interface inspirada em sugestões de estudos com confidence score
  - Tabs detalhadas: Overview, Evidence, Required Resources
  - Mock data com 3 insights reais baseados em 18.347+ cães monitorizados
- ✅ **Restaurada aba "Relações" na Base de Conhecimento**:
  - Visualização de relações entre nutracêuticos e condições de saúde
  - Componente `RelationsTab` reintegrado (network, Sankey, matrix views)
  - Posição: Entre "A.I. Insights" e "Settings"

### Removed
- ❌ **Card "Área do Administrador" removido da página inicial**:
  - Eliminada duplicação desnecessária (ambos cards "R&D" e "Admin" redirecionavam para `/administrador`)
  - Funcionalidades consolidadas no novo card "Painel de Controle"
  - Interface mais limpa: 3 cards ao invés de 4
- ❌ **Aba "Manage Outcomes" removida**:
  - Funcionalidade não essencial como aba standalone
  - Componente `OutcomeManagementPanel` mantido no código mas não acessível via navegação principal

### Changed
- 🔄 **Estrutura da Base de Conhecimento corrigida**:
  - Ordem final: Estudos → Nutracêuticos → Alvos Veterinários → A.I. Insights → **Relações** → Settings
  - "Manage Outcomes" movido para fora do fluxo principal
  - Versão i18n: 1.1.9 → 1.2.0 (force reload)

### Added
- 🌍 **Sistema completo de bilinguismo para condições veterinárias**:
  - Todas condições agora criadas com name (PT) + name_en (EN) desde o início
  - Interface 100% consistente independente do idioma selecionado (PT/EN)
  - Sistema automático de tradução via Lovable AI (Gemini 2.5 Flash)
  - Nova Edge Function `translate-and-categorize-conditions` para atualizar condições existentes

- 📊 **Sistema inteligente de categorização de condições**:
  - 14 categorias veterinárias profissionais definidas:
    * Musculoesquelética, Cardiovascular, Renal, Imunológica
    * Digestiva, Hepática, Dermatológica, Metabólica
    * Oncológica, Oftalmológica, Respiratória, Oxidativa
    * Envelhecimento, Inflamatória, Geral
  - Categorização automática baseada em análise semântica do nome da condição
  - Cada categoria possui nome bilíngue (PT/EN)
  - Todas condições exibem categoria apropriada na tabela

- 🎯 **Sistema de severity level para condições**:
  - 4 níveis de gravidade clínica: low, medium, high, critical
  - Atribuição automática baseada na categoria e tipo de condição
  - Badges coloridos na interface para visualização rápida
  - Facilita priorização e tomada de decisão clínica

### Fixed
- 🐛 **CRÍTICO: Correção do efficacy_score na migração de condições**:
  - Removida multiplicação por 10 que violava check constraint do banco (0-10)
  - Edge Function agora salva valores corretos (era 32-45, agora 1.0-4.5)
  - Migração de condições finalmente funcionando! 🎉

### Added
- ✅ **10 novos nutracêuticos no mapeamento de condições**:
  - Silimarina (3 condições), Própolis Verde (4), Pólen de Abelha (4)
  - Allicina (4), Apigenina (5), Beta-Glucanas (5)
  - Ácido Alfa-Lipóico (6), Astaxantina (5), Quercetina (3), Astragalus (5)
  - Total: ~126 relações de condições prontas para migração
  - Aba Matriz agora exibirá TAGs para todos os 19 nutracêuticos

### Changed
- 🌍 **Idioma padrão alterado para Inglês (EN)**:
  - Aplicação agora inicia em inglês para novos usuários
  - Fallback de traduções alterado de PT → EN
  - Usuários que já definiram idioma manualmente mantêm sua escolha
  - Versão i18n: 1.1.8 → 1.1.9

### Fixed
- 🌍 **Correção DEFINITIVA de fallbacks i18n (PT → EN)**:
  - Todos fallbacks em `NutraceuticalDetails.tsx`, `StudiesTable.tsx`, `ConditionsTable.tsx`, `ExpandedContent.tsx` alterados de PT para EN
  - Interface agora mostra inglês correto quando i18n falha ou não está pronto
  - Fallbacks atualizados: 'Details', 'Description', 'Chemical Compound', 'Source', 'Dosage', 'Not defined', 'Title', 'Journal', 'Relevance', 'Unknown study', 'Condition', 'Type', 'Efficacy', 'Unknown condition', 'Conditions', 'Scientific Studies', 'No associated studies', 'No associated conditions'
  - Versão i18n: 1.1.7 → 1.1.8
- 🌍 **Correção completa de i18n na aba Nutracêuticos Unificados**:
  - Tabs principais ("Catálogo", "Relações", "Matriz") agora traduzem corretamente para EN
  - Subtítulo da página traduzido corretamente
  - Versão i18n: 1.1.6 → 1.1.7
- 🔥 **Correção DEFINITIVA de cache i18n (versão 1.1.6)**:
  - Limpeza ultra-agressiva: localStorage + sessionStorage
  - Força limpeza em TODA primeira carga
  - Delay de 500ms antes do reload para garantir persistência
  - Logs detalhados: 🔥 LIMPEZA FORÇADA, ✅ Cache limpo
  - Versão i18n: 1.1.4 → 1.1.5 → 1.1.6
- ✅ **Sistema de fallback para traduções**:
  - Helper `getText()` adicionado em 4 componentes
  - Fallbacks em português para UX imediata
  - Detecta quando i18n não está ready
  - Previne chaves literais na interface
- 🔗 **Correção crítica nos links DOI**:
  - Adicionado `encodeURIComponent()` para caracteres especiais
  - DOIs com `()[]` agora funcionam corretamente
  - Links testados: 10.1111/j.1532-950X.2016.12287.x ✅
  - 93 associações de estudos com links corrigidos

### Added
- ✅ **Dados mockados para Prebióticos e Vitamina E na Edge Function**:
  - Prebióticos: 9 relações de condições (3 prevention: Disbiose intestinal 3.8, Problemas digestivos 3.6, Sistema imunológico enfraquecido 3.5 | 3 treatment: Disbiose intestinal 4.1, Diarreia crônica 3.9, Constipação 3.7 | 3 support: Saúde digestiva 4.0, Microbiota intestinal 4.2, Sistema imunológico 3.8)
  - Vitamina E: 9 relações de condições (3 prevention: Estresse oxidativo 3.9, Problemas de pele 3.6, Imunodeficiência 3.5 | 3 treatment: Dermatite 3.8, Estresse oxidativo 4.0, Problemas musculares 3.7 | 3 support: Saúde da pele 3.9, Sistema imunológico 3.7, Função celular 3.8)
  - Total de nutracêuticos cobertos: 9 (era 7)
  - Total de relações de condições a migrar: ~75 (era ~55)
- ✅ **Edge Function para migração de condições de nutracêuticos** (`migrate-nutraceutical-conditions`):
  - Migra ~150-200 relações de condições dos arquivos mockados para o banco
  - Popula `health_conditions` e `nutraceutical_conditions` automaticamente
  - Suporte para 3 tipos de relações: prevention, treatment, support
  - Cache inteligente de condições para evitar duplicatas
  - Nutracêuticos migrados: Glucosamina, Condroitina, L-carnitina, Equinácea, Quitosana, Coenzima Q10, EPA
- 🔘 **Botão de migração de condições na UI**:
  - Adicionado botão "🔗 Migrar Condições" na aba Catálogo
  - Feedback visual durante migração
  - Toast com estatísticas de sucesso (relações criadas, nutracêuticos atualizados)
  - Refresh automático dos dados após migração
  - Traduções completas PT/EN para todas mensagens

### Changed
- 📊 **Aba Matriz agora exibe TAGs de condições**:
  - Nutracêuticos migrados exibirão badges coloridos baseados em eficácia
  - Glucosamina: 9 condições (prevention: 3, treatment: 3, support: 3) com eficácia 3.2-4.2
  - Condroitina: 9 condições (prevention: 3, treatment: 3, support: 3) com eficácia 3.4-4.1
  - L-carnitina: 9 condições (prevention: 3, treatment: 3, support: 3) com eficácia 3.5-4.3
  - Equinácea: 6 condições (prevention: 3, treatment: 2, support: 1) com eficácia 3.5-4.2
  - Quitosana: 6 condições (prevention: 2, treatment: 2, support: 2) com eficácia 3.5-3.9
  - Coenzima Q10: 8 condições (prevention: 2, treatment: 3, support: 3) com eficácia 3.7-4.1
  - EPA: 9 condições (prevention: 3, treatment: 3, support: 3) com eficácia 3.6-4.3
  - Total estimado: ~55 relações de condições criadas

### Fixed
- ✅ **Correção CRÍTICA na exibição de estudos científicos**:
  - Journals exibidos corretamente (não mais "N/A" quando há dados)
  - Relevância mostra valor real (não mais "0" quando há score)
  - Mapper corrigido para preservar estrutura aninhada do banco (`nutraceutical_studies`)
- ✅ **Enriquecimentos na tabela de estudos**:
  - Títulos clicáveis com link direto para DOI externo
  - Suporte completo a i18n (PT/EN) para títulos e journals
  - Ano de publicação exibido ao lado do título quando disponível
  - Ícone de link externo para melhor UX e indicação visual
  - Modo dark adaptativo em badges de relevância
- ✅ **Validação dos 90 estudos**: Todas as associações nutracêutico-estudo agora visíveis na interface

### Added
- ✅ **78 estudos científicos veterinários** adicionados ao banco de dados
  - 100% focados em aplicações veterinárias para cães e gatos
  - Journals tier-1: JAVMA, JVIM, Vet Immunol, Vet Surgery, Nature, Cell Metabolism
  - Período: 2005-2023 (últimos 18 anos de pesquisa veterinária)
  - Todos com títulos bilíngues (PT/EN), DOI, abstracts completos e lista de autores
- ✅ **Base científica completa**: 31/31 nutracêuticos com ≥3 estudos cada
  - Total de estudos no sistema: 90 estudos científicos
  - Média de 3.0 estudos por nutracêutico
  - 93 associações nutracêutico-estudo criadas
  - Relevância média: 5.0/5 (todos os estudos veterinários de alta qualidade)
- ✅ **Cobertura de condições veterinárias**:
  - Osteoartrite e mobilidade: 12 estudos
  - Cardioproteção e cardiomiopatias: 11 estudos
  - Imunomodulação e resposta vacinal: 9 estudos
  - Doença renal crônica: 6 estudos
  - IBD e saúde gastrointestinal: 8 estudos
  - Função cognitiva e neuropatias: 7 estudos
  - Câncer e senolíticos: 5 estudos
  - Hepatoproteção: 6 estudos
  - Dermatite atópica: 4 estudos
  - Longevidade e sarcopenia: 6 estudos

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
