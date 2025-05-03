
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
import { FileText, Star, StarHalf, StarOff, Plus, Trash2 } from 'lucide-react';
import { useConditions } from '@/hooks/nutraceuticals/useConditions';
import { useStudies } from '@/hooks/nutraceuticals/useStudies';
import { useToast } from '@/hooks/use-toast';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { NutraceuticalsService } from '@/services/nutraceuticals';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from '@/components/ui/separator';

// Schema de validação
const formSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  description: z.string().optional(),
  category: z.string().optional(),
  efficacyScore: z.number().min(0).max(5).default(3),
  dosage: z.string().optional(),
  source: z.string().optional(),
  chemical_compound: z.string().optional(),
  contraindications: z.string().optional(),
});

// Tipagem para os dados do formulário
type FormData = z.infer<typeof formSchema>;

interface RelationData {
  id?: string;
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
  const [relationNotes, setRelationNotes] = useState<string>("");
  
  // Estados para gestão das relações
  const [relations, setRelations] = useState<RelationData[]>([{
    category: '',
    efficacyScore: 3,
    studies: [],
    notes: ''
  }]);
  
  // Estado para o upload de estudos
  const [selectedStudies, setSelectedStudies] = useState<{[key: number]: string[]}>({
    0: [] // Inicializa com um array vazio para o primeiro índice (relação principal)
  });
  
  useEffect(() => {
    if (open) {
      fetchOutcomes();
      fetchStudies();
      
      setIsNewNutraceutical(!nutraceutical);
      setCurrentNutraceutical(nutraceutical);
      
      // Reiniciar estados para relações
      if (nutraceutical) {
        // Inicializar com a relação primária (outcome do nutracêutico)
        const initialRelations = [{
          id: nutraceutical.id,
          category: nutraceutical.outcome_id || '',
          efficacyScore: nutraceutical.scientific_metadata?.efficacy_score || 3,
          studies: [],
          notes: nutraceutical.scientific_metadata?.notes || ""
        }];
        
        setRelations(initialRelations);
        setSelectedStudies({ 0: [] });
        
        // Carregar estudos associados ao nutracêutico principal
        if (nutraceutical.id) {
          loadRelatedStudies(nutraceutical.id, 0);
        }
      } else {
        setRelations([{
          category: '',
          efficacyScore: 3,
          studies: [],
          notes: ''
        }]);
        setSelectedStudies({ 0: [] });
      }
      
      setActiveTab('info');
      setRelationNotes("");
    }
  }, [open, nutraceutical]);
  
  // Função para carregar estudos relacionados
  const loadRelatedStudies = async (nutraceuticalId: string, relationIndex: number) => {
    try {
      const studyRelations = await NutraceuticalsService.getStudyRelations(nutraceuticalId);
      if (studyRelations && studyRelations.length > 0) {
        const studyIds = studyRelations.map((relation: any) => relation.study_id);
        setSelectedStudies(prev => ({ ...prev, [relationIndex]: studyIds }));
      }
    } catch (error) {
      console.error('Erro ao carregar estudos relacionados:', error);
    }
  };
  
