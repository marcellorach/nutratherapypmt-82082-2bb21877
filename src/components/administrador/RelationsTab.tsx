
import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Network, ArrowUpDown, Filter, Settings, Search, PlusCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import SankeyDiagram from './visualizations/SankeyDiagram';
import NetworkGraph from './visualizations/NetworkGraph';
import EfficacyMatrix from './visualizations/EfficacyMatrix';
import { Badge } from "@/components/ui/badge";

// Dados de exemplo para o diagrama Sankey
const exampleSankeyData = {
  nodes: [
    // Nutracêuticos
    { name: 'Glucosamina', category: 'nutraceutico', description: 'Aminossacarídeo natural que ajuda na formação e reparo de cartilagem' },
    { name: 'Condroitina', category: 'nutraceutico', description: 'Glicosaminoglicano encontrado na cartilagem que ajuda na elasticidade' },
    { name: 'Ômega 3', category: 'nutraceutico', description: 'Ácidos graxos essenciais com propriedades anti-inflamatórias' },
    { name: 'Curcumina', category: 'nutraceutico', description: 'Composto polifenólico da cúrcuma com potentes propriedades anti-inflamatórias' },
    { name: 'MSM', category: 'nutraceutico', description: 'Composto orgânico de enxofre com propriedades anti-inflamatórias' },
    { name: 'Coenzima Q10', category: 'nutraceutico', description: 'Composto similar a vitaminas produzido pelo corpo com funções antioxidantes' },
    { name: 'Resveratrol', category: 'nutraceutico', description: 'Polifenol com propriedades antioxidantes encontrado em uvas e vinho tinto' },
    { name: 'Ácido Hialurônico', category: 'nutraceutico', description: 'Glicosaminoglicano com função importante na hidratação tecidual e lubrificação articular' },
    
    // Condições
    { name: 'Artrite', category: 'condicao', description: 'Inflamação das articulações que causa dor e rigidez' },
    { name: 'Inflamação', category: 'condicao', description: 'Resposta do sistema imunológico a lesões ou infecções' },
    { name: 'Saúde Cardíaca', category: 'condicao', description: 'Manutenção da função cardiovascular saudável' },
    { name: 'Função Cognitiva', category: 'condicao', description: 'Processos mentais incluindo memória, aprendizado e foco' },
    { name: 'Saúde da Pele', category: 'condicao', description: 'Manutenção da saúde e aparência da pele' },
    { name: 'Mobilidade Articular', category: 'condicao', description: 'Capacidade de movimento das articulações com amplitude completa' },
    { name: 'Densidade Óssea', category: 'condicao', description: 'Medida da quantidade de minerais nos ossos' },
    { name: 'Sistema Imune', category: 'condicao', description: 'Rede de células, tecidos e órgãos que defendem o corpo contra infecções' },
  ],
  links: [
    // Glucosamina
    { source: 0, target: 8, value: 85, labelText: 'Alta eficácia', studyCount: 12, evidenceLevel: 4.2, description: 'Glucosamina demonstra alta eficácia no alívio dos sintomas da artrite, particularmente na redução da dor e melhoria da função articular em cães.' },
    { source: 0, target: 9, value: 40, labelText: 'Eficácia moderada', studyCount: 5, evidenceLevel: 2.8 },
    { source: 0, target: 13, value: 75, labelText: 'Eficácia alta', studyCount: 8, evidenceLevel: 3.9 },
    
    // Condroitina
    { source: 1, target: 8, value: 70, labelText: 'Eficácia alta', studyCount: 9, evidenceLevel: 3.7 },
    { source: 1, target: 13, value: 80, labelText: 'Eficácia muito alta', studyCount: 7, evidenceLevel: 4.0 },
    
    // Ômega 3
    { source: 2, target: 9, value: 75, labelText: 'Eficácia alta', studyCount: 15, evidenceLevel: 4.1 },
    { source: 2, target: 10, value: 60, labelText: 'Eficácia moderada', studyCount: 11, evidenceLevel: 3.8 },
    { source: 2, target: 12, value: 50, labelText: 'Eficácia moderada', studyCount: 6, evidenceLevel: 3.2 },
    { source: 2, target: 15, value: 65, labelText: 'Eficácia moderada-alta', studyCount: 8, evidenceLevel: 3.5 },
    
    // Curcumina
    { source: 3, target: 9, value: 90, labelText: 'Eficácia muito alta', studyCount: 18, evidenceLevel: 4.5, description: 'A curcumina mostra resultados excepcionais no controle de processos inflamatórios em múltiplos sistemas do organismo, com alta biodisponibilidade em formulações específicas para pets.' },
    { source: 3, target: 8, value: 45, labelText: 'Eficácia moderada', studyCount: 7, evidenceLevel: 3.0 },
    { source: 3, target: 15, value: 70, labelText: 'Eficácia alta', studyCount: 9, evidenceLevel: 3.8 },
    
    // MSM
    { source: 4, target: 8, value: 65, labelText: 'Eficácia moderada-alta', studyCount: 8, evidenceLevel: 3.4 },
    { source: 4, target: 9, value: 55, labelText: 'Eficácia moderada', studyCount: 6, evidenceLevel: 3.1 },
    { source: 4, target: 13, value: 60, labelText: 'Eficácia moderada', studyCount: 5, evidenceLevel: 3.3 },
    
    // Coenzima Q10
    { source: 5, target: 10, value: 80, labelText: 'Eficácia alta', studyCount: 14, evidenceLevel: 4.2, description: 'Coenzima Q10 é essencial para a produção de energia celular e função cardíaca, demonstrando resultados significativos na melhoria da função miocárdica em cães idosos e com problemas cardíacos.' },
    { source: 5, target: 11, value: 45, labelText: 'Eficácia moderada', studyCount: 5, evidenceLevel: 2.9 },
    
    // Resveratrol
    { source: 6, target: 10, value: 55, labelText: 'Eficácia moderada', studyCount: 7, evidenceLevel: 3.2 },
    { source: 6, target: 11, value: 60, labelText: 'Eficácia moderada', studyCount: 6, evidenceLevel: 3.5 },
    { source: 6, target: 15, value: 50, labelText: 'Eficácia moderada', studyCount: 5, evidenceLevel: 3.0 },
    
    // Ácido Hialurônico
    { source: 7, target: 8, value: 75, labelText: 'Eficácia alta', studyCount: 9, evidenceLevel: 3.9 },
    { source: 7, target: 12, value: 70, labelText: 'Eficácia alta', studyCount: 8, evidenceLevel: 3.7 },
    { source: 7, target: 13, value: 85, labelText: 'Eficácia muito alta', studyCount: 11, evidenceLevel: 4.3, description: 'O ácido hialurônico tem papel fundamental na manutenção da viscosidade do líquido sinovial, proporcionando lubrificação ideal e absorção de choque nas articulações de pets com problemas de mobilidade.' },
  ]
};

