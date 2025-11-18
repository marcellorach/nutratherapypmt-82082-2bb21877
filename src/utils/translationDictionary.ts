/**
 * Dicionário de termos técnicos comuns do projeto para traduções automáticas
 */
export const termDictionary: Record<string, { en: string; pt: string }> = {
  // Admin
  admin: { en: "Admin", pt: "Administrador" },
  settings: { en: "Settings", pt: "Configurações" },
  configuration: { en: "Configuration", pt: "Configuração" },
  
  // Tabs/Navigation
  tabs: { en: "Tabs", pt: "Abas" },
  dashboard: { en: "Dashboard", pt: "Painel" },
  overview: { en: "Overview", pt: "Visão Geral" },
  
  // Nutraceuticals
  nutraceuticals: { en: "Nutraceuticals", pt: "Nutracêuticos" },
  nutraceutical: { en: "Nutraceutical", pt: "Nutracêutico" },
  categories: { en: "Categories", pt: "Categorias" },
  category: { en: "Category", pt: "Categoria" },
  benefits: { en: "Benefits", pt: "Benefícios" },
  contraindications: { en: "Contraindications", pt: "Contraindicações" },
  dosage: { en: "Dosage", pt: "Dosagem" },
  source: { en: "Source", pt: "Fonte" },
  
  // Health Conditions
  conditions: { en: "Conditions", pt: "Condições" },
  condition: { en: "Condition", pt: "Condição" },
  health: { en: "Health", pt: "Saúde" },
  severity: { en: "Severity", pt: "Severidade" },
  treatability: { en: "Treatability", pt: "Tratabilidade" },
  
  // Scientific
  studies: { en: "Studies", pt: "Estudos" },
  study: { en: "Study", pt: "Estudo" },
  scientific: { en: "Scientific", pt: "Científico" },
  research: { en: "Research", pt: "Pesquisa" },
  evidence: { en: "Evidence", pt: "Evidência" },
  metadata: { en: "Metadata", pt: "Metadados" },
  
  // Analysis/Visualization
  analysis: { en: "Analysis", pt: "Análise" },
  visualization: { en: "Visualization", pt: "Visualização" },
  stats: { en: "Stats", pt: "Estatísticas" },
  statistics: { en: "Statistics", pt: "Estatísticas" },
  chart: { en: "Chart", pt: "Gráfico" },
  graph: { en: "Graph", pt: "Gráfico" },
  
  // Data Management
  data: { en: "Data", pt: "Dados" },
  management: { en: "Management", pt: "Gerenciamento" },
  import: { en: "Import", pt: "Importar" },
  export: { en: "Export", pt: "Exportar" },
  upload: { en: "Upload", pt: "Enviar" },
  download: { en: "Download", pt: "Baixar" },
  
  // Actions
  actions: { en: "Actions", pt: "Ações" },
  save: { en: "Save", pt: "Salvar" },
  cancel: { en: "Cancel", pt: "Cancelar" },
  delete: { en: "Delete", pt: "Excluir" },
  edit: { en: "Edit", pt: "Editar" },
  create: { en: "Create", pt: "Criar" },
  add: { en: "Add", pt: "Adicionar" },
  remove: { en: "Remove", pt: "Remover" },
  update: { en: "Update", pt: "Atualizar" },
  search: { en: "Search", pt: "Buscar" },
  filter: { en: "Filter", pt: "Filtrar" },
  sort: { en: "Sort", pt: "Ordenar" },
  
  // Status
  status: { en: "Status", pt: "Status" },
  active: { en: "Active", pt: "Ativo" },
  inactive: { en: "Inactive", pt: "Inativo" },
  pending: { en: "Pending", pt: "Pendente" },
  completed: { en: "Completed", pt: "Concluído" },
  
  // Common
  name: { en: "Name", pt: "Nome" },
  description: { en: "Description", pt: "Descrição" },
  title: { en: "Title", pt: "Título" },
  type: { en: "Type", pt: "Tipo" },
  date: { en: "Date", pt: "Data" },
  time: { en: "Time", pt: "Hora" },
  total: { en: "Total", pt: "Total" },
  count: { en: "Count", pt: "Contagem" },
  loading: { en: "Loading", pt: "Carregando" },
  error: { en: "Error", pt: "Erro" },
  success: { en: "Success", pt: "Sucesso" },
  warning: { en: "Warning", pt: "Aviso" },
  info: { en: "Info", pt: "Informação" },
  
  // Relations
  relations: { en: "Relations", pt: "Relações" },
  relationship: { en: "Relationship", pt: "Relacionamento" },
  outcomes: { en: "Outcomes", pt: "Resultados" },
  outcome: { en: "Outcome", pt: "Resultado" },
  
  // AI/Prompts
  ai: { en: "AI", pt: "IA" },
  prompts: { en: "Prompts", pt: "Prompts" },
  prompt: { en: "Prompt", pt: "Prompt" },
  model: { en: "Model", pt: "Modelo" },
  models: { en: "Models", pt: "Modelos" },
  
  // Audit
  audit: { en: "Audit", pt: "Auditoria" },
  translation: { en: "Translation", pt: "Tradução" },
  translations: { en: "Translations", pt: "Traduções" },
  
  // UI
  table: { en: "Table", pt: "Tabela" },
  list: { en: "List", pt: "Lista" },
  card: { en: "Card", pt: "Cartão" },
  form: { en: "Form", pt: "Formulário" },
  button: { en: "Button", pt: "Botão" },
  input: { en: "Input", pt: "Entrada" },
  select: { en: "Select", pt: "Selecionar" },
  checkbox: { en: "Checkbox", pt: "Caixa de seleção" },
  radio: { en: "Radio", pt: "Opção" },
};

/**
 * Converte camelCase ou snake_case para formato legível
 */
export function formatKeySegment(segment: string): string {
  return segment
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
