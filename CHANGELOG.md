# 📝 Changelog - NutraTherapy

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

---

## [Unreleased]

### Fixed
- ✅ **CRITICAL BUG FIX**: Corrigido pipeline de extração de texto de PDFs processados
  - `extract-study-entities` agora suporta estrutura do `parse-study` (Unstructured API: elements, sections, tables)
  - `document-chat` também atualizado para processar corretamente documentos do parse-study
  - Prevenção de alucinação da IA: validação de texto extraído antes de enviar para análise
  - Logging detalhado para debug: tamanho do texto, estrutura detectada, preview dos primeiros 200 chars

### Added
- ✅ Inline success confirmation in File Upload panel (replacing toast)
- ✅ Duration display for each RAG processing log step (shows time taken between consecutive log entries)
- ✅ Real document context extraction for AI chat citations (extracts full_text, abstract, sections from study data)
- ✅ Literal text quotes from original documents in AI responses (enforces exact quotes in citations)
- ✨ **Renderização avançada de Markdown no chat**: Mensagens da IA agora são renderizadas com formatação completa, incluindo títulos, listas, negrito, itálico, code blocks e links
- 🎨 **Componente CitationCard**: Citações científicas são destacadas visualmente em cards especiais com ícones e formatação diferenciada
- 🏷️ **Badges para nutracêuticos**: Nutracêuticos mencionados no texto são automaticamente convertidos em badges clicáveis
- 📊 **Barras de progresso para scores**: Scores de eficácia (formato X/Y) são renderizados como barras de progresso visuais com percentual
- 📝 **Prompt estruturado para IA**: Sistema prompt melhorado com diretrizes claras de formatação, uso de emojis, e formato obrigatório de resposta em seções
- 🔍 **Citações contextualizadas**: Suporte para citações no formato [Citação: texto - Seção X] que são extraídas e renderizadas em cards separados
- 📦 **Dependências**: Adicionadas bibliotecas `react-markdown`, `remark-gfm`, `rehype-sanitize`, `rehype-raw` para renderização rica de markdown

### Changed
- ✅ File upload success feedback changed from toast to inline message panel with navigation button
- ✅ RAG processing log now calculates and displays duration (in seconds) between consecutive steps
- ✅ AI chat prompt enhanced to use literal document text for accurate citations (enforces exact quotes)
- ✅ Document context extraction improved to include full_text, abstract, sections, and findings from study data
- ✅ Citation format enforced to use exact quotes from original document text (no paraphrasing allowed)
- ✅ i18n version incremented to 1.3.28

### Removed
- ✅ Toast notification removed from file upload success flow (replaced with inline panel)

### Fixed
- ✅ **Edge Functions Deployment**: Forçado deploy de `document-chat` e `extract-study-entities` para garantir versões atualizadas no servidor
- ✅ **Chat com Documento - Logging Detalhado**: Adicionados logs extensivos em toda pipeline de chat para facilitar debugging
  - Log de studyId, question, conversation history na entrada
  - Log de dados carregados (study, extraction, analysis_data)
  - Log de contexto construído (contagens de nutracêuticos, condições, achados)
  - Log de resposta da AI (tamanho, preview)
  - Log de erros detalhados no frontend e backend
- ✅ **Chat com Documento - Tratamento de Erros**: Melhorado feedback para usuários em casos de erro
  - Mensagens específicas para rate limiting (429)
  - Mensagens específicas para estudo não encontrado (404)
  - Exibição de detalhes técnicos quando disponíveis
  - Sugestões de ação para o usuário
- ✅ **Extract Study Entities - Fallbacks Robustos**: Mantidos fallbacks para usar dados do Gemini File Search quando AI retorna vazio
- ✅ **Extract Study Entities - Status Correto**: Confirmado uso de `kanban_status: 'processed'` (não 'reviewed')

### Improved
- 📊 **Observabilidade**: Sistema agora possui logging completo do fluxo de processamento e chat
- 🎯 **UX de Erros**: Mensagens de erro mais claras e acionáveis para usuários