// Preparar dados para o NetworkGraph
const prepareNetworkData = () => {
  const nodes = exampleSankeyData.nodes.map((node, index) => ({
    id: index,
    label: node.name,
    title: node.description,
    group: node.category,
    value: node.category === 'nutraceutico' ? 15 : 10,
    shape: node.category === 'nutraceutico' ? 'dot' : 'diamond',
    color: {
      background: node.category === 'nutraceutico' ? '#3b82f6' : 
                 node.category === 'condicao' ? '#10b981' : '#f59e0b',
      border: node.category === 'nutraceutico' ? '#2563eb' : 
              node.category === 'condicao' ? '#059669' : '#d97706',
      highlight: {
        background: node.category === 'nutraceutico' ? '#60a5fa' : 
                   node.category === 'condicao' ? '#34d399' : '#fbbf24',
        border: node.category === 'nutraceutico' ? '#3b82f6' : 
                node.category === 'condicao' ? '#10b981' : '#f59e0b'
      }
    }
  }));

  const edges = exampleSankeyData.links.map(link => ({
    from: link.source,
    to: link.target,
    title: `Eficácia: ${link.value}/100 - ${link.labelText}`,
    value: link.value / 20, // Adaptar a escala
    width: (link.value / 100) * 5,
    label: link.value.toString(),
    color: link.value >= 80 ? '#10b981' : 
           link.value >= 60 ? '#3b82f6' : 
           link.value >= 40 ? '#f59e0b' : '#9ca3af'
  }));

  return { 
    nodes: nodes, 
    links: edges // Adicionar a propriedade links que estava faltando
  };
};

