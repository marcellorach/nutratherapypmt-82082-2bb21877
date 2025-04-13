
import React, { useState } from 'react';
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
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash, Info, Code, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { NutraceuticalRule } from './dataAnalysis/types';

// Dados de exemplo para regras
const mockRegrasClinicas: NutraceuticalRule[] = [
  {
    id: "rule1",
    name: "Interação Omegas + Antioxidantes",
    description: "Potencialização de efeitos anti-inflamatórios quando ácidos graxos ômega-3 são administrados junto com antioxidantes",
    condition: "Inflamação crônica articular",
    appliesTo: ["Osteoartrite canina", "Displasia de quadril"],
    priority: 5,
    formula: "IF (omega3_level > 0 AND antioxidant_level > 0) THEN efficacy_multiplier = 1.35",
    active: true
  },
  {
    id: "rule2",
    name: "Prevenção de Nefropatia",
    description: "Prevenção de danos renais em tratamentos prolongados com nutracêuticos que têm metabolização renal",
    condition: "Tratamentos prolongados",
    appliesTo: ["Idosos", "Animais com histórico de doença renal"],
    priority: 8,
    formula: "IF (renal_risk_score > 3 AND treatment_duration > 90) THEN add_monitoring = TRUE AND dosage_factor = 0.8",
    active: true
  },
  {
    id: "rule3",
    name: "Ajuste de dosagem por peso",
    description: "Ajuste automático de dosagem baseado em curvas de peso não-lineares para raças pequenas",
    condition: "Cães de pequeno porte",
    appliesTo: ["Raças < 5kg", "Filhotes < 6 meses"],
    priority: 4,
    formula: "IF (weight < 5 AND age < 0.5) THEN dosage = base_dosage * (0.7 + (weight / 10))",
    active: false
  },
  {
    id: "rule4",
    name: "Contra-indicação gástrica",
    description: "Verificação de histórico de problemas gástricos para ajuste de formulação",
    condition: "Sensibilidade gastrointestinal",
    appliesTo: ["Histórico de gastrite", "Histórico de úlceras"],
    priority: 9,
    formula: "IF (gastric_history = TRUE) THEN add_coating = TRUE AND split_dosage = TRUE",
    active: true
  }
];

const RegrasClinicasTab: React.FC = () => {
  const [regras] = useState<NutraceuticalRule[]>(mockRegrasClinicas);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('todas');

  const filteredRegras = regras.filter(regra => {
    const matchesSearch = regra.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          regra.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          regra.condition.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'todas') return matchesSearch;
    if (activeTab === 'ativas') return matchesSearch && regra.active;
    if (activeTab === 'inativas') return matchesSearch && !regra.active;
    
    return matchesSearch;
  });

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold">Regras Clínicas</h2>
          <p className="text-gray-600">Gerenciar regras para análise de correlações e recomendações</p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nova Regra Clínica
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Criar Nova Regra Clínica</DialogTitle>
              <DialogDescription>
                Adicione uma nova regra para o sistema de análise e recomendação
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="informacoes">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="informacoes">Informações Básicas</TabsTrigger>
                <TabsTrigger value="formula">Fórmula</TabsTrigger>
                <TabsTrigger value="aplicacao">Aplicação</TabsTrigger>
              </TabsList>
              
              <TabsContent value="informacoes" className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nome da Regra</Label>
                    <Input id="name" placeholder="Nome descritivo da regra" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea id="description" placeholder="Descreva detalhadamente o propósito e funcionamento da regra" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="condition">Condição clínica</Label>
                    <Input id="condition" placeholder="Condição clínica principal" />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="formula" className="space-y-4">
                <div className="grid gap-4">
                  <div className="flex items-center gap-2">
                    <Code className="h-5 w-5 text-blue-600" />
                    <Label>Fórmula de Execução</Label>
                  </div>
                  <Textarea 
                    className="font-mono h-40"
                    placeholder="IF (condition) THEN action"
                  />
                  <p className="text-sm text-gray-500">
                    Use pseudocódigo para definir a lógica da regra. Variáveis disponíveis: peso, idade, raça, condições, medicamentos, etc.
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="aplicacao" className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="applies-to">Aplica-se a (separados por vírgula)</Label>
                    <Input id="applies-to" placeholder="Ex: Cães idosos, Gatos com insuficiência renal" />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="priority">Prioridade (1-10)</Label>
                    <Input id="priority" type="number" min="1" max="10" placeholder="5" />
                    <p className="text-xs text-gray-500">Prioridades mais altas são avaliadas primeiro em caso de conflitos</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch id="active" defaultChecked />
                      <Label htmlFor="active">Regra ativa</Label>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <DialogFooter>
              <Button variant="outline">Cancelar</Button>
              <Button>Salvar Regra</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Base de Regras Clínicas</CardTitle>
              <CardDescription>Total: {regras.length} regras cadastradas</CardDescription>
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[400px]">
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="todas">Todas</TabsTrigger>
                <TabsTrigger value="ativas">Ativas</TabsTrigger>
                <TabsTrigger value="inativas">Inativas</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="mb-4">
            <Input 
              placeholder="Buscar regras..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30px]">Status</TableHead>
                <TableHead>Nome da Regra</TableHead>
                <TableHead className="hidden md:table-cell">Condição</TableHead>
                <TableHead className="hidden md:table-cell">Prioridade</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRegras.map((regra) => (
                <TableRow key={regra.id}>
                  <TableCell>
                    {regra.active ? 
                      <div className="h-2.5 w-2.5 rounded-full bg-green-500" title="Ativa" /> : 
                      <div className="h-2.5 w-2.5 rounded-full bg-gray-300" title="Inativa" />
                    }
                  </TableCell>
                  <TableCell className="font-medium">{regra.name}</TableCell>
                  <TableCell className="hidden md:table-cell">{regra.condition}</TableCell>
                  <TableCell className="hidden md:table-cell">{regra.priority}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon">
                        <Info className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button variant="outline" size="sm" className="flex gap-2">
            <Settings className="h-4 w-4" />
            Configurações de Regras
          </Button>
          
          <Button variant="outline" size="sm">
            Exportar Regras
          </Button>
        </CardFooter>
      </Card>
    </>
  );
};

export default RegrasClinicasTab;
