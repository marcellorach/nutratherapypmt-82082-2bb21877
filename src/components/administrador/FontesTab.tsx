
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
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
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Plus, RefreshCw, ExternalLink, Database, FileText, FileSpreadsheet } from "lucide-react";
import { DataSource } from './dataAnalysis/types';

// Dados de demonstração
const mockFontesDados: DataSource[] = [
  {
    id: "ds1",
    name: "Prontuários da Clínica VetPrime",
    type: "clinical",
    description: "Base de dados de prontuários clínicos de cães e gatos tratados entre 2020-2024",
    lastUpdated: new Date(2024, 3, 10),
    recordCount: 3842,
    status: "online"
  },
  {
    id: "ds2",
    name: "Estudos científicos sobre nutracêuticos",
    type: "scientific",
    description: "Compilação de artigos científicos indexados sobre eficácia de nutracêuticos",
    lastUpdated: new Date(2024, 2, 25),
    recordCount: 512,
    status: "online"
  },
  {
    id: "ds3",
    name: "Análises de laboratório VetLab",
    type: "clinical",
    description: "Resultados de exames laboratoriais de pets entre 2019-2024",
    lastUpdated: new Date(2024, 3, 5),
    recordCount: 18745,
    status: "updating"
  },
  {
    id: "ds4",
    name: "Dados de tratamentos e resultados",
    type: "analytics",
    description: "Métricas de eficácia de tratamentos e taxa de sucesso ao longo do tempo",
    lastUpdated: new Date(2024, 1, 15),
    recordCount: 942,
    status: "online"
  },
  {
    id: "ds5",
    name: "Base de registros Hospital Central Veterinário",
    type: "clinical",
    description: "Prontuários completos de casos tratados no Hospital Central",
    lastUpdated: new Date(2023, 11, 20),
    recordCount: 8721,
    status: "offline"
  }
];

const FontesTab: React.FC = () => {
  const [fontes] = useState<DataSource[]>(mockFontesDados);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFontes = fontes.filter(fonte => 
    fonte.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    fonte.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Função para renderizar o ícone com base no tipo da fonte
  const renderIconByType = (type: DataSource['type']) => {
    switch (type) {
      case 'clinical':
        return <FileText className="text-blue-600 h-5 w-5" />;
      case 'scientific':
        return <FileSpreadsheet className="text-emerald-600 h-5 w-5" />;
      case 'analytics':
        return <Database className="text-purple-600 h-5 w-5" />;
      default:
        return <Database className="h-5 w-5" />;
    }
  };

  // Função para renderizar o badge de status
  const renderStatusBadge = (status: DataSource['status']) => {
    switch (status) {
      case 'online':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Online</Badge>;
      case 'updating':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Atualizando</Badge>;
      case 'offline':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Offline</Badge>;
      default:
        return null;
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold">Fontes de Dados</h2>
          <p className="text-gray-600">Gerencie e acompanhe as fontes de dados conectadas ao sistema</p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Conectar Nova Fonte
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Conectar Nova Fonte de Dados</DialogTitle>
              <DialogDescription>
                Adicione uma nova fonte de dados ao sistema para enriquecer análises
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="name" className="text-right">
                  Nome
                </label>
                <Input id="name" placeholder="Nome da fonte de dados" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="type" className="text-right">
                  Tipo
                </label>
                <select id="type" className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                  <option value="clinical">Dados Clínicos</option>
                  <option value="scientific">Dados Científicos</option>
                  <option value="analytics">Dados Analíticos</option>
                </select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="description" className="text-right">
                  Descrição
                </label>
                <Input id="description" placeholder="Descrição da fonte de dados" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="connection" className="text-right">
                  URL de Conexão
                </label>
                <Input id="connection" placeholder="jdbc://host:port/database ou API URL" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="credential" className="text-right">
                  Credencial
                </label>
                <Input id="credential" type="password" placeholder="Token de acesso ou senha" className="col-span-3" />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline">Cancelar</Button>
              <Button>Conectar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Fontes Conectadas</CardTitle>
              <CardDescription>Total: {fontes.length} fontes de dados configuradas</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Atualizar Status
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input 
              placeholder="Buscar fontes de dados..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Registros</TableHead>
                <TableHead className="hidden md:table-cell">Última Atualização</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFontes.map((fonte) => (
                <TableRow key={fonte.id}>
                  <TableCell>{renderIconByType(fonte.type)}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{fonte.name}</p>
                      <p className="text-xs text-gray-500 truncate max-w-xs">{fonte.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>{fonte.recordCount.toLocaleString()}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {fonte.lastUpdated.toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {renderStatusBadge(fonte.status)}
                      {fonte.status === 'updating' && (
                        <Progress value={45} className="h-1 w-16" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm">Detalhes</Button>
                      <Button variant="outline" size="icon">
                        <ExternalLink className="h-4 w-4" />
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

export default FontesTab;