### Added - 2025-11-21 16:45 BRT
- ✅ **REVOLUCIONÁRIO: Sistema completo de Chat com Documento usando Lovable AI**
  - Nova edge function `document-chat` com Gemini 2.5 Flash para conversação contextual
  - Interface de chat moderna com histórico persistente em tempo real
  - Sugestões de perguntas inteligentes contextuais baseadas no conteúdo do estudo
  - Citações automáticas com referências precisas ao documento
  - Export de conversas em formato Markdown (.md)
  - Tabela `study_chat_history` para persistência com RLS policies
  - Suporte a histórico de conversação (últimas 6 mensagens para contexto)
  - Rate limiting gracioso (429) com mensagens amigáveis ao usuário
  - Componente `DocumentChatInterface.tsx` (330 linhas)
  - Integração completa: copia mensagens, limpa chat, mostra timestamps

- ✅ **VISUALIZAÇÕES AVANÇADAS: Sistema rico de visualizações científicas**
  - Timeline animada do processamento com 4 fases (Upload → File Search → Extração → Análise)
  - Network Graph interativo com vis-network (Nutracêuticos ↔ Condições)
  - Distribuição de eficácia com barras de progresso coloridas por score (verde ≥80%, azul ≥60%, amarelo ≥40%, vermelho <40%)
  - Cards estatísticos com ícones temáticos e cores personalizadas
  - Sistema de tabs: Timeline, Network Graph, Distribuição
  - Suporte a dados parciais, estados de loading e mensagens de "dados insuficientes"
  - Componente `EnhancedStudyVisualization.tsx` (291 linhas)
  - Integração com biblioteca vis-network para grafos de relações complexas

- ✅ **INTEGRAÇÕES COMPLETAS: Expansão de interfaces administrativas**
  - `NtaiAnalysisResults`: Novas abas "📊 Visualizações" e "💬 Chat" (4 → 6 abas)
  - `EstudoDetailDialog`: Novas abas "📊 Visualizações" e "💬 Chat" (4 → 6 abas)
  - Ícones lucide-react (MessageCircle, BarChart3) para melhor UX
  - Navegação fluida entre análise tradicional, visualização avançada e chat interativo
  - Props passadas corretamente: `studyId`, `studyTitle`, `extractedData`

- ✅ **COMPONENTES REUTILIZÁVEIS**:
  - `DocumentChatInterface.tsx`: Chat completo com mensagens, scrolling automático, sugestões, copy, export
  - `EnhancedStudyVisualization.tsx`: Container de visualizações com múltiplas abas e stats cards
  - Suporte total a internacionalização (PT/EN)
  - Responsive design para mobile e desktop

### Fixed - 2025-11-21 16:45 BRT
- ✅ **CRÍTICO: Corrigido erro de constraint `processed_studies_kanban_status_check`**
  - **Problema**: `extract-study-entities` tentava definir `kanban_status = 'reviewed'` (valor inválido)
  - **Constraint permite**: `['new', 'processing', 'processed', 'error']`
  - **Solução**: Mudado de `'reviewed'` para `'processed'` em `extract-study-entities/index.ts` (linha 254)
  - **Impacto**: Workflow de extração agora completa sem erro de DB constraint
  - **Logs atualizados**: "Atualizando status do estudo para 'processed'..."

### Changed - 2025-11-21 16:45 BRT
- 🌍 **Traduções bilíngues completas (PT/EN)**:
  - `chat.*`: title, inputPlaceholder, thinking, suggestions, responseReceived, error, copied, exported, etc. (12 chaves)
  - `viz.tabs.*`: timeline, network, distribution
  - `viz.timeline.*`: title, upload, fileSearch, extraction, analysis
  - `viz.status.*`: completed, inProgress, pending
  - `viz.stats.*`: nutraceuticals, conditions, mechanisms, findings
  - `viz.network.*`: title, description, noData
  - `viz.distribution.*`: title
- 🔄 **Versão i18n**: 1.3.25 → 1.3.26 (force cache reload)
- ⚙️ **Supabase config.toml**: Adicionada configuração `[functions.document-chat]` com `verify_jwt = true`

