
import React from 'react';
import { FormDialogProps } from "../types";
import { FormInputField, FormSelectField, FormTextareaField } from "@/components/administrador/settings/FormDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";

const DialogFormContent: React.FC<Omit<FormDialogProps, 'isOpen' | 'setIsOpen' | 'submitAction'>> = ({
  isCreate,
  formData,
  handleFormChange,
  handleOutcomeChange,
  handleEfficacyChange,
  handleStudyChange,
  handleAddRelation,
  handleRemoveRelation,
  relations,
  studies,
  outcomes,
  studiesLoading,
  selectedStudies
}) => {
  return (
    <Tabs defaultValue="info" className="w-full">
      <TabsList className="grid grid-cols-2">
        <TabsTrigger value="info">Informações Básicas</TabsTrigger>
        <TabsTrigger value="relations">Relações</TabsTrigger>
      </TabsList>
      
      {/* Aba de informações básicas */}
      <TabsContent value="info" className="space-y-4 py-4">
        <FormInputField 
          label="Nome do Nutracêutico"
          value={formData.name}
          onChange={(e) => handleFormChange('name', e.target.value)}
          placeholder="Ex: Resveratrol, Ômega-3"
        />
        
        <FormTextareaField 
          label="Descrição"
          value={formData.description || ''}
          onChange={(e) => handleFormChange('description', e.target.value)}
          placeholder="Descreva o nutracêutico e suas principais propriedades"
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInputField 
            label="Fonte"
            value={formData.source || ''}
            onChange={(e) => handleFormChange('source', e.target.value)}
            placeholder="Ex: Uvas, chá verde"
          />
          
          <FormInputField 
            label="Dosagem"
            value={formData.dosage || ''}
            onChange={(e) => handleFormChange('dosage', e.target.value)}
            placeholder="Ex: 500mg/dia"
          />
        </div>
        
        <FormInputField 
          label="Composto Químico"
          value={formData.chemical_compound || ''}
          onChange={(e) => handleFormChange('chemical_compound', e.target.value)}
          placeholder="Ex: C14H12O3"
        />
        
        <FormTextareaField 
          label="Contraindicações"
          value={formData.contraindications ? formData.contraindications.join('\n') : ''}
          onChange={(e) => handleFormChange('contraindications', e.target.value.split('\n').filter(Boolean))}
          placeholder="Uma contraindicação por linha"
        />
      </TabsContent>
      
      {/* Aba de relações */}
      <TabsContent value="relations" className="space-y-6 py-4">
        {relations.map((relation, index) => (
          <div key={`relation-${index}`} className="rounded-md border p-4 space-y-4 relative">
            {index > 0 && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="absolute top-2 right-2 h-8 w-8 text-red-500"
                onClick={(e) => handleRemoveRelation(index, e)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            
            <h3 className="font-medium">
              {index === 0 ? 'Relação Principal' : `Relação ${index + 1}`}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor={`outcome-${index}`} className="text-sm font-medium">
                  Categoria / Outcome
                </label>
                <select
                  id={`outcome-${index}`}
                  value={relation.outcome_id || 'none'}
                  onChange={(e) => handleOutcomeChange(index, e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="none">Selecione uma categoria</option>
                  {outcomes.map(outcome => (
                    <option key={outcome.id} value={outcome.id}>
                      {outcome.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  Nível de Eficácia: {relation.efficacy_score}
                </label>
                <div className="pt-5">
                  <Slider
                    value={[relation.efficacy_score]}
                    min={0}
                    max={5}
                    step={1}
                    onValueChange={(values) => handleEfficacyChange(index, values[0])}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>0</span>
                    <span>1</span>
                    <span>2</span>
                    <span>3</span>
                    <span>4</span>
                    <span>5</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor={`notes-${index}`} className="text-sm font-medium">
                Notas / Observações
              </label>
              <textarea
                id={`notes-${index}`}
                value={relation.notes || ''}
                onChange={(e) => {
                  const newRelations = [...relations];
                  newRelations[index] = {
                    ...newRelations[index],
                    notes: e.target.value
                  };
                  // Atualizar relações
                }}
                placeholder="Observações sobre esta relação"
                className="w-full border rounded px-3 py-2 min-h-[80px]"
              />
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Estudos Relacionados</h4>
              <Card>
                <CardContent className="p-3 max-h-[200px] overflow-y-auto">
                  {studiesLoading ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  ) : studies.length === 0 ? (
                    <div className="text-center py-3 text-sm text-muted-foreground">
                      Não há estudos disponíveis
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {studies.map(study => (
                        <div key={study.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`study-${study.id}-${index}`}
                            checked={selectedStudies[index]?.includes(study.id) || false}
                            onChange={(e) => handleStudyChange(index, study.id, e.target.checked)}
                            className="h-4 w-4"
                          />
                          <label 
                            htmlFor={`study-${study.id}-${index}`} 
                            className="text-sm cursor-pointer flex-1"
                          >
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
          </div>
        ))}
        
        <Button 
          type="button" 
          variant="outline" 
          className="w-full"
          onClick={handleAddRelation}
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar nova relação
        </Button>
      </TabsContent>
    </Tabs>
  );
};

export default DialogFormContent;
