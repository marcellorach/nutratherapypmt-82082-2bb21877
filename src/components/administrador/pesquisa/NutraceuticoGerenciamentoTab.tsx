
import React, { useState } from 'react';
import { useNutraceuticalManager } from '@/hooks/useNutraceuticalManager';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Database,
  Search,
  Plus,
  Trash2,
  Edit,
  Filter,
  RefreshCcw,
  FileText,
  BookOpen,
  AlertTriangle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { NutraceuticalDataMigrator } from '@/utils/nutraceutical-data-migrator';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Componente para o cabeçalho da página
const NutraceuticoGerenciamentoHeader = () => (
  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
    <div className="flex items-center">
      <Database className="h-8 w-8 mr-3 text-blue-600" />
      <div>
        <h1 className="text-3xl font-bold">Banco de Nutracêuticos</h1>
        <p className="text-gray-600">Gerencie e mantenha atualizado o banco de dados de nutracêuticos e estudos científicos</p>
      </div>
    </div>
    
    <div className="flex gap-2 mt-4 md:mt-0">
      <Button variant="outline" className="flex items-center">
        <BookOpen className="mr-2 h-4 w-4" />
        Exportar Dados
      </Button>
      <Button variant="outline" className="flex items-center">
        <FileText className="mr-2 h-4 w-4" />
        Relatórios
      </Button>
    </div>
  </div>
);

// Componente principal
const NutraceuticoGerenciamentoTab: React.FC = () => {
  const {
    nutraceuticals,
    categories,
    conditions,
    studies,
    isLoading,
    error,
    refreshData,
    deleteNutraceutical
  } = useNutraceuticalManager();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isMigratorDialogOpen, setIsMigratorDialogOpen] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<any>(null);
  const [hasMigratedData, setHasMigratedData] = useState(false);

  // Estado para diálogo de confirmação de exclusão
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [nutraceuticalToDelete, setNutraceuticalToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { toast } = useToast();
  
  // Função para filtrar nutracêuticos
  const filteredNutraceuticals = nutraceuticals.filter(nutra => {
    const matchesSearch = searchTerm === '' || 
      nutra.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (nutra.description && nutra.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesCategory = selectedCategory === null || 
      nutra.category_id?.id === selectedCategory;
      
    return matchesSearch && matchesCategory;
  });

  // Função para iniciar o processo de exclusão
  const handleDeleteClick = (nutraId: string) => {
    setNutraceuticalToDelete(nutraId);
    setDeleteDialogOpen(true);
  };

  // Função para confirmar e executar a exclusão
  const confirmDelete = async () => {
    if (!nutraceuticalToDelete) return;

    setIsDeleting(true);
    try {
      await deleteNutraceutical(nutraceuticalToDelete);
      toast({
        title: "Nutracêutico excluído",
        description: "O nutracêutico foi removido com sucesso.",
      });
      setDeleteDialogOpen(false);
      setNutraceuticalToDelete(null);
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: `Não foi possível excluir o nutracêutico: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Função para executar a migração
  const handleStartMigration = async () => {
    setIsMigrating(true);
    try {
      const result = await NutraceuticalDataMigrator.migrateAll();
      setMigrationResult(result);
      
      if (result.success) {
        setHasMigratedData(true);
        toast({
          title: "Migração concluída",
          description: result.message,
        });
        refreshData();
      } else {
        toast({
          title: "Erro na migração",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("Erro ao executar migração:", err);
      setMigrationResult({
        success: false,
        message: `Erro inesperado: ${err.message}`
      });
      
      toast({
        title: "Erro na migração",
        description: "Ocorreu um erro inesperado durante o processo de migração",
        variant: "destructive",
      });
    } finally {
      setIsMigrating(false);
    }
  };
  
  // Renderização
  return (
    <div className="space-y-6">
      <NutraceuticoGerenciamentoHeader />
      
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Painel principal */}
        <div className="w-full lg:w-2/3 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>Nutracêuticos</CardTitle>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => refreshData()}
                  >
                    <RefreshCcw className="h-4 w-4 mr-1" />
                    Atualizar
                  </Button>
                  {!hasMigratedData && (
                    <Button
                      size="sm"
                      onClick={() => setIsMigratorDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
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
                        <TableHead>Categoria</TableHead>
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
                              {nutra.category_id ? (
                                <Badge variant="outline">{nutra.category_id.name}</Badge>
                              ) : (
                                <span className="text-muted-foreground text-xs">Sem categoria</span>
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
        </div>
        
        {/* Painel lateral */}
        <div className="w-full lg:w-1/3 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas</CardTitle>
              <CardDescription>
                Visão geral do banco de dados de nutracêuticos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Total de Nutracêuticos</div>
                  <div className="text-2xl font-bold">{nutraceuticals.length}</div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Categorias</div>
                  <div className="text-2xl font-bold">{categories.length}</div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Condições de Saúde</div>
                  <div className="text-2xl font-bold">{conditions.length}</div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Estudos Científicos</div>
                  <div className="text-2xl font-bold">{studies.length}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Último Atualização</CardTitle>
              <CardDescription>
                Informações sobre as últimas alterações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : (
                  <p className="text-sm">
                    Última atualização do banco de dados em{" "}
                    {new Date().toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Nutracêutico
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Categoria
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Condição de Saúde
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Estudo Científico
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Dialog para migrador de dados */}
      <Dialog open={isMigratorDialogOpen} onOpenChange={setIsMigratorDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Migração de Dados</DialogTitle>
            <DialogDescription>
              Esta operação irá migrar os dados dos arquivos estáticos para o banco de dados Supabase.
              Isso inclui todos os nutracêuticos, suas categorias, condições e relacionamentos.
            </DialogDescription>
          </DialogHeader>
          
          {migrationResult && (
            <div className={`p-3 rounded-md ${migrationResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              <p className="text-sm">{migrationResult.message}</p>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsMigratorDialogOpen(false)}
              disabled={isMigrating}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleStartMigration}
              disabled={isMigrating}
            >
              {isMigrating ? 'Migrando...' : 'Iniciar Migração'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog para confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este nutracêutico? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              disabled={isDeleting} 
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default NutraceuticoGerenciamentoTab;
