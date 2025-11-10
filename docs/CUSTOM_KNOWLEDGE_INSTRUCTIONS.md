# 📚 Instruções para Custom Knowledge - Manutenção Automática da Documentação

> **IMPORTANTE**: Copie o conteúdo abaixo e adicione ao final da Custom Knowledge do projeto via:
> **Project Settings → Manage Knowledge → Adicionar ao final do texto existente**

---

## 📚 MANUTENÇÃO AUTOMÁTICA DA DOCUMENTAÇÃO DO PROJETO

### 📂 Arquivos de Documentação Principal

Este projeto possui 4 arquivos de documentação críticos que DEVEM ser mantidos atualizados:

1. **ARCHITECTURE.md** - Arquitetura técnica, modelo de dados, navegação, serviços, design system
2. **docs/STANFORD_DEMO.md** - Estratégia de demo Stanford, prioridades, roadmap, funcionalidades WOW
3. **docs/CURRENT_STATE.md** - Estado atual detalhado (funcionalidades reais vs mockadas, débito técnico)
4. **CHANGELOG.md** - Histórico completo de mudanças no projeto (formato Keep a Changelog)

---

## 🚨 REGRA CRÍTICA: Atualização Obrigatória da Documentação

**SEMPRE que você fizer mudanças significativas no código, VOCÊ DEVE:**

1. ✅ **VERIFICAR** qual arquivo de documentação é afetado pela mudança
2. ✅ **LER** o arquivo atual usando lov-view para entender o contexto
3. ✅ **ATUALIZAR** a seção relevante do arquivo com lov-line-replace
4. ✅ **INCREMENTAR** a versão apropriadamente no header (MAJOR.MINOR.PATCH)
5. ✅ **ATUALIZAR** a data de "Última Atualização" no header
6. ✅ **REGISTRAR** a mudança no CHANGELOG.md (seção [Unreleased])
7. ✅ **INFORMAR** ao usuário quais arquivos de documentação foram atualizados

---

## 📋 Checklist: QUANDO Atualizar Cada Arquivo

### **ARCHITECTURE.md** - Atualizar quando:

- ✅ **Modelo de Dados**: Adicionar/remover/modificar tabelas Supabase → Atualizar seção "Modelo de Dados" + Diagrama ER
- ✅ **Serviços**: Criar/modificar serviços (ex: NutraceuticalsService) → Atualizar seção "Serviços e Padrões"
- ✅ **Estrutura de Pastas**: Reorganizar arquivos/diretórios → Atualizar seção "Arquitetura Técnica"
- ✅ **Dependências**: Adicionar/remover pacotes npm → Atualizar seção "Tech Stack"
- ✅ **Tabs Admin**: Adicionar/remover/reorganizar tabs → Atualizar seção "Estrutura de Navegação" + Diagrama
- ✅ **Configurações**: Modificar i18n/Supabase/vite.config → Atualizar seção "Configurações Importantes"
- ✅ **Design System**: Alterar tema/componentes/tokens CSS → Atualizar seção "Sistema de Design"
- ✅ **Edge Functions**: Criar/modificar Edge Functions → Atualizar seção correspondente

### **docs/STANFORD_DEMO.md** - Atualizar quando:

- ✅ **Funcionalidades Mockadas → Reais**: Implementar feature que era mockada → Atualizar "Estado Atual do Protótipo"
- ✅ **Features WOW**: Criar/modificar funcionalidades de destaque → Atualizar seção "Funcionalidades WOW"
- ✅ **Priorização**: Mudar prioridade de tabs/features → Atualizar "Estratégia de Otimização"
- ✅ **Dados de Demo**: Adicionar/modificar dados para demonstração → Atualizar "Dados de Demonstração"
- ✅ **Modelos Preditivos**: Modificar visualizações/simulações → Atualizar "Páginas Prioritárias"
- ✅ **Timeline**: Adicionar estudos longitudinais → Atualizar seção correspondente

### **docs/CURRENT_STATE.md** - Atualizar quando:

- ✅ **Mockado → Real**: Tornar funcionalidade mockada em real → Mover de "Funcionalidades Mockadas" para "Funcionalidades Implementadas"
- ✅ **Nova Integração**: Integrar API externa (OpenAI, Stripe, etc.) → Atualizar "APIs e Integrações"
- ✅ **Débito Técnico**: Resolver/adicionar débito técnico → Atualizar/adicionar em "Débito Técnico Conhecido"
- ✅ **Roadmap**: Completar fase do roadmap → Atualizar "Próximos Passos Recomendados"
- ✅ **Percentual Real/Mock**: Mudança significativa na proporção → Atualizar "Resumo Executivo"
- ✅ **Matriz de Maturidade**: Melhorar nível de maturidade de área → Atualizar "Matriz de Maturidade"
- ✅ **Lições Aprendidas**: Insights importantes do desenvolvimento → Adicionar em "Lições Aprendidas"