// Preparar dados para a matriz de eficácia
const prepareMatrixData = () => {
  const nutraceuticos = exampleSankeyData.nodes
    .filter(node => node.category === 'nutraceutico')
    .map((node, index) => ({
      id: index,
      name: node.name,
      description: node.description,
      category: 'nutraceutico' as const
    }));

  const condicoes = exampleSankeyData.nodes
    .filter(node => node.category === 'condicao')
    .map((node, index) => ({
      id: index + nutraceuticos.length,
      name: node.name,
      description: node.description,
      category: 'condicao' as const
    }));

  const cells = exampleSankeyData.links.map(link => ({
    nutraceuticoId: link.source,
    condicaoId: link.target,
    efficacyScore: link.value,
    evidenceLevel: link.evidenceLevel?.toFixed(1) || '-',
    studyCount: link.studyCount || 0,
    description: link.description
  }));

  return {
    nutraceuticos,
    condicoes,
    cells
  };
};

// Componente para visualizar relações entre nutraceuticos e condições de saúde
const RelationsTab: React.FC = () => {
  const [relationView, setRelationView] = useState<string>('sankey');
  const [efficacyFilter, setEfficacyFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState('');
  
  // Preparar dados para visualizações
  const networkData = useMemo(() => prepareNetworkData(), []);
  const matrixData = useMemo(() => prepareMatrixData(), []);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Relações Nutraceutico-Condição</h2>
          <p className="text-gray-600">
            Visualize as relações entre nutracêuticos e suas condições de saúde associadas
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar relações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 max-w-[200px]"
            />
          </div>
          <Button variant="outline" className="flex items-center">
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>
          <Button variant="outline" className="flex items-center">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Relação
          </Button>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-2">
        <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
          Glucosamina
        </Badge>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
          Ômega 3
        </Badge>
        <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100">
          Artrite
        </Badge>
        <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100">
          Inflamação
        </Badge>
        <Badge variant="outline" className="bg-orange-50 text-orange-700 hover:bg-orange-100">
          Alta Eficácia
        </Badge>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Network className="mr-2 h-5 w-5 text-primary" />
              Mapa de Relações
            </CardTitle>
            <div className="flex items-center gap-4">
              <Select value={efficacyFilter} onValueChange={setEfficacyFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por Eficácia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Eficácia</SelectLabel>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="high">Alta (4-5)</SelectItem>
                    <SelectItem value="medium">Média (3-4)</SelectItem>
                    <SelectItem value="low">Baixa (1-3)</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="icon">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription>
            Visualize como os nutracêuticos se relacionam com diferentes condições de saúde
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-4">
          <Tabs defaultValue="sankey" value={relationView} onValueChange={setRelationView}>
            <TabsList className="mb-4">
              <TabsTrigger value="sankey">Diagrama Sankey</TabsTrigger>
              <TabsTrigger value="network">Rede de Relações</TabsTrigger>
              <TabsTrigger value="matrix">Matriz de Eficácia</TabsTrigger>
            </TabsList>
            
            <TabsContent value="sankey" className="pt-4">
              <SankeyDiagram data={exampleSankeyData} height={500} />
            </TabsContent>
            
            <TabsContent value="network" className="pt-4">
              <NetworkGraph data={networkData} height="500px" />
            </TabsContent>
            
            <TabsContent value="matrix" className="pt-4">
              <EfficacyMatrix 
                nutraceuticos={matrixData.nutraceuticos}
                condicoes={matrixData.condicoes}
                data={matrixData.cells}
              />
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 border-t pt-4">
            <h4 className="text-sm font-medium mb-2">Legenda</h4>
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 mr-1 rounded-sm"></div>
                <span>Nutracêuticos</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 mr-1 rounded-sm"></div>
                <span>Condições de Saúde</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-amber-500 mr-1 rounded-sm"></div>
                <span>Efeitos</span>
              </div>
              <div className="flex items-center ml-4">
                <span className="font-medium">Largura da conexão:</span>
                <span className="ml-1">Grau de eficácia/evidência</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RelationsTab;
