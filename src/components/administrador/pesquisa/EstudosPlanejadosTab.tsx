
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Plus, FileEdit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock data para estudos planejados
const mockEstudos = [
  {
    id: "1",
    titulo: "Eficácia de Ômega-3 em cães idosos",
    objetivo: "Avaliar os efeitos de suplementação com ômega-3 na mobilidade articular",
    populacao: 60,
    duracao: "6 meses",
    status: "Recrutando"
  },
  {
    id: "2",
    titulo: "Probiótícos e saúde digestiva",
    objetivo: "Comparar diferentes formulações de probióticos em cães com histórico de problemas digestivos",
    populacao: 45,
    duracao: "3 meses",
    status: "Aprovação pendente"
  },
  {
    id: "3",
    titulo: "Suporte cognitivo para cães seniores",
    objetivo: "Estudo randomizado para avaliar extratos de Ginkgo biloba em cães acima de 8 anos",
    populacao: 80,
    duracao: "12 meses",
    status: "Planejamento"
  }
];

const EstudosPlanejadosTab: React.FC = () => {
  const { toast } = useToast();
  const [estudos, setEstudos] = useState(mockEstudos);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEstudo, setEditingEstudo] = useState<any>(null);

  const handleAddEstudo = () => {
    setEditingEstudo(null);
    setDialogOpen(true);
  };

  const handleEditEstudo = (estudo: any) => {
    setEditingEstudo(estudo);
    setDialogOpen(true);
  };

  const handleDeleteEstudo = (id: string) => {
    setEstudos(estudos.filter(estudo => estudo.id !== id));
    toast({
      title: "Estudo removido",
      description: "O estudo foi removido com sucesso."
    });
  };

  const handleSaveEstudo = (e: React.FormEvent) => {
    e.preventDefault();
    setDialogOpen(false);
    toast({
      title: editingEstudo ? "Estudo atualizado" : "Estudo adicionado",
      description: editingEstudo 
        ? "As alterações foram salvas com sucesso." 
        : "O novo estudo foi adicionado com sucesso."
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Estudos Planejados</h2>
          <p className="text-muted-foreground">
            Gerencie os estudos científicos em fase de planejamento.
          </p>
        </div>
        <Button onClick={handleAddEstudo}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Estudo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Estudos</CardTitle>
          <CardDescription>
            Estudos científicos em fase de planejamento e análise prévia.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Objetivo</TableHead>
                <TableHead className="text-center">População</TableHead>
                <TableHead className="text-center">Duração</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {estudos.map((estudo) => (
                <TableRow key={estudo.id}>
                  <TableCell className="font-medium">{estudo.titulo}</TableCell>
                  <TableCell className="max-w-md">{estudo.objetivo}</TableCell>
                  <TableCell className="text-center">{estudo.populacao} cães</TableCell>
                  <TableCell className="text-center">{estudo.duracao}</TableCell>
                  <TableCell className="text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium 
                      ${estudo.status === 'Recrutando' ? 'bg-green-100 text-green-800' : 
                        estudo.status === 'Aprovação pendente' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-blue-100 text-blue-800'}`}>
                      {estudo.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEditEstudo(estudo)}
                      >
                        <FileEdit className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteEstudo(estudo.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Excluir</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingEstudo ? "Editar Estudo" : "Novo Estudo"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEstudo}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="titulo" className="text-right">Título</label>
                <Input 
                  id="titulo" 
                  className="col-span-3" 
                  defaultValue={editingEstudo?.titulo || ""} 
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="objetivo" className="text-right">Objetivo</label>
                <Input 
                  id="objetivo" 
                  className="col-span-3" 
                  defaultValue={editingEstudo?.objetivo || ""} 
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="populacao" className="text-right">População</label>
                <Input 
                  id="populacao" 
                  className="col-span-3" 
                  type="number" 
                  defaultValue={editingEstudo?.populacao || "50"} 
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="duracao" className="text-right">Duração</label>
                <Input 
                  id="duracao" 
                  className="col-span-3" 
                  defaultValue={editingEstudo?.duracao || "6 meses"} 
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="status" className="text-right">Status</label>
                <Input 
                  id="status" 
                  className="col-span-3" 
                  defaultValue={editingEstudo?.status || "Planejamento"} 
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EstudosPlanejadosTab;