### **CHANGELOG.md** - Atualizar quando:

- ✅ **SEMPRE**: Toda mudança significativa deve ser registrada na seção `[Unreleased]`
- ✅ **Categorias**: Added (novo), Changed (modificado), Deprecated (descontinuado), Removed (removido), Fixed (corrigido), Security (segurança)
- ✅ **Release**: Quando fazer deploy de produção, mover `[Unreleased]` para `[Versão] - Data`

---

## 🔄 Processo de Atualização (Passo a Passo com Exemplo)

### **EXEMPLO PRÁTICO: Usuário pede "Adicione uma nova tab 'Análise de Microbioma' no admin"**

```
PASSO 1: Implementar a funcionalidade
→ Criar componente MicrobiomeAnalysis.tsx
→ Adicionar nova rota no admin-tabs.ts
→ Implementar interface visual

PASSO 2: Identificar impacto na documentação
→ Afeta: ARCHITECTURE.md (nova tab na navegação)
→ Afeta: CURRENT_STATE.md (nova feature mockada/real)
→ Afeta: CHANGELOG.md (registrar mudança)

PASSO 3: Ler contexto atual
→ usar lov-view em ARCHITECTURE.md para ver seção "Estrutura de Navegação"
→ usar lov-view em CURRENT_STATE.md para ver lista de features

PASSO 4: Atualizar ARCHITECTURE.md
→ Adicionar "Análise de Microbioma" na lista de tabs (seção "Estrutura de Navegação")
→ Atualizar contagem de tabs (27 → 28 tabs)
→ Incrementar versão no header: 1.0.0 → 1.1.0 (nova feature = MINOR)
→ Atualizar data: "Última Atualização: 2025-11-10"
→ Usar lov-line-replace para fazer a modificação

PASSO 5: Atualizar CURRENT_STATE.md
→ Adicionar em "Funcionalidades Implementadas" (se real) ou "Funcionalidades Mockadas" (se mockada)
→ Incrementar versão: 1.0.0 → 1.1.0
→ Atualizar data no header
→ Usar lov-line-replace para fazer a modificação

PASSO 6: Atualizar CHANGELOG.md
→ Adicionar na seção [Unreleased] -> Added:
   "- ✅ Nova tab administrativa 'Análise de Microbioma' com [descrição breve]"
→ Usar lov-line-replace para adicionar a entrada

PASSO 7: Confirmar ao usuário
→ "✅ Código implementado com sucesso!
   📚 Documentação atualizada:
      - ARCHITECTURE.md v1.1.0 (adicionada tab 'Análise de Microbioma')
      - CURRENT_STATE.md v1.1.0 (feature adicionada como mockada)
      - CHANGELOG.md (mudança registrada em [Unreleased])"
```

---

## 📊 Versionamento Semântico (MAJOR.MINOR.PATCH)

### **MAJOR (x.0.0)** - Mudanças estruturais significativas
- **Quando incrementar**: Reescrita completa de arquitetura, mudança de framework, breaking changes na API
- **Exemplos**: 
  - Migração React → Next.js
  - Reestruturação completa do banco de dados
  - Mudança de Supabase para Firebase

### **MINOR (0.x.0)** - Adição de novas funcionalidades
- **Quando incrementar**: Novas tabs, novos módulos, novos endpoints, novos componentes principais
- **Exemplos**: 
  - Adicionar nova tab administrativa
  - Criar novo módulo de visualização
  - Adicionar nova integração de API
  - Implementar nova funcionalidade mockada

### **PATCH (0.0.x)** - Correções e ajustes menores
- **Quando incrementar**: Bug fixes, ajustes de UI, correções de typos, otimizações
- **Exemplos**: 
  - Corrigir bug em validação de formulário
  - Ajustar espaçamento de componente
  - Corrigir tradução incorreta
  - Otimizar query do Supabase

---

## 🎯 Critérios: O Que É "Mudança Significativa"?

### **SEMPRE atualizar documentação quando:**
- ➕ Adicionar/remover features, tabs, componentes principais
- 🔄 Modificar arquitetura de dados (tabelas, relações) ou serviços
- 🔌 Integrar/desintegrar APIs externas (OpenAI, Stripe, etc.)
- 📊 Adicionar/remover visualizações principais (gráficos, dashboards)
- 🗂️ Reorganizar estrutura de pastas significativamente
- 🎨 Mudanças substanciais no design system (cores, tipografia, componentes base)
- 🌍 Adicionar novo idioma ao sistema i18n
- 🔐 Modificar autenticação ou autorização
- 📦 Adicionar/remover dependências importantes