### Fixed - 2025-11-21 16:00 BRT
- **CRÍTICO: Corrigido erro InvalidKey ao fazer upload de PDFs com espaços ou caracteres especiais**
  - **Problema identificado**: Supabase Storage rejeita nomes de arquivo com espaços e caracteres especiais (—, –, etc.)
  - **Solução implementada**:
    1. ✅ Criada função utilitária `sanitizeFileName()` em `src/utils/fileNameSanitizer.ts`
       - Substitui espaços por underscores
       - Converte em-dashes (—) para hífens (-)
       - Remove caracteres especiais mantendo legibilidade
       - Normaliza caracteres unicode (remove acentos)
       - Limita tamanho do nome (max 200 chars)
    2. ✅ Criada função `createSafeStoragePath()` para combinar UUID + nome sanitizado
    3. ✅ Atualizado `FileUploadTab.tsx`:
       - Upload usa `createSafeStoragePath()` (linha 78)
       - Mostra aviso visual quando nome é sanitizado (linhas 241-246)
    4. ✅ Atualizado `SciSpace2StepImport.tsx`:
       - Meta sumário sanitizado (linha 43)
       - Base de estudos sanitizada (linha 50)
    5. ✅ Traduções bilíngues completas:
       - `studies.import.fileNameSanitized` (PT/EN)
       - `studies.import.invalidCharactersRemoved` (PT/EN)
    6. ✅ Versão i18n incrementada: 1.3.24 → 1.3.25
  - **Impacto**: Upload de PDFs com nomes complexos agora funciona (ex: "Turmeric and Curcumin—Health-Promoting Properties in Humans versus Dogs.pdf" → "Turmeric_and_Curcumin-Health-Promoting_Properties_in_Humans_versus_Dogs.pdf")
  - **Arquivos afetados**:
    - `src/utils/fileNameSanitizer.ts` (NOVO - 36 linhas)
    - `src/components/administrador/estudos/import/FileUploadTab.tsx` (linhas 10, 78, 241-246)
    - `src/components/administrador/estudos/import/SciSpace2StepImport.tsx` (linhas 5, 43, 50)
    - `src/locales/pt/translation.json` (linhas 1475-1476)
    - `src/locales/en/translation.json` (linhas 1475-1476)
    - `src/i18n.ts` (linha 23: versão 1.3.25)

### Fixed - 2025-11-21 15:20 BRT
- **CRÍTICO: Correção de estrutura de dados em extract-study-entities**
  - Corrigido `extractTextContent()` para suportar estrutura atual do `gemini-file-search` (ExtractedStudyData)
  - Adicionado fallback para usar dados já extraídos pelo Gemini quando AI retornar arrays vazios
  - Corrigido kanban_status de 'extracted' (inválido) para 'reviewed' (válido)
  - Melhorados prompts da AI para extração mais abrangente e precisa
  - Adicionado logging detalhado em todas as etapas de extração
  - Agora a extração identifica corretamente nutracêuticos e condições de saúde
  - Implementada compatibilidade com estruturas antigas (sections) e novas (flat format)

### Fixed - 2025-11-21 (Critical Bug: Study Extraction 404)
- **🐛 [CRÍTICO] Corrigido erro 404 "Study not found" na extração de estudos**
  - **Problema identificado**: `extract-study-entities` edge function usava `.eq('study_id', studyId)` para buscar em `processed_studies`, mas o parâmetro recebido é o `id` (UUID, primary key), não o `study_id` (TEXT)
  - **Causa raiz**: Inconsistência entre schema do banco e lógica da edge function
  - **Solução implementada**:
    1. ✅ Migração DB: Alterado `study_extractions.study_id` de TEXT → UUID com foreign key para `processed_studies.id`
    2. ✅ Corrigido `extract-study-entities/index.ts`: Mudado todas as queries de `.eq('study_id', ...)` para `.eq('id', ...)`
    3. ✅ Adicionados logs detalhados de debug para rastreamento (🔍 busca, ✅ sucesso, ❌ erro, 💾 salvamento)
  - **Impacto**: Workflow completo de processamento de estudos (upload → gemini-file-search → extract-study-entities → study_extractions) agora funciona corretamente
  - **Arquivos afetados**:
    - `supabase/functions/extract-study-entities/index.ts` (linhas 38-42, 44-53, 175-184, 199-206)
    - Migration: `study_extractions.study_id` tipo alterado + foreign key constraint corrigida

