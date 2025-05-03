
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
import { Plus, Trash2, Info } from 'lucide-react';
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
  dosage: z.string().optional(),
  source: z.string().optional(),
  chemical_compound: z.string().optional(),
  contraindications: z.string().optional(),
});

// Tipagem para os dados do formulário
type FormData = z.infer<typeof formSchema>;

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
  const { conditions, fetchConditions } = useConditions();
  const { studies, fetchStudies } = useStudies();
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [isNewNutraceutical, setIsNewNutraceutical] = useState(true);
  const [currentNutraceutical, setCurrentNutraceutical] = useState<any>(null);
  
  // Estados para gestão de condições e estudos
  const [relatedConditions, setRelatedConditions] = useState<any[]>([]);
  const [relatedStudies, setRelatedStudies] = useState<any[]>([]);
  const [loadingRelations, setLoadingRelations] = useState(false);
  
  // Estados para o formulário de adição de condições
  const [selectedCondition, setSelectedCondition] = useState<string>('');
  const [relationshipType, setRelationshipType] = useState<'prevention' | 'treatment' | 'support'>('prevention');
  const [efficacyScore, setEfficacyScore] = useState<number>(3);
  const [conditionNotes, setConditionNotes] = useState<string>('');
  
  // Estados para o formulário de adição de estudos
  const [selectedStudy, setSelectedStudy] = useState<string>('');
  const [relevanceScore, setRelevanceScore] = useState<number>(3);
  
  useEffect(() => {
    if (open) {
      fetchOutcomes();
      fetchConditions();
      fetchStudies();
      
      setIsNewNutraceutical(!nutraceutical);
      setCurrentNutraceutical(nutraceutical);
      
      if (nutraceutical) {
        loadRelatedConditions(nutraceutical.id);
        loadRelatedStudies(nutraceutical.id);
      } else {
        setRelatedConditions([]);
        setRelatedStudies([]);
      }
      
      setActiveTab('info');
      resetConditionForm();
      resetStudyForm();
    }
  }, [open, nutraceutical]);
  
  // Carrega as condições relacionadas ao nutracêutico
  const loadRelatedConditions = async (nutraceuticalId: string) => {
    try {
      setLoadingRelations(true);
      const conditions = await NutraceuticalsService.getConditionRelations(nutraceuticalId);
      setRelatedConditions(conditions || []);
    } catch (error) {
      console.error("Erro ao carregar condições relacionadas:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as condições relacionadas",
        variant: "destructive"
      });
    } finally {
      setLoadingRelations(false);
    }
  };
  
  // Carrega os estudos relacionados ao nutracêutico
  const loadRelatedStudies = async (nutraceuticalId: string) => {
    try {
      setLoadingRelations(true);
      const studies = await NutraceuticalsService.getStudyRelations(nutraceuticalId);
      setRelatedStudies(studies || []);
    } catch (error) {
      console.error("Erro ao carregar estudos relacionados:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os estudos relacionados",
        variant: "destructive"
      });
    } finally {
      setLoadingRelations(false);
    }
  };
  
  // Inicialização do formulário
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: nutraceutical?.name || '',
      description: nutraceutical?.description || '',
      category: nutraceutical?.outcome_id || undefined, // Renomeado para category
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
        dosage: '',
        source: '',
        chemical_compound: '',
        contraindications: '',
      });
    }
  }, [nutraceutical, form]);
  
  const { isSubmitting } = form.formState;

  // Função para lidar com o envio do formulário
  const handleSubmit = async (values: FormData) => {
    setLoading(true);
    try {
      // Processamento de contraindicações
      const contraindications = values.contraindications 
        ? values.contraindications.split('\n').map(item => item.trim()).filter(Boolean)
        : [];
      
      let result;
      
      if (isNewNutraceutical) {
        // Criar novo nutracêutico
        result = await createNutraceutical({
          name: values.name,
          description: values.description || undefined,
          outcome_id: values.category || undefined, // Usando category como outcome_id
          dosage: values.dosage || undefined,
          source: values.source || undefined,
          chemical_compound: values.chemical_compound || undefined,
          contraindications: contraindications.length > 0 ? contraindications : undefined
        });
        
        toast({
          title: "Sucesso",
          description: "Nutracêutico criado com sucesso",
        });
      } else {
        // Atualizar nutracêutico existente
        result = await updateNutraceutical(nutraceutical.id, {
          name: values.name,
          description: values.description || undefined,
          outcome_id: values.category || undefined, // Usando category como outcome_id
          dosage: values.dosage || undefined,
          source: values.source || undefined,
          chemical_compound: values.chemical_compound || undefined,
          contraindications: contraindications.length > 0 ? contraindications : undefined
        });
        
        toast({
          title: "Sucesso",
          description: "Nutracêutico atualizado com sucesso",
        });
      }
      
      // Atualizar o nutracêutico atual e mudar para a aba de relações
      setCurrentNutraceutical(result);
      setIsNewNutraceutical(false);
      
      // Se é um novo nutracêutico, muda para a aba de relações
      if (isNewNutraceutical) {
        setActiveTab('relations');
      }
      
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

  // Função para adicionar uma nova relação com condição de saúde
  const handleAddCondition = async () => {
    if (!currentNutraceutical) return;
    
    if (!selectedCondition || selectedCondition === 'none') {
      toast({
        title: "Atenção",
        description: "Selecione uma condição de saúde",
        variant: "default"
      });
      return;
    }
    
    try {
      setLoading(true);
      await NutraceuticalsService.relateToCondition(
        currentNutraceutical.id,
        selectedCondition,
        relationshipType,
        efficacyScore,
        conditionNotes
      );
      
      toast({
        title: "Sucesso",
        description: "Condição de saúde associada com sucesso",
      });
      
      // Recarregar relações
      await loadRelatedConditions(currentNutraceutical.id);
      
      // Limpar formulário
      resetConditionForm();
    } catch (error) {
      console.error("Erro ao adicionar condição:", error);
      toast({
        title: "Erro",
        description: "Não foi possível associar a condição de saúde",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Função para adicionar uma nova relação com estudo científico
  const handleAddStudy = async () => {
    if (!currentNutraceutical) return;
    
    if (!selectedStudy || selectedStudy === 'none') {
      toast({
        title: "Atenção",
        description: "Selecione um estudo científico",
        variant: "default"
      });
      return;
    }
    
    try {
      setLoading(true);
      await NutraceuticalsService.relateToStudy(
        currentNutraceutical.id,
        selectedStudy,
        relevanceScore
      );
      
      toast({
        title: "Sucesso",
        description: "Estudo científico associado com sucesso",
      });
      
      // Recarregar relações
      await loadRelatedStudies(currentNutraceutical.id);
      
      // Limpar formulário
      resetStudyForm();
    } catch (error) {
      console.error("Erro ao adicionar estudo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível associar o estudo científico",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Função para remover uma relação com condição de saúde
  const handleRemoveCondition = async (relationId: string) => {
    try {
      setLoading(true);
      await NutraceuticalsService.removeConditionRelation(relationId);
      
      toast({
        title: "Sucesso",
        description: "Relação com condição removida com sucesso",
      });
      
      // Recarregar relações
      if (currentNutraceutical) {
        await loadRelatedConditions(currentNutraceutical.id);
      }
    } catch (error) {
      console.error("Erro ao remover relação com condição:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a relação com a condição",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Função para remover uma relação com estudo científico
  const handleRemoveStudy = async (relationId: string) => {
    try {
      setLoading(true);
      await NutraceuticalsService.removeStudyRelation(relationId);
      
      toast({
        title: "Sucesso",
        description: "Relação com estudo removida com sucesso",
      });
      
      // Recarregar relações
      if (currentNutraceutical) {
        await loadRelatedStudies(currentNutraceutical.id);
      }
    } catch (error) {
      console.error("Erro ao remover relação com estudo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a relação com o estudo",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Função para finalizar o processo
  const handleFinish = () => {
    // Reiniciar o formulário
    form.reset();
    resetConditionForm();
    resetStudyForm();
    
    // Notificar o componente pai
    if (onSuccess) {
      onSuccess();
    }
    
    // Fechar o diálogo
    onOpenChange(false);
  };
  
  // Resetar o formulário de condição
  const resetConditionForm = () => {
    setSelectedCondition('');
    setRelationshipType('prevention');
    setEfficacyScore(3);
    setConditionNotes('');
  };
  
  // Resetar o formulário de estudo
  const resetStudyForm = () => {
    setSelectedStudy('');
    setRelevanceScore(3);
  };
  
  // Função auxiliar para obter o nome da condição pelo ID
  const getConditionName = (conditionId: string) => {
    const condition = conditions.find(c => c.id === conditionId);
    return condition ? condition.name : 'Condição desconhecida';
  };
  
  // Função auxiliar para obter o nome do estudo pelo ID
  const getStudyName = (studyId: string) => {
    const study = studies.find(s => s.id === studyId);
    return study ? study.title : 'Estudo desconhecido';
  };
  
  // Função para obter a cor do badge de acordo com a eficácia
  const getEfficacyBadgeClass = (score: number) => {
    if (score >= 4) return "bg-green-100 text-green-800";
    if (score >= 3) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  // Função para ir para a próxima aba
  const goToNextTab = () => {
    setActiveTab('relations');
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
              Condições e Estudos
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
                
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
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
                
                <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancelar
                  </Button>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={isSubmitting || loading}>
                      {(isSubmitting || loading) ? 'Salvando...' : 'Salvar'}
                    </Button>
                    {!isNewNutraceutical && (
                      <Button type="submit" onClick={goToNextTab} variant="secondary">
                        Próximo: Condições e Estudos
                      </Button>
                    )}
                  </div>
                </DialogFooter>

                {isNewNutraceutical && (
                  <div className="text-sm text-muted-foreground mt-2 flex items-center">
                    <Info className="h-4 w-4 mr-2" />
                    Após salvar as informações básicas, você poderá adicionar condições de saúde e estudos científicos na próxima aba.
                  </div>
                )}
              </form>
            </Form>
          </TabsContent>
          
          {/* Aba de Condições e Estudos */}
          <TabsContent value="relations">
            <div className="space-y-6">
              <Alert variant="default" className="bg-blue-50 mb-6">
                <AlertCircle className="h-5 w-5" />
                <AlertTitle>Como funcionam as relações de nutracêuticos</AlertTitle>
                <AlertDescription>
                  Cada nutracêutico pode ser relacionado a múltiplas condições de saúde e estudos científicos. 
                  Para cada condição, você pode especificar o tipo de relação (prevenção, tratamento ou suporte), 
                  a eficácia e adicionar notas específicas. Os estudos científicos também podem ser associados 
                  com um score de relevância.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Seção de Condições de Saúde */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center">
                    <span>Condições de Saúde</span>
                    <Badge className="ml-2 bg-blue-100 text-blue-800 hover:bg-blue-200">
                      {relatedConditions.length}
                    </Badge>
                  </h3>
                  
                  <Card>
                    <CardContent className="pt-6 pb-4">
                      <h4 className="text-sm font-medium mb-3">Adicionar Nova Condição</h4>
                      
                      <div className="grid grid-cols-1 gap-4 mb-4">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Condição de Saúde</label>
                          <Select 
                            value={selectedCondition} 
                            onValueChange={setSelectedCondition}
                            disabled={loading}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma condição" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Selecione uma condição</SelectItem>
                              {conditions.map(condition => (
                                <SelectItem key={condition.id} value={condition.id}>
                                  {condition.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium mb-1 block">Tipo de Relação</label>
                          <Select 
                            value={relationshipType} 
                            onValueChange={(value: 'prevention' | 'treatment' | 'support') => setRelationshipType(value)}
                            disabled={loading}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="prevention">Prevenção</SelectItem>
                              <SelectItem value="treatment">Tratamento</SelectItem>
                              <SelectItem value="support">Suporte</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      
                        <div>
                          <label className="text-sm font-medium mb-1 block">
                            Eficácia (1-5): {efficacyScore}
                          </label>
                          <Slider
                            value={[efficacyScore]}
                            min={1}
                            max={5}
                            step={1}
                            onValueChange={(values) => setEfficacyScore(values[0])}
                            disabled={loading}
                            className="py-4"
                          />
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium mb-1 block">Notas sobre a Relação</label>
                          <Textarea
                            value={conditionNotes}
                            onChange={(e) => setConditionNotes(e.target.value)}
                            placeholder="Adicione notas sobre esta relação entre nutracêutico e condição"
                            disabled={loading}
                            className="resize-none h-20"
                          />
                        </div>
                      </div>
                      
                      <Button 
                        onClick={handleAddCondition} 
                        disabled={loading || !currentNutraceutical}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Condição
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <div className="overflow-y-auto max-h-[300px] pr-1">
                    {loadingRelations ? (
                      <div className="text-center py-4">Carregando relações...</div>
                    ) : relatedConditions.length > 0 ? (
                      <div className="space-y-3">
                        {relatedConditions.map((relation) => (
                          <div key={relation.id} className="border rounded-md p-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{getConditionName(relation.condition_id)}</h4>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  <Badge className="whitespace-nowrap">
                                    {relation.relationship_type === 'prevention' ? 'Prevenção' : 
                                    relation.relationship_type === 'treatment' ? 'Tratamento' : 'Suporte'}
                                  </Badge>
                                  <Badge className={getEfficacyBadgeClass(relation.efficacy_score)}>
                                    Eficácia: {relation.efficacy_score}
                                  </Badge>
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleRemoveCondition(relation.id)}
                                disabled={loading}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                title="Remover relação"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            {relation.notes && (
                              <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                <p className="font-medium text-xs mb-1 text-gray-500">Notas:</p>
                                {relation.notes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 border rounded-md border-dashed">
                        <p className="text-muted-foreground">
                          Nenhuma condição de saúde associada. 
                          <br />Adicione a primeira condição acima.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Seção de Estudos Científicos */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center">
                    <span>Estudos Científicos</span>
                    <Badge className="ml-2 bg-blue-100 text-blue-800 hover:bg-blue-200">
                      {relatedStudies.length}
                    </Badge>
                  </h3>
                  
                  <Card>
                    <CardContent className="pt-6 pb-4">
                      <h4 className="text-sm font-medium mb-3">Adicionar Novo Estudo</h4>
                      
                      <div className="grid grid-cols-1 gap-4 mb-4">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Estudo Científico</label>
                          <Select 
                            value={selectedStudy} 
                            onValueChange={setSelectedStudy}
                            disabled={loading}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um estudo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Selecione um estudo</SelectItem>
                              {studies.map(study => (
                                <SelectItem key={study.id} value={study.id}>
                                  {study.title} ({study.year})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium mb-1 block">
                            Relevância (1-5): {relevanceScore}
                          </label>
                          <Slider
                            value={[relevanceScore]}
                            min={1}
                            max={5}
                            step={1}
                            onValueChange={(values) => setRelevanceScore(values[0])}
                            disabled={loading}
                            className="py-4"
                          />
                        </div>
                      </div>
                      
                      <Button 
                        onClick={handleAddStudy} 
                        disabled={loading || !currentNutraceutical}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Estudo
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <div className="overflow-y-auto max-h-[300px] pr-1">
                    {loadingRelations ? (
                      <div className="text-center py-4">Carregando estudos...</div>
                    ) : relatedStudies.length > 0 ? (
                      <div className="space-y-3">
                        {relatedStudies.map((relation) => (
                          <div key={relation.id} className="border rounded-md p-3">
                            <div className="flex justify-between items-start">
                              <div className="pr-2">
                                <h4 className="font-medium line-clamp-2">{getStudyName(relation.study_id)}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge className={getEfficacyBadgeClass(relation.relevance_score)}>
                                    Relevância: {relation.relevance_score}
                                  </Badge>
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleRemoveStudy(relation.id)}
                                disabled={loading}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                                title="Remover relação"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 border rounded-md border-dashed">
                        <p className="text-muted-foreground">
                          Nenhum estudo científico associado.
                          <br />Adicione o primeiro estudo acima.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
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
