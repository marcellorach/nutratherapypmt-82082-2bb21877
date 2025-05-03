import React, { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNutraceuticals } from '@/hooks/nutraceuticals/useNutraceuticals';
import { useOutcomes } from '@/hooks/nutraceuticals/useOutcomes';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Info, FileText, Star, StarHalf, StarOff } from 'lucide-react';
import { useConditions } from '@/hooks/nutraceuticals/useConditions';
import { useStudies } from '@/hooks/nutraceuticals/useStudies';
import { useToast } from '@/hooks/use-toast';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { NutraceuticalsService } from '@/services/nutraceuticals';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Schema de validação
const formSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  description: z.string().optional(),
  category: z.string().optional(),
  efficacyScore: z.string().optional(),
  dosage: z.string().optional(),
  source: z.string().optional(),
  chemical_compound: z.string().optional(),
  contraindications: z.string().optional(),
});

// Tipagem para os dados do formulário
type FormData = z.infer<typeof formSchema>;

interface RelationData {
  category: string;
  efficacyScore: number;
  studies: string[];
  notes: string;
}

interface AddNutraceuticalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nutraceutical?: any;
  onSuccess?: () => void;
}

const AddNutraceuticalDialog: React.FC<AddNutraceuticalDialogProps> = ({ 
  open, 
  onOpenChange,
  nutraceutical,
  onSuccess
}) => {
  const { toast } = useToast();
  const { createNutraceutical, updateNutraceutical } = useNutraceuticals();
  const { outcomes, fetchOutcomes } = useOutcomes();
  const { studies, fetchStudies } = useStudies();
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [isNewNutraceutical, setIsNewNutraceutical] = useState(true);
  const [currentNutraceutical, setCurrentNutraceutical] = useState<any>(null);
  const [efficacyScore, setEfficacyScore] = useState<number>(3);
  const [relations, setRelations] = useState<RelationData[]>([]);
  const [selectedStudies, setSelectedStudies] = useState<string[]>([]);
  const [relationNotes, setRelationNotes] = useState<string>("");
  
  // Estados para gestão de relações adicionais
  const [showAddRelation, setShowAddRelation] = useState(false);
  const [addRelationCategory, setAddRelationCategory] = useState("");
  const [addRelationEfficacy, setAddRelationEfficacy] = useState(3);
  const [addRelationStudies, setAddRelationStudies] = useState<string[]>([]);
  const [addRelationNotes, setAddRelationNotes] = useState("");
  
  useEffect(() => {
    if (open) {
      fetchOutcomes();
      fetchStudies();
      
      setIsNewNutraceutical(!nutraceutical);
      setCurrentNutraceutical(nutraceutical);
      
      if (nutraceutical) {
        // Inicializar com a relação primária (outcome do nutracêutico)
        if (nutraceutical.outcome_id) {
          setRelations([{
            category: nutraceutical.outcome_id,
            efficacyScore: nutraceutical.scientific_metadata?.efficacy_score || 3,
            studies: [],
            notes: nutraceutical.scientific_metadata?.notes || ""
          }]);
        }
        
        // Inicializar eficácia com o valor do metadata
        setEfficacyScore(nutraceutical.scientific_metadata?.efficacy_score || 3);
      } else {
        setRelations([]);
        setEfficacyScore(3);
      }
      
      setActiveTab('info');
      setSelectedStudies([]);
      setRelationNotes("");
    }
  }, [open, nutraceutical]);
  
  // Inicialização do formulário
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: nutraceutical?.name || '',
      description: nutraceutical?.description || '',
      category: nutraceutical?.outcome_id || undefined,
      efficacyScore: String(nutraceutical?.scientific_metadata?.efficacy_score || 3),
      dosage: nutraceutical?.dosage || '',
      source: nutraceutical?.source || '',
      chemical_compound: nutraceutical?.chemical_compound || '',
      contraindications: nutraceutical?.contraindications ? 
        nutraceutical.contraindications.join('\n') : '',
    }
  });
  
  // Atualiza os valores do formulário quando o nutracêutico é alterado
  useEffect(() => {
    if (nutraceutical) {
      form.reset({
        name: nutraceutical.name || '',
        description: nutraceutical.description || '',
        category: nutraceutical.outcome_id || undefined,
        efficacyScore: String(nutraceutical.scientific_metadata?.efficacy_score || 3),
        dosage: nutraceutical.dosage || '',
        source: nutraceutical.source || '',
        chemical_compound: nutraceutical.chemical_compound || '',
        contraindications: nutraceutical.contraindications ? 
          nutraceutical.contraindications.join('\n') : '',
      });
    } else {
      form.reset({
        name: '',
        description: '',
        category: undefined,
        efficacyScore: '3',
        dosage: '',
        source: '',
        chemical_compound: '',
        contraindications: '',
      });
    }
  }, [nutraceutical, form]);
  
  const { isSubmitting } = form.formState;
  
  // Função para remover uma relação
  const handleRemoveRelation = (index: number) => {
    setRelations(prevRelations => prevRelations.filter((_, i) => i !== index));
  };
  
  // Função para adicionar uma nova relação
  const handleAddRelation = () => {
    if (!addRelationCategory || addRelationCategory === 'none') {
      toast({
        title: "Atenção",
        description: "Selecione uma categoria para adicionar a relação",
        variant: "default"
      });
      return;
    }
    
    setRelations(prevRelations => [
      ...prevRelations, 
      {
        category: addRelationCategory,
        efficacyScore: addRelationEfficacy,
        studies: addRelationStudies,
        notes: addRelationNotes
      }
    ]);
    
    // Limpar o formulário
    setAddRelationCategory("");
    setAddRelationEfficacy(3);
    setAddRelationStudies([]);
    setAddRelationNotes("");
    setShowAddRelation(false);
    
    toast({
      title: "Sucesso",
      description: "Nova relação adicionada",
    });
  };

  // Função para lidar com o envio do formulário
  const handleSubmit = async (values: FormData) => {
    setLoading(true);
    try {
      // Processamento de contraindicações
      const contraindications = values.contraindications 
        ? values.contraindications.split('\n').map(item => item.trim()).filter(Boolean)
        : [];
      
      // Atualizar a primeira relação com os dados do formulário principal
      if (values.category) {
        const updatedRelations = [...relations];
        if (updatedRelations.length === 0) {
          updatedRelations.push({
            category: values.category,
            efficacyScore: parseInt(values.efficacyScore || '3', 10),
            studies: selectedStudies,
            notes: relationNotes
          });
        } else {
          updatedRelations[0] = {
            ...updatedRelations[0],
            category: values.category,
            efficacyScore: parseInt(values.efficacyScore || '3', 10),
            studies: selectedStudies,
            notes: relationNotes
          };
        }
        setRelations(updatedRelations);
      }
      
      let result;
      
      if (isNewNutraceutical) {
        // Criar novo nutracêutico com a primeira relação como outcome principal
        result = await createNutraceutical({
          name: values.name,
          description: values.description || undefined,
          outcome_id: values.category || undefined,
          dosage: values.dosage || undefined,
          source: values.source || undefined,
          chemical_compound: values.chemical_compound || undefined,
          contraindications: contraindications.length > 0 ? contraindications : undefined,
          scientific_metadata: {
            efficacy_score: parseInt(values.efficacyScore || '3', 10),
            notes: relationNotes
          }
        });
        
        // Se temos estudos selecionados, associá-los ao nutracêutico
        if (selectedStudies.length > 0) {
          for (const studyId of selectedStudies) {
            await NutraceuticalsService.relateToStudy(
              result.id,
              studyId,
              parseInt(values.efficacyScore || '3', 10)
            );
          }
        }
        
        toast({
          title: "Sucesso",
          description: "Nutracêutico criado com sucesso",
        });
      } else {
        // Atualizar nutracêutico existente
        result = await updateNutraceutical(nutraceutical.id, {
          name: values.name,
          description: values.description || undefined,
          outcome_id: values.category || undefined,
          dosage: values.dosage || undefined,
          source: values.source || undefined,
          chemical_compound: values.chemical_compound || undefined,
          contraindications: contraindications.length > 0 ? contraindications : undefined
        });
        
        // Atualizar metadata científica - CORRIGIDO: modificado para passar apenas 2 argumentos
        await NutraceuticalsService.updateScientificMetadata(
          nutraceutical.id, 
          parseInt(values.efficacyScore || '3', 10)
        );
        
        // Atualizar relação com outcome
        await NutraceuticalsService.updateOutcomeRelation(
          nutraceutical.id,
          relationNotes
        );
        
        toast({
          title: "Sucesso",
          description: "Nutracêutico atualizado com sucesso",
        });
      }
      
      // Atualizar o nutracêutico atual
      setCurrentNutraceutical(result);
      setIsNewNutraceutical(false);
      
    } catch (error) {
      console.error('Erro ao salvar nutracêutico:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o nutracêutico",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Função para toggle seleção de estudo
  const toggleStudySelection = (studyId: string) => {
    if (selectedStudies.includes(studyId)) {
      setSelectedStudies(selectedStudies.filter(id => id !== studyId));
    } else {
      setSelectedStudies([...selectedStudies, studyId]);
    }
  };
  
  // Toggle seleção de estudo para novas relações
  const toggleAddRelationStudy = (studyId: string) => {
    if (addRelationStudies.includes(studyId)) {
      setAddRelationStudies(addRelationStudies.filter(id => id !== studyId));
    } else {
      setAddRelationStudies([...addRelationStudies, studyId]);
    }
  };
  
  // Função para finalizar o processo
  const handleFinish = () => {
    // Implementar salvamento das relações adicionais aqui
    
    // Reiniciar o formulário
    form.reset();
    setRelations([]);
    setEfficacyScore(3);
    setSelectedStudies([]);
    setRelationNotes("");
    
    // Notificar o componente pai
    if (onSuccess) {
      onSuccess();
    }
    
    // Fechar o diálogo
    onOpenChange(false);
  };
  
  // Função para renderizar estrelas com base na pontuação
  const renderStars = (score: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= score) {
        stars.push(<Star key={i} className="h-4 w-4 text-yellow-500" />);
      } else if (i - 0.5 <= score) {
        stars.push(<StarHalf key={i} className="h-4 w-4 text-yellow-500" />);
      } else {
        stars.push(<StarOff key={i} className="h-4 w-4 text-gray-300" />);
      }
    }
    return <div className="flex">{stars}</div>;
  };
  
  // Função para obter o nome da categoria
  const getCategoryName = (categoryId: string) => {
    const outcome = outcomes.find(out => out.id === categoryId);
    return outcome ? outcome.name : 'Categoria desconhecida';
  };
  
  // Função para obter o nome do estudo
  const getStudyName = (studyId: string) => {
    const study = studies.find(s => s.id === studyId);
    return study ? study.title : 'Estudo desconhecido';
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isNewNutraceutical 
              ? 'Adicionar Novo Nutracêutico' 
              : `Editar Nutracêutico: ${nutraceutical?.name}`}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="info">Informações Básicas</TabsTrigger>
            <TabsTrigger 
              value="relations" 
              disabled={isNewNutraceutical && !currentNutraceutical}
            >
              Relações e Estudos
            </TabsTrigger>
          </TabsList>
          
          {/* Aba de Informações Básicas */}
          <TabsContent value="info">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Nutracêutico</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Resveratrol, Ômega-3, etc." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria Principal</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Sem categoria</SelectItem>
                            {outcomes.map((outcome) => (
                              <SelectItem key={outcome.id} value={outcome.id || ""}>
                                {outcome.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="efficacyScore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nota de Eficácia (0-5)</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-4">
                            <Select 
                              onValueChange={field.onChange} 
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione uma nota" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="0">0 - Sem eficácia</SelectItem>
                                <SelectItem value="1">1 - Muito baixa</SelectItem>
                                <SelectItem value="2">2 - Baixa</SelectItem>
                                <SelectItem value="3">3 - Moderada</SelectItem>
                                <SelectItem value="4">4 - Alta</SelectItem>
                                <SelectItem value="5">5 - Muito alta</SelectItem>
                              </SelectContent>
                            </Select>
                            <div className="flex">
                              {renderStars(parseInt(field.value || '3', 10))}
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Descreva o nutracêutico e suas propriedades principais"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="chemical_compound"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Composto Químico</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Fórmula ou nome químico" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fonte Natural</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: Uva, Nozes, Peixes, etc." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="dosage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dosagem Recomendada</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: 500mg diários, 2-5g por dia, etc." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="contraindications"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraindicações (separadas por linha)</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Ex: Gravidez&#10;Lactação&#10;Uso de anticoagulantes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-4 border p-4 rounded-md">
                  <h3 className="font-medium">Estudos Científicos Associados</h3>
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-muted-foreground">
                      Selecione os estudos científicos que comprovam a eficácia deste nutracêutico para a categoria principal.
                    </p>
                    
                    <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                      {studies.length > 0 ? (
                        studies.map(study => (
                          <div key={study.id} className="flex items-center gap-2 py-1">
                            <input 
                              type="checkbox" 
                              id={`study-${study.id}`} 
                              checked={selectedStudies.includes(study.id)} 
                              onChange={() => toggleStudySelection(study.id)}
                              className="h-4 w-4"
                            />
                            <label htmlFor={`study-${study.id}`} className="text-sm">
                              {study.title} ({study.year})
                            </label>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">Nenhum estudo disponível</p>
                      )}
                    </div>
                    
                    <Button type="button" variant="outline" size="sm" className="w-full flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Upload de Novos Estudos
                    </Button>
                  </div>
                  
                  <div>
                    <FormLabel>Notas sobre a Eficácia</FormLabel>
                    <Textarea
                      value={relationNotes}
                      onChange={(e) => setRelationNotes(e.target.value)}
                      placeholder="Adicione notas sobre a eficácia deste nutracêutico"
                      className="resize-none h-20"
                    />
                  </div>
                </div>
                
                <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancelar
                  </Button>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={isSubmitting || loading}>
                      {(isSubmitting || loading) ? 'Salvando...' : 'Salvar'}
                    </Button>
                    {!isNewNutraceutical && (
                      <Button type="button" onClick={() => setActiveTab('relations')} variant="secondary">
                        Relações Adicionais
                      </Button>
                    )}
                  </div>
                </DialogFooter>

                {isNewNutraceutical && (
                  <div className="text-sm text-muted-foreground mt-2 flex items-center">
                    <Info className="h-4 w-4 mr-2" />
                    Após salvar as informações básicas, você poderá adicionar relações adicionais na próxima aba.
                  </div>
                )}
              </form>
            </Form>
          </TabsContent>
          
          {/* Aba de Relações Adicionais */}
          <TabsContent value="relations">
            <div className="space-y-6">
              <Alert variant="default" className="bg-blue-50 mb-6">
                <AlertCircle className="h-5 w-5" />
                <AlertTitle>Relações de Nutracêuticos</AlertTitle>
                <AlertDescription>
                  Cada nutracêutico pode estar relacionado a múltiplas categorias com diferentes notas de eficácia.
                  A categoria principal foi definida na primeira aba, mas você pode adicionar relações adicionais aqui.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Relações do Nutracêutico</h3>
                  <Button 
                    onClick={() => setShowAddRelation(true)}
                    variant="outline"
                    disabled={showAddRelation}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar Relação
                  </Button>
                </div>
                
                {/* Lista de Relações Existentes */}
                {relations.length > 0 ? (
                  <div className="space-y-4">
                    {relations.map((relation, index) => (
                      <div key={index} className="border rounded-md p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-base font-medium">
                              {getCategoryName(relation.category)}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline">
                                Eficácia: {relation.efficacyScore}
                              </Badge>
                              <div className="flex">
                                {renderStars(relation.efficacyScore)}
                              </div>
                            </div>
                          </div>
                          {index > 0 && (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleRemoveRelation(index)}
                              className="text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        
                        {relation.notes && (
                          <div className="mt-3 text-sm bg-gray-50 p-3 rounded">
                            <p className="font-medium mb-1">Notas:</p>
                            <p>{relation.notes}</p>
                          </div>
                        )}
                        
                        {relation.studies && relation.studies.length > 0 && (
                          <div className="mt-3">
                            <p className="font-medium mb-1">Estudos associados:</p>
                            <ul className="text-sm list-disc pl-5">
                              {relation.studies.map(studyId => (
                                <li key={studyId}>{getStudyName(studyId)}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 border rounded-md border-dashed">
                    <p className="text-muted-foreground">
                      Nenhuma relação definida. Adicione uma nova relação ou defina a categoria principal na primeira aba.
                    </p>
                  </div>
                )}
                
                {/* Formulário para Adicionar Nova Relação */}
                {showAddRelation && (
                  <Card className="mt-6">
                    <CardContent className="pt-6">
                      <h4 className="font-medium mb-4">Nova Relação</h4>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium mb-1 block">Categoria</label>
                            <Select
                              value={addRelationCategory}
                              onValueChange={setAddRelationCategory}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma categoria" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Selecione uma categoria</SelectItem>
                                {outcomes.map((outcome) => (
                                  <SelectItem key={outcome.id} value={outcome.id || ""}>
                                    {outcome.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium mb-1 block">
                              Nota de Eficácia (0-5): {addRelationEfficacy}
                            </label>
                            <div className="flex items-center gap-4">
                              <Slider
                                value={[addRelationEfficacy]}
                                min={0}
                                max={5}
                                step={1}
                                onValueChange={(values) => setAddRelationEfficacy(values[0])}
                                className="flex-1"
                              />
                              <div className="flex">
                                {renderStars(addRelationEfficacy)}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium mb-1 block">Estudos Científicos Associados</label>
                          <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                            {studies.length > 0 ? (
                              studies.map(study => (
                                <div key={study.id} className="flex items-center gap-2 py-1">
                                  <input 
                                    type="checkbox" 
                                    id={`add-study-${study.id}`} 
                                    checked={addRelationStudies.includes(study.id)} 
                                    onChange={() => toggleAddRelationStudy(study.id)}
                                    className="h-4 w-4"
                                  />
                                  <label htmlFor={`add-study-${study.id}`} className="text-sm">
                                    {study.title} ({study.year})
                                  </label>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-muted-foreground">Nenhum estudo disponível</p>
                            )}
                          </div>
                          
                          <Button type="button" variant="outline" size="sm" className="w-full mt-2 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Upload de Novos Estudos
                          </Button>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium mb-1 block">Notas sobre a Relação</label>
                          <Textarea
                            value={addRelationNotes}
                            onChange={(e) => setAddRelationNotes(e.target.value)}
                            placeholder="Adicione notas sobre esta relação"
                            className="resize-none h-20"
                          />
                        </div>
                        
                        <div className="flex justify-end gap-2 pt-2">
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={() => setShowAddRelation(false)}
                          >
                            Cancelar
                          </Button>
                          <Button 
                            type="button"
                            onClick={handleAddRelation}
                          >
                            Adicionar Relação
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
              
              <DialogFooter className="pt-4">
                <Button variant="outline" onClick={() => setActiveTab('info')}>
                  Voltar para Informações Básicas
                </Button>
                <Button onClick={handleFinish}>
                  Concluir
                </Button>
              </DialogFooter>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AddNutraceuticalDialog;
