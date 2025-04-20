
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle, Search, FileText, Filter, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { nutraceuticals } from '@/data';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from 'react-i18next';
import NutraceuricoDetailDialog from './dialogs/NutraceuticoDetailDialog';

const NutraceuticosTab: React.FC = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNutraceutical, setSelectedNutraceutical] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterEfficacy, setFilterEfficacy] = useState<number | null>(null);
  const [filterCondition, setFilterCondition] = useState<string | null>(null);

  // Extrair condições únicas dos nutracêuticos
  const uniqueConditions = [...new Set(nutraceuticals.map(item => item.condition))];

  // Filtrar nutracêuticos com base nos critérios
  const filteredNutraceuticals = nutraceuticals.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEfficacy = 
      filterEfficacy === null || 
      Math.floor(item.scientificEvidence.efficacyScore) === filterEfficacy;
    
    const matchesCondition = 
      filterCondition === null ||
      item.condition === filterCondition;
    
    return matchesSearch && matchesEfficacy && matchesCondition;
  });

  const handleOpenDetails = (nutraceutical) => {
    setSelectedNutraceutical(nutraceutical);
    setIsDialogOpen(true);
  };

  const clearFilters = () => {
    setFilterEfficacy(null);
    setFilterCondition(null);
    setSearchTerm('');
  };

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold">Catálogo de Nutracêuticos</h2>
          <p className="text-gray-600">Gerenciamento de substâncias e suas evidências científicas</p>
        </div>
        <Button className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Adicionar Nutracêutico
        </Button>
      </div>
      
      <div className="bg-white rounded-md shadow mb-6">
        <div className="p-4 border-b">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input 
                placeholder="Buscar nutracêutico..." 
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2 self-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-1">
                    <Filter className="h-4 w-4" />
                    Eficácia
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {[5, 4, 3, 2, 1].map((score) => (
                    <DropdownMenuCheckboxItem
                      key={score}
                      checked={filterEfficacy === score}
                      onCheckedChange={() => 
                        filterEfficacy === score 
                          ? setFilterEfficacy(null) 
                          : setFilterEfficacy(score)
                      }
                    >
                      {score} {score === 1 ? "estrela" : "estrelas"}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-1">
                    <Filter className="h-4 w-4" />
                    Condição
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  {uniqueConditions.map((condition) => (
                    <DropdownMenuCheckboxItem
                      key={condition}
                      checked={filterCondition === condition}
                      onCheckedChange={() => 
                        filterCondition === condition 
                          ? setFilterCondition(null) 
                          : setFilterCondition(condition)
                      }
                    >
                      {condition}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              {(filterEfficacy !== null || filterCondition !== null || searchTerm) && (
                <Button variant="ghost" onClick={clearFilters} size="sm">
                  Limpar filtros
                </Button>
              )}
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Condição de Saúde</TableHead>
                <TableHead>Evidência</TableHead>
                <TableHead className="text-center">Estudos</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNutraceuticals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Nenhum nutracêutico encontrado com os filtros selecionados.
                  </TableCell>
                </TableRow>
              ) : (
                filteredNutraceuticals.map((item) => (
                  <TableRow key={item.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="max-w-xs truncate">{item.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-slate-50">
                        {item.condition}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className="font-medium mr-1">{item.scientificEvidence.efficacyScore.toFixed(1)}</span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <span 
                              key={i}
                              className={`text-sm ${
                                i < Math.floor(item.scientificEvidence.efficacyScore) 
                                  ? "text-amber-400" 
                                  : "text-gray-300"
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {item.scientificEvidence.studies.length}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleOpenDetails(item)}
                        className="hover:bg-gray-100"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      <NutraceuricoDetailDialog 
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        nutraceutical={selectedNutraceutical}
      />
    </>
  );
};

export default NutraceuticosTab;
