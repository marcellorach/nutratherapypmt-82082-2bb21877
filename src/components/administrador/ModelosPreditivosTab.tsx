
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Play, Brain, BarChart, CircleDashed, LineChart, AreaChart, Gauge } from "lucide-react";
import { PredictionModel } from "./dataAnalysis/types";

// Dados de exemplo para modelos preditivos
const mockModelos: PredictionModel[] = [
  {
    id: "model1",
    name: "Previsão de Eficácia de Nutracêuticos",
    description: "Modelo de regressão para prever eficácia de nutracêuticos para condições específicas",
    algorithm: "XGBoost",
    accuracy: 0.87,
    lastTrained: new Date(2024, 2, 15),
    parameters: {
      features: ["raça", "idade", "peso", "condição", "histórico"],
      hyperparameters: {
        learningRate: 0.01,
        maxDepth: 6,
        numRounds: 500
      }
    }
  },
  {
    id: "model2",
    name: "Análise de Custo-Benefício",
    description: "Predição de retorno sobre investimento para diferentes categorias de tratamento preventivo",
    algorithm: "Random Forest",
    accuracy: 0.82,
    lastTrained: new Date(2024, 1, 20),
    parameters: {
      features: ["custo_tratamento", "custo_prevenção", "taxa_sucesso", "complicações_evitadas"],
      hyperparameters: {
        numTrees: 200,
        maxFeatures: "sqrt",
        minSamplesLeaf: 4
      }
    }
  },
  {
    id: "model3",
    name: "Segmentação de Pacientes",
    description: "Modelo para segmentação de pacientes com base em características e necessidades nutricionais",
    algorithm: "KMeans Clustering",
    accuracy: 0.79,
    lastTrained: new Date(2024, 3, 5),
    parameters: {
      features: ["histórico_clínico", "raça", "idade", "porte", "atividade_física"],
      hyperparameters: {
        numClusters: 8,
        initMethod: "k-means++",
        maxIterations: 300
      }
    }
  },
  {
    id: "model4",
    name: "Previsão de Progressão de Doenças",
    description: "Modelo de série temporal para prever progressão ou regressão de condições crônicas com tratamento",
    algorithm: "LSTM Neural Network",
    accuracy: 0.91,
    lastTrained: new Date(2023, 11, 30),
    parameters: {
      features: ["biomarcadores", "sinais_vitais", "medicação", "atividade", "acompanhamento"],
      hyperparameters: {
        units: 128,
        dropout: 0.2,
        recurrentDropout: 0.3,
        epochs: 50
      }
    }
  }
];