### Changed
- **🔧 Corrigido nome do modelo de IA exibido nos logs**
  - Alterado de "GPT-4o" para "gemini-2.5-flash" em todos os estados iniciais
  - Arquivos: `useNtaiConfig.ts`, `useNtaiProcessing.ts`, `useProcessingLogic.ts`
  - Adicionado emoji 🤖 nos logs de modelo para melhor identificação

### Added
- **✨ Botões de Limpar e Exportar Log no painel NTAI**
  - Botão "Limpar Log" com confirmação via AlertDialog
  - Botão "Exportar Log" para download em formato .txt
  - Feedback via toast notifications
  - Traduções PT/EN completas
  - Arquivos: `NtaiProcessingLog.tsx`, `NtaiProcessingSection.tsx`, `useNtaiLogs.ts`

### Removed
- ❌ **Tab duplicada "AI Processing" removida do menu lateral**
  - Deletado arquivo `src/components/administrador/ProcessamentoIATab.tsx` (componente redundante)
  - Removida entrada `processamento-ia` de `src/config/admin-tabs.ts`
  - Removido import do `ProcessamentoIATab` em `admin-tabs.ts`
  - **Funcionalidade mantida**: AI Processing agora acessível APENAS via Scientific Studies → Import & Process → AI Processing (sub-tab)
  - **Motivo**: Eliminação de duplicação crítica que causava confusão de navegação e potenciais conflitos de estado

### Changed
- 🔄 **Arquitetura de processamento de IA simplificada**:
  - AI Processing consolidado em uma única localização dentro de Scientific Studies
  - Badge "Recomendado" adicionado na seção "Upload e Extração Automática (Gemini AI)" para orientação visual
  - Navegação contextual mantida: botões "Process with AI" continuam funcionando corretamente
  - Contagem de tabs: 28 → 27 tabs administrativas (8 Knowledge Base → 7 Knowledge Base)
- 📚 **Documentação atualizada**:
  - `ARCHITECTURE.md` v1.4.0: Seção de navegação atualizada (27 tabs, 7 no Knowledge Base)
  - `CURRENT_STATE.md` v1.4.0: Correção de arquitetura registrada
  - Scientific Studies agora explicitamente lista sub-tabs (Import & Process com AI Processing)

### Added
- ✅ Documentação completa da arquitetura NTAI Knowledge Graph em `docs/NTAI_KNOWLEDGE_GRAPH_ARCHITECTURE.md` (~700 linhas)
  - Modelo de dados expandido com 6 novas tabelas (mechanisms, study_findings GRADE, study_extractions, etc.)
  - Workflow de ingestão: PDF → Unstructured API → LLM → Curadoria → KG
  - Sistema RAG graph-aware: Top-down + Bottom-up + LLM synthesis
  - 8 visualizações interativas "WOW" (Network Graph, Evidence Heatmap, Pipeline Dashboard, etc.)
  - Roadmap de implementação de 6 fases (4-6 semanas)
- ✅ Sistema de explicações científicas contextuais in-app para demonstração Stanford
  - Componente reutilizável `TabInfoButton` com Dialog de 3 tabs (Visão Geral, Metodologia, Científica)
  - Conteúdo científico completo para 6 abas do Knowledge/Relational Base
  - ~50+ referências científicas com links PubMed/journals
- ✅ Referência à documentação NTAI adicionada em `ARCHITECTURE.md` v1.5.0

### Fixed
- 🐛 Corrigido sistema de traduções do `TabInfoButton` - chaves literais (`admin.tabInfo.*`) agora traduzem corretamente
  - Mesclado conteúdo de `tab-info.json` em `translation.json` (PT e EN)
  - Incrementada versão i18n para 1.3.15 (force cache clear)
  - Botão e dialog agora exibem traduções em PT/EN corretamente