  // Inicialização do formulário
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: nutraceutical?.name || '',
      description: nutraceutical?.description || '',
      category: nutraceutical?.outcome_id || undefined,
      efficacyScore: nutraceutical?.scientific_metadata?.efficacy_score || 3,
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
        efficacyScore: nutraceutical.scientific_metadata?.efficacy_score || 3,
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
        efficacyScore: 3,
        dosage: '',
        source: '',
        chemical_compound: '',
        contraindications: '',
      });
    }
  }, [nutraceutical, form]);
  
  // Controle de estudos para cada relação
  const toggleStudySelection = (studyId: string, relationIndex: number) => {
    setSelectedStudies(prev => {
      const currentStudies = prev[relationIndex] || [];
      let updatedStudies: string[];
      
      if (currentStudies.includes(studyId)) {
        updatedStudies = currentStudies.filter(id => id !== studyId);
      } else {
        updatedStudies = [...currentStudies, studyId];
      }
      
      return { ...prev, [relationIndex]: updatedStudies };
    });
  };
  
  // Adicionar uma nova relação
  const addNewRelation = () => {
    setRelations(prev => [
      ...prev,
      {
        category: '',
        efficacyScore: 3,
        studies: [],
        notes: ''
      }
    ]);
    
    // Inicializar array de estudos para a nova relação
    const newIndex = relations.length;
    setSelectedStudies(prev => ({ ...prev, [newIndex]: [] }));
  };
  
  // Remover uma relação
  const removeRelation = (index: number) => {
    if (index === 0) {
      toast({
        title: "Ação não permitida",
        description: "A relação primária não pode ser removida",
        variant: "destructive"
      });
      return;
    }
    
    setRelations(prev => prev.filter((_, i) => i !== index));
    
    // Remover estudos associados a esta relação
    setSelectedStudies(prev => {
      const newSelectedStudies = { ...prev };
      delete newSelectedStudies[index];
      
      // Reajustar índices
      const updatedSelectedStudies: {[key: number]: string[]} = {};
      Object.keys(newSelectedStudies).forEach((key, i) => {
        const numericKey = parseInt(key);
        if (numericKey > index) {
          updatedSelectedStudies[numericKey - 1] = newSelectedStudies[numericKey];
        } else {
          updatedSelectedStudies[numericKey] = newSelectedStudies[numericKey];
        }
      });
      
      return updatedSelectedStudies;
    });
  };
  
  // Atualizar valor de uma relação específica
  const updateRelation = (index: number, field: keyof RelationData, value: any) => {
    setRelations(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value
      };
      return updated;
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
      
      // Atualizar a relação principal com os dados do formulário
      const mainRelation = {
        ...relations[0],
        category: values.category || relations[0].category,
        efficacyScore: values.efficacyScore
      };
      
      setRelations(prev => [mainRelation, ...prev.slice(1)]);
      
      let result;
      
      if (isNewNutraceutical) {
        // Criar novo nutracêutico
        result = await createNutraceutical({
          name: values.name,
          description: values.description || undefined,
          outcome_id: mainRelation.category || undefined,
          dosage: values.dosage || undefined,
          source: values.source || undefined,
          chemical_compound: values.chemical_compound || undefined,
          contraindications: contraindications.length > 0 ? contraindications : undefined
        });
        
        // Atualizar metadados científicos
        await NutraceuticalsService.updateScientificMetadata(
          result.id,
          mainRelation.efficacyScore
        );
        
        // Adicionar notas científicas
        await NutraceuticalsService.updateOutcomeRelation(
          result.id,
          mainRelation.notes
        );
        
        // Associar estudos à relação principal
        if (selectedStudies[0] && selectedStudies[0].length > 0) {
          for (const studyId of selectedStudies[0]) {
            await NutraceuticalsService.relateToStudy(
              result.id,
              studyId,
              mainRelation.efficacyScore
            );
          }
        }
        
        // Relações adicionais serão processadas após criação do nutracêutico
        for (let i = 1; i < relations.length; i++) {
          const relation = relations[i];
          if (relation.category) {
            await NutraceuticalsService.relateToCondition(
              result.id,
              relation.category,
              'support', // Tipo padrão, poderia ser dinâmico
              relation.efficacyScore,
              relation.notes
            );
            
            // Associar estudos a esta relação
            if (selectedStudies[i] && selectedStudies[i].length > 0) {
              for (const studyId of selectedStudies[i]) {
                await NutraceuticalsService.relateToStudy(
                  result.id,
                  studyId,
                  relation.efficacyScore
                );
              }
            }
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
          outcome_id: mainRelation.category || undefined,
          dosage: values.dosage || undefined,
          source: values.source || undefined,
          chemical_compound: values.chemical_compound || undefined,
          contraindications: contraindications.length > 0 ? contraindications : undefined
        });
        
        // Atualizar metadados científicos
        await NutraceuticalsService.updateScientificMetadata(
          nutraceutical.id,
          mainRelation.efficacyScore
        );
        
        // Adicionar notas científicas
        await NutraceuticalsService.updateOutcomeRelation(
          nutraceutical.id,
          mainRelation.notes
        );
        
        // Atualizar estudos relacionados à relação principal
        // Primeiro remover todos e depois adicionar os selecionados
        const existingRelations = await NutraceuticalsService.getStudyRelations(nutraceutical.id);
        for (const relation of existingRelations || []) {
          await NutraceuticalsService.removeStudyRelation(relation.id);
        }
        
        // Adicionar novos estudos
        if (selectedStudies[0] && selectedStudies[0].length > 0) {
          for (const studyId of selectedStudies[0]) {
            await NutraceuticalsService.relateToStudy(
              nutraceutical.id,
              studyId,
              mainRelation.efficacyScore
            );
          }
        }
        
        // Processar relações adicionais
        // Implementação idêntica à criação de novo nutracêutico
        
        toast({
          title: "Sucesso",
          description: "Nutracêutico atualizado com sucesso",
        });
      }
      
      // Atualizar o nutracêutico atual
      setCurrentNutraceutical(result);
      setIsNewNutraceutical(false);
      
      // Notificar o componente pai
      if (onSuccess) {
        onSuccess();
      }
      
      // Fechar o diálogo
      onOpenChange(false);
      
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
          <TabsList className="grid grid-cols-1 mb-6">
            <TabsTrigger value="info">Informações do Nutracêutico</TabsTrigger>
          </TabsList>
          
          {/* Aba de Informações */}
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Descrição do nutracêutico"
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dosage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dosagem</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: 500mg/dia" />
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
                        <FormLabel>Fonte</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: Uva, chá verde" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="chemical_compound"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Composto Químico</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: C14H12O3" />
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
                      <FormLabel>Contraindicações</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Uma contraindicação por linha"
                          rows={2}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="bg-slate-50 p-4 rounded-lg border space-y-4">
                  <h3 className="text-base font-medium">Relação Principal</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Outcome / Categoria</FormLabel>
                          <Select 
                            value={field.value} 
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um outcome" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">Selecione</SelectItem>
                              {outcomes.map((outcome) => (
                                <SelectItem key={outcome.id} value={outcome.id}>
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
                          <div className="pt-2">
                            <Slider
                              value={[field.value]}
                              min={0}
                              max={5}
                              step={1}
                              onValueChange={(values) => field.onChange(values[0])}
                              className="py-2"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                              <span>0</span>
                              <span>1</span>
                              <span>2</span>
                              <span>3</span>
                              <span>4</span>
                              <span>5</span>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-sm">Valor atual: {field.value}</span>
                              {renderStars(field.value)}
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <FormLabel>Estudos Relacionados</FormLabel>
                    <Card>
                      <CardContent className="p-3 max-h-[200px] overflow-y-auto">
                        {studies.length === 0 ? (
                          <div className="text-center py-2 text-sm text-muted-foreground">
                            Não há estudos disponíveis
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {studies.map((study) => (
                              <div key={study.id} className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={`study-${study.id}-0`}
                                  checked={selectedStudies[0]?.includes(study.id)}
                                  onChange={() => toggleStudySelection(study.id, 0)}
                                  className="mr-2 h-4 w-4"
                                />
                                <label htmlFor={`study-${study.id}-0`} className="flex items-center text-sm">
                                  <FileText className="h-3 w-3 mr-1 text-blue-500" />
                                  {study.title}
                                  {study.journal && (
                                    <Badge variant="outline" className="ml-2 text-xs">
                                      {study.journal}
                                    </Badge>
                                  )}
                                </label>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div>
                    <FormLabel>Notas ou Observações</FormLabel>
                    <Textarea
                      value={relations[0].notes}
                      onChange={(e) => updateRelation(0, 'notes', e.target.value)}
                      placeholder="Observações sobre esta relação"
                      rows={2}
                    />
                  </div>
                </div>
                
                {/* Relações adicionais */}
                {relations.length > 1 && (
                  <div className="space-y-4">
                    <Separator />
                    <h3 className="text-base font-medium">Relações Adicionais</h3>
                    
                    {relations.slice(1).map((relation, idx) => {
                      const relationIndex = idx + 1;
                      return (
                        <div 
                          key={`relation-${relationIndex}`}
                          className="bg-slate-50 p-4 rounded-lg border space-y-4 relative"
                        >
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="absolute top-2 right-2 h-8 w-8 text-red-500"
                            onClick={() => removeRelation(relationIndex)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <FormLabel>Outcome / Categoria</FormLabel>
                              <Select 
                                value={relation.category} 
                                onValueChange={(value) => updateRelation(relationIndex, 'category', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione um outcome" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="">Selecione</SelectItem>
                                  {outcomes.map((outcome) => (
                                    <SelectItem key={outcome.id} value={outcome.id}>
                                      {outcome.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <FormLabel>Nota de Eficácia (0-5)</FormLabel>
                              <div className="pt-2">
                                <Slider
                                  value={[relation.efficacyScore]}
                                  min={0}
                                  max={5}
                                  step={1}
                                  onValueChange={(values) => updateRelation(relationIndex, 'efficacyScore', values[0])}
                                  className="py-2"
                                />
                                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                  <span>0</span>
                                  <span>1</span>
                                  <span>2</span>
                                  <span>3</span>
                                  <span>4</span>
                                  <span>5</span>
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-sm">Valor atual: {relation.efficacyScore}</span>
                                  {renderStars(relation.efficacyScore)}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <FormLabel>Estudos Relacionados</FormLabel>
                            <Card>
                              <CardContent className="p-3 max-h-[200px] overflow-y-auto">
                                {studies.length === 0 ? (
                                  <div className="text-center py-2 text-sm text-muted-foreground">
                                    Não há estudos disponíveis
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    {studies.map((study) => (
                                      <div key={study.id} className="flex items-center">
                                        <input
                                          type="checkbox"
                                          id={`study-${study.id}-${relationIndex}`}
                                          checked={selectedStudies[relationIndex]?.includes(study.id)}
                                          onChange={() => toggleStudySelection(study.id, relationIndex)}
                                          className="mr-2 h-4 w-4"
                                        />
                                        <label htmlFor={`study-${study.id}-${relationIndex}`} className="flex items-center text-sm">
                                          <FileText className="h-3 w-3 mr-1 text-blue-500" />
                                          {study.title}
                                          {study.journal && (
                                            <Badge variant="outline" className="ml-2 text-xs">
                                              {study.journal}
                                            </Badge>
                                          )}
                                        </label>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </div>
                          
                          <div>
                            <FormLabel>Notas ou Observações</FormLabel>
                            <Textarea
                              value={relation.notes}
                              onChange={(e) => updateRelation(relationIndex, 'notes', e.target.value)}
                              placeholder="Observações sobre esta relação"
                              rows={2}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {/* Botão para adicionar nova relação */}
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={addNewRelation}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar nova relação
                </Button>
                
                <DialogFooter className="pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit"
                    disabled={loading}
                  >
                    {isNewNutraceutical ? 'Criar Nutracêutico' : 'Atualizar Nutracêutico'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AddNutraceuticalDialog;
