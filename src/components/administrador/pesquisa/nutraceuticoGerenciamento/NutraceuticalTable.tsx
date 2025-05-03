
import React from 'react';
import { Search, Filter, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit, Trash2 } from 'lucide-react';

interface NutraceuticalTableProps {
  nutraceuticals: any[];
  filteredNutraceuticals: any[];
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  refreshData: () => void;
  handleDeleteClick: (id: string) => void;
  hasMigratedData: boolean;
  openMigratorDialog: () => void;
}

const NutraceuticalTable: React.FC<NutraceuticalTableProps> = ({
  nutraceuticals,
  filteredNutraceuticals,
  isLoading,
  error,
  searchTerm,
  setSearchTerm,
  refreshData,
  handleDeleteClick,
  hasMigratedData,
  openMigratorDialog
}) => {
  // Função auxiliar para obter o nome do outcome
  const getOutcomeName = (nutra: any) => {
    // Se outcome_id é um objeto (Supabase retorna a relação expandida)
    if (nutra.outcome_id && typeof nutra.outcome_id === 'object') {
      return nutra.outcome_id.name || 'Sem outcome';
    }
    
    // Se outcome_id é apenas um ID ou não existe
    return 'Sem outcome';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>Nutracêuticos</CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={refreshData}
            >
              <RefreshCcw className="h-4 w-4 mr-1" />
              Atualizar
            </Button>
            {!hasMigratedData && (
              <Button
                size="sm"
                onClick={openMigratorDialog}
              >
                <RefreshCcw className="h-4 w-4 mr-1" />
                Migrar Dados
              </Button>
            )}
          </div>
        </div>
        <CardDescription>
          Visualize e gerencie todos os nutracêuticos do banco de dados
        </CardDescription>
        <div className="flex items-center gap-2 pt-3">
          <Search className="h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar nutracêutico..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Button variant="outline" size="sm" className="flex items-center">
            <Filter className="h-4 w-4 mr-1" />
            Filtros
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : error ? (
          <div className="text-center py-6 text-red-500">
            <p>{error}</p>
            <Button 
              variant="outline" 
              onClick={refreshData}
              className="mt-2"
            >
              Tentar novamente
            </Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>Condições</TableHead>
                  <TableHead>Estudos</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNutraceuticals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      Nenhum nutracêutico encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredNutraceuticals.map((nutra) => (
                    <TableRow key={nutra.id}>
                      <TableCell className="font-medium">
                        {nutra.name}
                      </TableCell>
                      <TableCell>
                        {getOutcomeName(nutra) !== 'Sem outcome' ? (
                          <Badge variant="outline">{getOutcomeName(nutra)}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">Sem outcome</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {nutra.nutraceutical_health_conditions?.length || 0}
                      </TableCell>
                      <TableCell>
                        {nutra.nutraceutical_studies?.length || 0}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="icon" variant="ghost" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-red-500"
                            onClick={() => handleDeleteClick(nutra.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-2">
        <div className="text-sm text-muted-foreground">
          {filteredNutraceuticals.length} de {nutraceuticals.length} nutracêuticos
        </div>
      </CardFooter>
    </Card>
  );
};

export default NutraceuticalTable;
