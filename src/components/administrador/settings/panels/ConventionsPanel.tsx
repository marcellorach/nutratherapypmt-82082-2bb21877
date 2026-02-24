
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from 'react-i18next';

interface ConventionsPanelProps {
  section: 'knowledge-base' | 'data-processing' | 'research' | 'predictive-analysis';
}

const SECTION_CONVENTIONS: Record<string, Record<string, string>> = {
  'knowledge-base': {
    naming: `# Convenções de Nomenclatura para Base de Conhecimento

* Nutracêuticos: Sempre usar nome científico seguido por nome comum entre parênteses
* Condições de saúde: Usar terminologia médica veterinária oficial
* Dosagens: Especificar em mg/kg, seguido pela frequência
* Estudos: Formato "Autor et al. (Ano) - Título"`,
    
    format: `# Formato de Armazenamento de Dados

* Evidências científicas: Classificadas por nível (1-5)
* Referências cruzadas: Sempre incluir IDs únicos para rastreabilidade
* Metadados: Incluir data de inclusão e última atualização
* Tags: Usar sistema de tags padronizado para facilitar pesquisas`,
    
    rules: `# Regras de Validação

* Nutracêuticos devem ter pelo menos 3 estudos de suporte
* Níveis de evidência devem ser justificados com critérios claros
* Interações medicamentosas devem ser documentadas com nível de gravidade
* Efeitos colaterais precisam ter frequência documentada quando disponível`
  },
  'data-processing': {
    naming: `# Convenções de Nomenclatura para Processamento de Dados

* Conjuntos de dados: formato "tipo_dados-espécie-ANO"
* Scripts de processamento: "processo_subprocesso_versão"
* Resultados de análise: "resultado_método_data"
* Logs: "log_processo_timestamp"`,
    
    format: `# Formato de Processamento

* Dados brutos devem ser preservados em formato original
* Pré-processamento documentado em arquivo separado
* Resultados intermediários em formato JSON ou CSV
* Resultados finais em formato padronizado para visualização`,
    
    rules: `# Regras de Validação

* Validação cruzada obrigatória para todos modelos preditivos
* Métricas de qualidade documentadas para cada processamento
* Registro de outliers e anomalias
* Documentação de parâmetros utilizados em cada processamento`
  },
  'research': {
    naming: `# Convenções de Nomenclatura para Pesquisa

* Projetos: "P-área-espécie-YYYY-código"
* Experimentos: "EXP-projeto-sequencial"
* Amostras: "AM-experimento-sequencial"
* Hipóteses: "HIP-projeto-versão"`,
    
    format: `# Formato de Documentação

* Propostas: Seguir template com introdução, hipótese, metodologia, cronograma
* Resultados: Estruturados por objetivos específicos
* Análises estatísticas: Documentar método, parâmetros e significância
* Conclusões: Vincular diretamente às hipóteses iniciais`,
    
    rules: `# Regras de Validação

* Aprovação ética necessária antes de iniciar pesquisa
* Revisão por pares interna antes de submissão
* Análise de potencial comercial e patentes
* Documentação completa de métodos para reprodutibilidade`
  },
  'predictive-analysis': {
    naming: `# Convenções de Nomenclatura para Análise Preditiva

* Modelos: "modelo-alvo-algoritmo-versão"
* Features: "feature_categoria_especificação"
* Predições: "pred_modelo_timestamp"
* Avaliações: "aval_modelo_métrica_versão"`,
    
    format: `# Formato de Modelos

* Armazenamento padronizado de modelos treinados
* Metadados incluindo parâmetros e performance
* Logs de predições com timestamps
* Visualizações padronizadas para comparação de modelos`,
    
    rules: `# Regras de Validação

* Separação clara de dados de treino, validação e teste
* Documentação de todos hiperparâmetros utilizados
* Avaliação com múltiplas métricas relevantes ao caso
* Testes periódicos de performance em novos dados`
  }
};