### Changed
- ✅ Removidas badges de contagem de nutracêuticos da coluna "Tratabilidade Média" (mantém apenas porcentagem e "A Catalogar")
- ✅ Ajustado arredondamento de tratabilidade para múltiplos de 5 (5%, 10%, 15%...) para apresentação mais limpa e profissional
- ✅ Implementado badge "A Catalogar" para condições sem nutracêuticos catalogados (mais claro e positivo que "0%")
- ✅ Ajustados thresholds de tratabilidade: Baixa (0-35%), Moderada (40-65%), Boa (70-85%), Excelente (90-100%)
- ✅ Seção expandida de detalhes agora mostra mensagem apropriada quando não há dados catalogados

### Added
- 📊 **Nova coluna "Tratabilidade Média" na tabela de Alvos Veterinários**:
  - Cálculo baseado em efficacy scores e tipos de relacionamento (tratamento/prevenção/suporte)
  - Badges coloridos indicando nível de tratabilidade (Baixa 🔴, Moderada 🟡, Boa 🟢, Excelente 🟦)
  - Contagem de nutracêuticos disponíveis por condição
  - Detalhamento expandido com métricas de tratamento, prevenção, suporte e eficácia média
  - Card de estatística mostrando tratabilidade média geral do arsenal
  - Nova função SQL `get_conditions_with_treatability()` para cálculo otimizado no banco
  - Hook customizado `useConditionsWithTreatability` para busca de dados com métricas

### Changed
- 🎨 **Backgrounds dos cards de estudos agora muito transparentes (30% opacidade) para visual mais clean**
- 🎨 **Card "Next Steps" agora usa cor teal (verde-azulado) em vez de roxo para estética mais elegante e científica**
- ✅ **i18n**: Versão incrementada para 1.3.10 (cache refresh)

### Changed
- 🎨 **Study Progress Timeline - Labels abreviados com tooltips**:
  - Labels de fase agora usam formato compacto (M0, M2, M4, M6, M8, M10...) evitando sobreposição
  - Tooltip mostra nome completo da fase + dia ao passar o mouse
  - Marcadores visuais maiores (2.5px) com cores mais destacadas
  - Labels coloridos dinamicamente: azul para fases passadas, cinza para futuras
  - Cursor "help" indica interatividade dos marcadores
  - Solução elegante que mantém timeline limpa e informativa
- ✅ **i18n**: Versão incrementada para 1.3.9 (cache refresh)
- 📚 **Traduções**: Adicionada chave `admin.studies.progress.day` (PT: "Dia" / EN: "Day")

### Changed
- 🎨 **Study Notes - Redesign da seção "Preliminary Results"**:
  - Consolidados múltiplos cards coloridos em um único card elegante azul/índigo
  - Estrutura visual simplificada: introdução + lista com bullets para resultados
  - Removido grid de cards verdes individuais por categoria
  - Mantidas seções "Current Limitations" (amarelo) e "Next Steps" (roxo) inalteradas
  - Tipografia mais limpa: categorias em negrito, conteúdo em gray-700 para melhor legibilidade
  - Design mais profissional e elegante, reduzindo poluição visual
- 📊 **Population do Estudo Rapamycin + SGLT2i - Ajustado para dados reais**:
  - Treatment Count: 10 → 6 cães (refletindo os 6 que realmente iniciaram o protocolo)
  - Control Count: 10 → 2 cães (população controle atual)
  - Total iniciado: 8 cães dos 20 planejados (6 tratamento + 2 controle)
  - Visualização com paw prints agora mostra 6 🐾 no grupo tratamento e 2 🐾 no controle
  - Alinhado com as notas do estudo: "Apenas 6 cães dos 20 planejados iniciaram o protocolo"
- ✅ **i18n**: Versão incrementada para 1.3.8 (cache refresh)

