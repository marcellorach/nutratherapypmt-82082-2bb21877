
import React, { useState } from 'react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import ManageRelationshipsDialog from '../nutraceuticoGerenciamento/dialogs/ManageRelationshipsDialog';
import NutraceuticalExpandableRow from './NutraceuticalExpandableRow';

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
  onEditClick?: (nutraceutical: any) => void;
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
  openMigratorDialog,
  onEditClick
}) => {
  // Estado para linhas expandidas
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Estado para o diálogo de gerenciamento de relações
  const [isRelationshipsDialogOpen, setIsRelationshipsDialogOpen] = useState(false);
  const [selectedNutraceutical, setSelectedNutraceutical] = useState<any>(null);
  
  // Função para alternar a expansão de uma linha
  const toggleRowExpansion = (nutraId: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [nutraId]: !prev[nutraId]
    }));
  };
  
  // Função para abrir o diálogo de gerenciamento de relações
  const handleManageRelationships = (nutra: any) => {
    setSelectedNutraceutical(nutra);
    setIsRelationshipsDialogOpen(true);
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
          <div className="py-6">
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertTitle>Erro ao carregar os dados</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="text-center">
              <Button 
                variant="default" 
                onClick={refreshData}
                className="mt-2"
              >
                <RefreshCcw className="h-4 w-4 mr-2" />
                Tentar novamente
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>Outcomes</TableHead>
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
                    <NutraceuticalExpandableRow
                      key={nutra.id}
                      nutraceutical={nutra}
                      isExpanded={!!expandedRows[nutra.id]}
                      onToggleExpand={() => toggleRowExpansion(nutra.id)}
                      onEditClick={onEditClick}
                      onDeleteClick={handleDeleteClick}
                      onManageRelationships={handleManageRelationships}
                    />
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

      {/* Diálogo para gerenciar relações (estudos e outcomes) */}
      {selectedNutraceutical && (
        <ManageRelationshipsDialog
          open={isRelationshipsDialogOpen}
          onOpenChange={setIsRelationshipsDialogOpen}
          nutraceutical={selectedNutraceutical}
          onSuccess={refreshData}
        />
      )}
    </Card>
  );
};

export default NutraceuticalTable;