const ConventionsPanel: React.FC<ConventionsPanelProps> = ({ section }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('naming');
  const conventions = SECTION_CONVENTIONS[section];
  
  const [namingConventions, setNamingConventions] = useState(conventions.naming);
  const [formatConventions, setFormatConventions] = useState(conventions.format);
  const [rulesConventions, setRulesConventions] = useState(conventions.rules);
  
  const renderExamples = () => {
    if (activeTab === 'naming') {
      return (
        <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold mb-2">Exemplos Visuais:</h4>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Curcuma longa (Cúrcuma)
              </Badge>
              <span className="text-sm text-gray-600">← Nomenclatura de Nutracêutico</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Smith et al. (2024) - Effects of Curcumin...
              </Badge>
              <span className="text-sm text-gray-600">← Formato de Citação</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                500mg/kg BID
              </Badge>
              <span className="text-sm text-gray-600">← Formato de Dosagem</span>
            </div>
          </div>
          
          <div className="mt-6 border-t pt-4">
            <h5 className="font-medium mb-2">Convenção em Prática:</h5>
            <div className="p-3 bg-white rounded border">
              <div className="flex items-center justify-between mb-2">
                <Badge className="bg-green-100 text-green-800">Nutracêutico</Badge>
                <span className="text-sm text-gray-500">✓ Validado</span>
              </div>
              <p className="text-sm"><strong>Correto:</strong> Zingiber officinale (Gengibre)</p>
              <p className="text-sm text-red-600 mt-1"><strong>Incorreto:</strong> Gengibre</p>
            </div>
          </div>
        </div>
      );
    }
    
    if (activeTab === 'format') {
      return (
        <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold mb-2">Formatos Padrão:</h4>
          <div className="space-y-3">
            <div className="p-3 bg-white rounded border border-gray-200">
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                  Nível 5
                </Badge>
                <span className="text-sm">Evidência forte com múltiplos estudos</span>
              </div>
              <div className="flex mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-white rounded border border-gray-200">
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-indigo-100 text-indigo-800 border-indigo-300">
                  ID: NUT-2024-001
                </Badge>
                <span className="text-sm">Formato de Identificador</span>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="text-xs bg-indigo-50 p-1 text-center rounded">NUT</div>
                <div className="text-xs bg-indigo-50 p-1 text-center rounded">2024</div>
                <div className="text-xs bg-indigo-50 p-1 text-center rounded">001</div>
              </div>
            </div>
            
            <div className="p-3 bg-white rounded border">
              <h5 className="text-sm font-medium mb-2">Exemplo de metadados:</h5>
              <code className="text-xs bg-gray-100 p-2 block rounded">
                {`{
  "id": "NUT-2024-001",
  "name": "Curcuma longa (Cúrcuma)",
  "added_at": "2024-05-22T10:30:00Z",
  "updated_at": "2024-05-25T14:22:10Z",
  "evidence_level": 4,
  "tags": ["anti-inflamatório", "antioxidante", "cães"]
}`}
              </code>
            </div>
          </div>
        </div>
      );
    }
    
    if (activeTab === 'rules') {
      return (
        <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold mb-2">Validações:</h4>
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-white rounded border border-green-200">
              <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <span className="text-sm font-medium">3+ estudos validados</span>
                <div className="flex mt-1">
                  <Badge variant="outline" className="mr-1 bg-blue-50 text-blue-700 text-xs">Estudo 1</Badge>
                  <Badge variant="outline" className="mr-1 bg-blue-50 text-blue-700 text-xs">Estudo 2</Badge>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">Estudo 3</Badge>
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-2 p-3 bg-white rounded border border-red-200">
              <div className="h-4 w-4 rounded-full bg-red-500 flex items-center justify-center mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <span className="text-sm font-medium">Interações não documentadas</span>
                <p className="text-xs text-red-600 mt-1">
                  É necessário documentar possíveis interações medicamentosas antes da aprovação
                </p>
              </div>
            </div>
            
            <div className="p-3 bg-white rounded border">
              <h5 className="text-sm font-medium mb-2">Checklist de validação:</h5>
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="h-4 w-4 border border-gray-300 rounded-sm mr-2 flex items-center justify-center bg-green-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm">Pelo menos 3 estudos de suporte</span>
                </div>
                <div className="flex items-center">
                  <div className="h-4 w-4 border border-gray-300 rounded-sm mr-2 flex items-center justify-center bg-green-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm">Justificativa para nível de evidência</span>
                </div>
                <div className="flex items-center">
                  <div className="h-4 w-4 border border-gray-300 rounded-sm mr-2"></div>
                  <span className="text-sm">Documentação de interações medicamentosas</span>
                </div>
                <div className="flex items-center">
                  <div className="h-4 w-4 border border-gray-300 rounded-sm mr-2"></div>
                  <span className="text-sm">Frequência de efeitos colaterais</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('conventionsPanel.title', { section: t(`conventionsPanel.sectionNames.${section === 'knowledge-base' ? 'knowledgeBase' : section === 'data-processing' ? 'dataProcessing' : section === 'research' ? 'research' : 'predictiveAnalysis'}`) })}
        </CardTitle>
        <CardDescription>
          {t('conventionsPanel.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="naming">{t('conventionsPanel.naming')}</TabsTrigger>
            <TabsTrigger value="format">{t('conventionsPanel.format')}</TabsTrigger>
            <TabsTrigger value="rules">{t('conventionsPanel.rules')}</TabsTrigger>
          </TabsList>
          <TabsContent value="naming">
            <ScrollArea className="h-[400px] w-full rounded-md border mt-4 p-4">
              <Textarea 
                className="min-h-[200px] border-0 resize-none" 
                value={namingConventions}
                onChange={(e) => setNamingConventions(e.target.value)}
              />
              {renderExamples()}
            </ScrollArea>
          </TabsContent>
          <TabsContent value="format">
            <ScrollArea className="h-[400px] w-full rounded-md border mt-4 p-4">
              <Textarea 
                className="min-h-[200px] border-0 resize-none" 
                value={formatConventions}
                onChange={(e) => setFormatConventions(e.target.value)}
              />
              {renderExamples()}
            </ScrollArea>
          </TabsContent>
          <TabsContent value="rules">
            <ScrollArea className="h-[400px] w-full rounded-md border mt-4 p-4">
              <Textarea 
                className="min-h-[200px] border-0 resize-none" 
                value={rulesConventions}
                onChange={(e) => setRulesConventions(e.target.value)}
              />
              {renderExamples()}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">{t('conventionsPanel.restoreDefault')}</Button>
        <Button>{t('conventionsPanel.saveConventions')}</Button>
      </CardFooter>
    </Card>
  );
};

export default ConventionsPanel;