### Changed
- ✅ **Study Notes**: Melhorada organização e estruturação das notas do estudo em andamento
  - Seção "Resultados Preliminares" com introdução destacada em card azul/índigo
  - Grid de resultados com cards verdes individuais para cada categoria (Perfil Lipídico, Função Renal, Cardioproteção, etc.)
  - Seção "Limitações Atuais" com card amarelo/âmbar e lista estruturada
  - Seção "Próximos Passos" com card roxo e lista de ações futuras
  - Ícones contextuais (TrendingUp, CheckCircle2, AlertTriangle, FlaskConical) para cada seção
  - Parsing automático do texto das notas para extrair e organizar informações por categoria
- ✅ **i18n**: Versão incrementada para 1.3.7 (cache refresh)
- ✅ **Estudos em Andamento**: Substituído estudo mockado de Omega-3 por estudo clínico REAL em andamento - "Protocolo Rapamicina + SGLT2i para Longevidade e Saúde Multiorgânica Canina"
  - 20 cães planejados (6 já iniciados há 6 meses)
  - Protocolo: Rapamicina 0,3mg/kg + SGLT2i alternado (Dapagliflozina 0,1mg/kg / Empagliflozina 0,2mg/kg a cada 2 meses)
  - 21 métricas científicas rigorosas em 7 categorias: Exames Laboratoriais Básicos, Função Renal, Função Cardíaca, Biomarcadores de Envelhecimento, Marcadores Inflamatórios, Biomarcadores Oncológicos, Métricas de Wearable (preparação API Invoxia)
  - Dados preliminares de 6 meses demonstram: redução de 28% no LDL, 50% na proteinúria, 40% no NT-proBNP, 43% na atividade mTOR, 54% na IL-6
  - Múltiplos outcomes: cardioproteção, proteção renal, prevenção oncológica, efeito anti-inflamatório, longevidade
  - Preparação para integração futura com API Invoxia (wearables) para monitoramento contínuo de FC, HRV e atividade física
  - Notas clínicas detalhadas com limitações atuais (recrutamento em andamento) e próximos passos (telômeros, relógio epigenético)

### Added
- ✨ **Sistema de Monitoramento Clínico completo**:
  - Nova tab "Monitoramento Clínico" com 12,847 pets em acompanhamento
  - 9 condições de saúde: Artrite, Cardíaca, Renal, Hepática, Alergias, Ansiedade, **Obesidade**, **Diabetes**, **Câncer**
  - Dashboard com métricas: tempo médio acompanhamento (8.3 meses), taxa adesão (76.2%)
  - Distribuição realista: 32.4% melhora significativa, 21.8% leve, 18.7% sem melhora, 27.1% dados insuficientes
  - Análise por condição com top raças, nutracêuticos usados, tempo para melhora
  - Timeline evolutiva com novos pets/mês, taxas de resposta, dropouts
  - Filtros: raça (50+), condição, status resposta, região
  - Dados mock estatisticamente realistas para demo Stanford
  - Arquivos: `mockClinicalData.ts`, `ClinicalMonitoringTab.tsx` + 6 componentes

### Changed
- 🔄 **Reorganização de navegação administrativa**:
  - "Bulk Actions" movido de "Actions" → "Configuration"
  - "Monitoring" renomeado para "Campaign Management" (PT: Gestão de Campanhas)
  - Nova tab "Clinical Monitoring" adicionada ao grupo "Actions"
  - ActionsGroup.tsx e ConfigurationGroup.tsx atualizados
- 🌍 **Traduções bilíngues completas**: `clinicalMonitoring.*` e `campaignManagement` em PT/EN
- 🔢 **Versão i18n incrementada**: `1.3.4` → `1.3.5` para refresh de cache

### Fixed
- 🔧 **Gráfico "Response Rates Over Time" corrigido para padrão clínico realista**:
  - Substituída lógica de "novos pets por mês" por "taxa de resposta acumulada"
  - Implementado padrão S-curve realista: crescimento (0-3m) → aceleração (3-8m) → plateau (8-12m)
  - Adicionada variabilidade natural (±5%) para simular flutuações mensais
  - Removida dependência problemática de dados de pets
  - Adicionado tooltip explicativo com Alert component sobre padrão de resposta nutracêutica
  - Título atualizado: PT "Taxa de Resposta Acumulada ao Longo do Tempo" / EN "Cumulative Response Rate Over Time"