const ModelosPreditivosTab: React.FC = () => {
  const [modelos] = useState<PredictionModel[]>(mockModelos);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredModelos = modelos.filter(modelo => 
    modelo.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    modelo.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    modelo.algorithm.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Função para renderizar o ícone do modelo com base no algoritmo
  const renderModelIcon = (algorithm: string) => {
    if (algorithm.includes('Boost') || algorithm.includes('Forest')) {
      return <BarChart className="h-5 w-5 text-green-600" />;
    } else if (algorithm.includes('Neural') || algorithm.includes('LSTM')) {
      return <Brain className="h-5 w-5 text-purple-600" />;
    } else if (algorithm.includes('Clustering') || algorithm.includes('Means')) {
      return <CircleDashed className="h-5 w-5 text-blue-600" />;
    } else if (algorithm.includes('Regression')) {
      return <LineChart className="h-5 w-5 text-amber-600" />;
    } else {
      return <AreaChart className="h-5 w-5 text-slate-600" />;
    }
  };

  // Função para formatar a precisão como porcentagem
  const formatAccuracy = (accuracy: number) => {
    return `${(accuracy * 100).toFixed(1)}%`;
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold">Modelos Preditivos</h2>
          <p className="text-gray-600">Gerenciar modelos para análise de dados e predição de resultados</p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Novo Modelo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Modelo Preditivo</DialogTitle>
              <DialogDescription>
                Configure um novo modelo para análise preditiva de dados
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="basic">
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
                <TabsTrigger value="features">Características</TabsTrigger>
                <TabsTrigger value="training">Treinamento</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4 pt-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="model-name">Nome do Modelo</Label>
                    <Input id="model-name" placeholder="Nome descritivo do modelo" />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="model-description">Descrição</Label>
                    <Textarea id="model-description" placeholder="Descreva a função e objetivo do modelo" />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="model-algorithm">Algoritmo</Label>
                    <select id="model-algorithm" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                      <option value="">Selecione um algoritmo</option>
                      <option value="xgboost">XGBoost</option>
                      <option value="random_forest">Random Forest</option>
                      <option value="lstm">LSTM Neural Network</option>
                      <option value="kmeans">KMeans Clustering</option>
                      <option value="linear_regression">Linear Regression</option>
                    </select>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="features" className="space-y-4 pt-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="model-input-features">Características de Entrada</Label>
                    <Textarea 
                      id="model-input-features" 
                      placeholder="Adicione características separadas por vírgula (raça, idade, peso, etc)"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="model-output">Variável de Saída</Label>
                    <Input 
                      id="model-output" 
                      placeholder="Ex: eficácia, custo_benefício, progressão_doença"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="model-normalize">Normalização</Label>
                      <select id="model-normalize" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                        <option value="minmax">Min-Max Scaling</option>
                        <option value="standard">Standard Scaler</option>
                        <option value="robust">Robust Scaler</option>
                        <option value="none">Sem normalização</option>
                      </select>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="model-encoding">Codificação</Label>
                      <select id="model-encoding" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                        <option value="one-hot">One-Hot Encoding</option>
                        <option value="label">Label Encoding</option>
                        <option value="frequency">Frequency Encoding</option>
                      </select>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="training" className="space-y-4 pt-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Fonte de Dados de Treinamento</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                        <option value="">Selecione a fonte de dados</option>
                        <option value="ds1">Prontuários da Clínica VetPrime</option>
                        <option value="ds2">Estudos científicos sobre nutracêuticos</option>
                        <option value="ds3">Análises de laboratório VetLab</option>
                        <option value="ds4">Dados de tratamentos e resultados</option>
                      </select>
                      
                      <Input placeholder="Filtro (opcional)" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="train-test-split">Divisão Treino/Teste</Label>
                      <Input id="train-test-split" type="number" defaultValue="80" min="50" max="90" />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="cross-validation">Cross-Validation</Label>
                      <Input id="cross-validation" type="number" defaultValue="5" min="3" max="10" />
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="hyperparameters">Hiperparâmetros</Label>
                    <Textarea 
                      id="hyperparameters" 
                      className="font-mono text-sm"
                      placeholder='{"learning_rate": 0.01, "max_depth": 6, "n_estimators": 100}'
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <DialogFooter className="mt-4">
              <Button variant="outline">Cancelar</Button>
              <Button>Criar e Treinar Modelo</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Modelos Disponíveis</CardTitle>
              <CardDescription>Modelos preditivos para análise de dados e recomendações</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Executar Predição
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input 
              placeholder="Buscar modelos..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Algoritmo</TableHead>
                <TableHead>Precisão</TableHead>
                <TableHead className="hidden md:table-cell">Treinamento</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredModelos.map((modelo) => (
                <TableRow key={modelo.id}>
                  <TableCell>{renderModelIcon(modelo.algorithm)}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{modelo.name}</p>
                      <p className="text-xs text-gray-500 truncate max-w-xs">{modelo.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>{modelo.algorithm}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={modelo.accuracy * 100} className="h-2 w-16" />
                      <span>{formatAccuracy(modelo.accuracy)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {modelo.lastTrained.toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm">Detalhes</Button>
                      <Button size="sm">
                        <Play className="h-3 w-3 mr-1" />
                        Executar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
};

export default ModelosPreditivosTab;
