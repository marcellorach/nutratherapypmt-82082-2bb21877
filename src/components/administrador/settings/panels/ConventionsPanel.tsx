
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [activeTab, setActiveTab] = useState('naming');
  const conventions = SECTION_CONVENTIONS[section];
  
  const [namingConventions, setNamingConventions] = useState(conventions.naming);
  const [formatConventions, setFormatConventions] = useState(conventions.format);
  const [rulesConventions, setRulesConventions] = useState(conventions.rules);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Convenções de {section === 'knowledge-base' ? 'Base de Conhecimento' : 
                               section === 'data-processing' ? 'Processamento de Dados' :
                               section === 'research' ? 'Pesquisa e Desenvolvimento' :
                               'Análise Preditiva'}
        </CardTitle>
        <CardDescription>
          Defina convenções específicas para padronizar o trabalho nesta seção
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="naming">Nomenclatura</TabsTrigger>
            <TabsTrigger value="format">Formatação</TabsTrigger>
            <TabsTrigger value="rules">Regras</TabsTrigger>
          </TabsList>
          <TabsContent value="naming">
            <ScrollArea className="h-[400px] w-full rounded-md border mt-4 p-4">
              <Textarea 
                className="min-h-[380px] border-0 resize-none" 
                value={namingConventions}
                onChange={(e) => setNamingConventions(e.target.value)}
              />
            </ScrollArea>
          </TabsContent>
          <TabsContent value="format">
            <ScrollArea className="h-[400px] w-full rounded-md border mt-4 p-4">
              <Textarea 
                className="min-h-[380px] border-0 resize-none" 
                value={formatConventions}
                onChange={(e) => setFormatConventions(e.target.value)}
              />
            </ScrollArea>
          </TabsContent>
          <TabsContent value="rules">
            <ScrollArea className="h-[400px] w-full rounded-md border mt-4 p-4">
              <Textarea 
                className="min-h-[380px] border-0 resize-none" 
                value={rulesConventions}
                onChange={(e) => setRulesConventions(e.target.value)}
              />
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Restaurar Padrão</Button>
        <Button>Salvar Convenções</Button>
      </CardFooter>
    </Card>
  );
};

export default ConventionsPanel;
