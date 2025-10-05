
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
import { Progress } from "@/components/ui/progress";
import { Plus, FileEdit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';

// Mock data para estudos planejados - bilíngue
const mockEstudos = [
  {
    id: "1",
    titulo_pt: "Eficácia de SGLT2 duplo em cães idosos",
    titulo_en: "Dual SGLT2 efficacy in elderly dogs",
    objetivo_pt: "Avaliar os efeitos senolíticos, cardioprotetores e nefroprotetores de inibidores SGLT2 em cães",
    objetivo_en: "Evaluate senolytic, cardioprotective and nephroprotective effects of SGLT2 inhibitors in dogs",
    populacao: 200,
    recrutados: 47,
    duracao_pt: "18 meses",
    duracao_en: "18 months",
    status: "recruiting"
  },
  {
    id: "2",
    titulo_pt: "Probiótícos e saúde digestiva",
    titulo_en: "Probiotics and digestive health",
    objetivo_pt: "Comparar diferentes formulações de probióticos em cães com histórico de problemas digestivos",
    objetivo_en: "Compare different probiotic formulations in dogs with history of digestive problems",
    populacao: 45,
    recrutados: 12,
    duracao_pt: "3 meses",
    duracao_en: "3 months",
    status: "pendingApproval"
  },
  {
    id: "3",
    titulo_pt: "Suporte cognitivo para cães seniores",
    titulo_en: "Cognitive support for senior dogs",
    objetivo_pt: "Estudo randomizado para avaliar extratos de Ginkgo biloba em cães acima de 8 anos",
    objetivo_en: "Randomized study to evaluate Ginkgo biloba extracts in dogs over 8 years old",
    populacao: 80,
    recrutados: 0,
    duracao_pt: "12 meses",
    duracao_en: "12 months",
    status: "planning"
  }
];

const EstudosPlanejadosTab: React.FC = () => {
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const isEnglish = i18n.language === 'en';
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
      title: t('admin.studies.plannedStudies.messages.studyRemoved'),
      description: t('admin.studies.plannedStudies.messages.studyRemovedDesc')
    });
  };

  const handleSaveEstudo = (e: React.FormEvent) => {
    e.preventDefault();
    setDialogOpen(false);
    toast({
      title: editingEstudo 
        ? t('admin.studies.plannedStudies.messages.studyUpdated')
        : t('admin.studies.plannedStudies.messages.studyAdded'),
      description: editingEstudo 
        ? t('admin.studies.plannedStudies.messages.studyUpdatedDesc')
        : t('admin.studies.plannedStudies.messages.studyAddedDesc')
    });
  };
  
  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      recruiting: t('admin.studies.plannedStudies.status.recruiting'),
      pendingApproval: t('admin.studies.plannedStudies.status.pendingApproval'),
      planning: t('admin.studies.plannedStudies.status.planning')
    };
    return statusMap[status] || status;
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {t('admin.studies.plannedStudies.title')}
          </h2>
          <p className="text-muted-foreground">
            {t('admin.studies.plannedStudies.description')}
          </p>
        </div>
        <Button onClick={handleAddEstudo}>
          <Plus className="mr-2 h-4 w-4" />
          {t('admin.studies.plannedStudies.newStudy')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('admin.studies.plannedStudies.listTitle')}</CardTitle>
          <CardDescription>
            {t('admin.studies.plannedStudies.listDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.studies.plannedStudies.table.title')}</TableHead>
                <TableHead>{t('admin.studies.plannedStudies.table.objective')}</TableHead>
                <TableHead className="text-center">{t('admin.studies.plannedStudies.table.population')}</TableHead>
                <TableHead className="text-center">{t('admin.studies.plannedStudies.table.duration')}</TableHead>
                <TableHead className="text-center">{t('admin.studies.plannedStudies.table.status')}</TableHead>
                <TableHead className="text-right">{t('admin.studies.plannedStudies.table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {estudos.map((estudo) => {
                const progressoRecrutamento = (estudo.recrutados / estudo.populacao) * 100;
                
                const titulo = isEnglish ? estudo.titulo_en : estudo.titulo_pt;
                const objetivo = isEnglish ? estudo.objetivo_en : estudo.objetivo_pt;
                const duracao = isEnglish ? estudo.duracao_en : estudo.duracao_pt;
                const statusLabel = getStatusLabel(estudo.status);
                
                return (
                  <TableRow key={estudo.id}>
                    <TableCell className="font-medium">{titulo}</TableCell>
                    <TableCell className="max-w-md">{objetivo}</TableCell>
                    <TableCell className="text-center">
                      <div className="space-y-1">
                        <div className="text-sm">
                          {estudo.populacao} {t('admin.studies.plannedStudies.table.dogs')}
                        </div>
                        {estudo.status === 'recruiting' && (
                          <div className="space-y-1">
                            <Progress value={progressoRecrutamento} className="h-2" />
                            <div className="text-xs text-muted-foreground">
                              {estudo.recrutados}/{estudo.populacao} {t('admin.studies.plannedStudies.table.recruited')}
                            </div>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{duracao}</TableCell>
                    <TableCell className="text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium 
                        ${estudo.status === 'recruiting' ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300' : 
                          estudo.status === 'pendingApproval' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300' : 
                          'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'}`}>
                        {statusLabel}
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
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingEstudo 
                ? t('admin.studies.plannedStudies.editStudy')
                : t('admin.studies.plannedStudies.newStudy')
              }
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEstudo}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="titulo" className="text-right">
                  {t('admin.studies.plannedStudies.form.title')}
                </label>
                <Input 
                  id="titulo" 
                  className="col-span-3" 
                  defaultValue={isEnglish ? editingEstudo?.titulo_en : editingEstudo?.titulo_pt || ""} 
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="objetivo" className="text-right">
                  {t('admin.studies.plannedStudies.form.objective')}
                </label>
                <Input 
                  id="objetivo" 
                  className="col-span-3" 
                  defaultValue={isEnglish ? editingEstudo?.objetivo_en : editingEstudo?.objetivo_pt || ""} 
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="populacao" className="text-right">
                  {t('admin.studies.plannedStudies.form.population')}
                </label>
                <Input 
                  id="populacao" 
                  className="col-span-3" 
                  type="number" 
                  defaultValue={editingEstudo?.populacao || "50"} 
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="duracao" className="text-right">
                  {t('admin.studies.plannedStudies.form.duration')}
                </label>
                <Input 
                  id="duracao" 
                  className="col-span-3" 
                  defaultValue={isEnglish ? editingEstudo?.duracao_en : editingEstudo?.duracao_pt || (isEnglish ? "6 months" : "6 meses")} 
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="status" className="text-right">
                  {t('admin.studies.plannedStudies.form.status')}
                </label>
                <Input 
                  id="status" 
                  className="col-span-3" 
                  defaultValue={editingEstudo ? getStatusLabel(editingEstudo.status) : t('admin.studies.plannedStudies.status.planning')} 
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">{t('admin.studies.plannedStudies.form.save')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EstudosPlanejadosTab;