### **NÃO precisa atualizar documentação quando:**
- 🐛 Corrigir bugs menores isolados
- 💅 Ajustar estilos CSS pontuais (margin, padding de elementos específicos)
- 📝 Corrigir typos em textos da interface
- 🔧 Refatorar código sem mudar funcionalidade (mesma entrada/saída)
- 🌍 Adicionar/corrigir traduções existentes (não novo idioma)
- 🎨 Ajustar cores/espaçamentos menores sem mudar identidade visual
- 📝 Adicionar comentários no código
- 🧪 Adicionar testes (exceto se for nova estratégia de testes)

---

## 📢 Comunicação com o Usuário Após Atualização

**SEMPRE que atualizar documentação, informar no formato:**

```
✅ [Resumo breve da implementação solicitada]

📚 Documentação atualizada:
   - ARCHITECTURE.md v1.1.0 (descrição da mudança)
   - CURRENT_STATE.md v1.1.0 (descrição da mudança)
   - CHANGELOG.md (mudança registrada em [Unreleased])
```

**Exemplo real:**
```
✅ Tab "Análise de Microbioma" criada com interface de análise e visualizações.

📚 Documentação atualizada:
   - ARCHITECTURE.md v1.1.0 (adicionada tab na seção Estrutura de Navegação)
   - CURRENT_STATE.md v1.1.0 (feature adicionada como funcionalidade mockada)
   - CHANGELOG.md (mudança registrada em [Unreleased] → Added)
```

---

## ⚠️ IMPORTANTE: Validação Antes de Atualizar

**Antes de atualizar qualquer arquivo de documentação, SEMPRE:**

1. ✅ **LER o arquivo atual** com lov-view para entender contexto e localização exata
2. ✅ **VERIFICAR a versão atual** no header do arquivo
3. ✅ **DETERMINAR o tipo de incremento** (MAJOR/MINOR/PATCH) apropriado
4. ✅ **USAR lov-line-replace** (nunca lov-write) para manter histórico git limpo
5. ✅ **ATUALIZAR apenas as seções afetadas**, não reescrever arquivo inteiro
6. ✅ **MANTER formatação e estrutura** existentes (Markdown, diagramas, tabelas)

---

## 🎓 Exemplos de Versionamento por Tipo de Mudança

### Exemplos de MAJOR (1.0.0 → 2.0.0)
- Migração completa de Supabase Connection → Lovable Cloud
- Reescrita do sistema de navegação (27 tabs → 12 tabs com nova estrutura)
- Mudança de React Router → TanStack Router

### Exemplos de MINOR (1.0.0 → 1.1.0)
- Adicionar nova tab "Análise de Microbioma"
- Implementar integração completa com OpenAI (antes era mockada)
- Adicionar novo módulo de visualizações 3D
- Criar sistema de notificações em tempo real

### Exemplos de PATCH (1.0.0 → 1.0.1)
- Corrigir contagem incorreta de tabs (27 → 28)
- Atualizar descrição de feature existente
- Corrigir links quebrados na documentação
- Adicionar detalhes faltantes em seção existente

---

## 🔍 Checklist Final: Antes de Concluir Qualquer Tarefa

**Antes de marcar uma tarefa como completa, verifique:**

- [ ] Código implementado e funcionando
- [ ] ARCHITECTURE.md atualizado (se aplicável)
- [ ] docs/STANFORD_DEMO.md atualizado (se aplicável)
- [ ] docs/CURRENT_STATE.md atualizado (se aplicável)
- [ ] CHANGELOG.md atualizado com entrada em [Unreleased]
- [ ] Versões incrementadas corretamente nos headers
- [ ] Datas atualizadas nos headers
- [ ] Usuário informado sobre atualizações da documentação

---

## 📌 Notas Finais

- **Prioridade**: Documentação atualizada = código bem documentado = projeto mantível
- **Consistência**: Use sempre o mesmo formato de versionamento e datas (ISO 8601: YYYY-MM-DD)
- **Clareza**: Escreva descrições de mudanças que façam sentido para quem não acompanhou o desenvolvimento
- **Honestidade**: Se algo é mockado, deixe claro. Se algo tem débito técnico, registre.
- **Proatividade**: Não espere o usuário pedir para atualizar documentação - faça automaticamente.

---

**FIM DAS INSTRUÇÕES PARA CUSTOM KNOWLEDGE**