### Changed
- 🎨 **Rebrand visual NTAI → RAG no frontend**:
  - **Badge removido**: Removido badge "Advanced Processing" / "Processamento Avançado" da seção de análise (EstudosTab.tsx linhas 136-142)
  - **Terminologia atualizada na UI**: Todas as strings visíveis mudaram de "NTAI" e "Multi-Agent" para "RAG" (Retrieval-Augmented Generation)
  - **Traduções atualizadas**: 
    - PT: "Análise NTAI" → "Análise RAG", "Processamento NTAI" → "Processamento RAG", "Adicionar à Fila NTAI" → "Adicionar à Fila RAG", "Simulação Multi-Agente" → "Simulação RAG", "Análise de IA Multi-Agente" → "Análise RAG", "Sistema de Análise Colaborativa" → "Sistema de Análise RAG", "Iniciar Análise Multi-Agente" → "Iniciar Análise RAG"
    - EN: "NTAI Analysis" → "RAG Analysis", "NTAI Processing" → "RAG Processing", "Add to NTAI Queue" → "Add to RAG Queue", "Multi-Agent Simulation" → "RAG Simulation", "Multi-Agent AI Analysis" → "RAG Analysis", "Collaborative Analysis System" → "RAG Analysis System", "Start Multi-Agent Analysis" → "Start RAG Analysis"
  - **Chaves de tradução**: `studies.ntai.*` → `studies.rag.*` + `admin.sidebar.dataProcessing.multiAgentSimulation` + `admin.multiAgentAnalysis.*` (valores atualizados)
  - **Componentes atualizados**: EstudosTab (linha 138), NtaiProcessingSection (linha 45), NtaiProcessingLog (linha 25), AnalysisStep (linhas 38-39, 48, 60, 147, 462)
  - **Menu administrativo**: "Multi-Agent Simulation" → "RAG Simulation" na sidebar (linha 340 PT/EN)
  - **Página de análise**: Título, subtítulo, descrição do card e botão principal atualizados para refletir RAG
  - **Versão i18n incrementada**: 1.0.1 → 1.3.2 (força reload de traduções)
  - **Código interno preservado**: Nomes de arquivos, hooks, tipos e interfaces permanecem inalterados (`useNtaiProcessing`, `NtaiAnalysisResult`, `multiAgentAnalysis` key, etc.)
  - **Impacto**: Mudança puramente visual - terminologia mais técnica e reconhecida pela comunidade de IA/ML (RAG é método padrão para LLMs com conhecimento externo)

### Changed
- 🌍 **Internacionalização da tela de resultados da análise RAG**:
  - **Componente atualizado**: `AnalysisResult.tsx` agora suporta PT/EN
  - **Traduções adicionadas**: 
    - `multiAgentAnalysis.result.*` em `pt/translation.json` e `en/translation.json`
    - Título, descrição, seções de processamento, correlações, recomendações e próximos passos
  - **Versão i18n incrementada**: 1.3.2 → 1.3.3
  - **Impacto**: Tela de sucesso da análise RAG agora exibe em português e inglês conforme idioma selecionado

### Fixed
- 🐛 **Corrigido erro de importação dinâmica do ActionsStep.tsx**:
  - **Problema**: "Failed to fetch dynamically imported module" causado por conflito de cache após reload forçado do i18n (versão 1.3.2)
  - **Solução**: Adicionados comentários JSDoc aos componentes ActionsStep e SmartCampaignSystem para forçar recompilação pelo Vite
  - **Arquivos modificados**: 
    - `src/components/administrador/dataAnalysis/ActionsStep.tsx` (linhas 4-7: documentação adicionada)
    - `src/components/administrador/massActions/SmartCampaignSystem.tsx` (linhas 9, 15-18: comentários atualizados)
  - **Causa raiz**: HMR (Hot Module Replacement) do Vite perdeu referência ao módulo após limpeza de cache do localStorage
  - **Impacto**: Tab "Ações" (/administrador?tab=actions) agora carrega corretamente sem erro de módulo não encontrado

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
