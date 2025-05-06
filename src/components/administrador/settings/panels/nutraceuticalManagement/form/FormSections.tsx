
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import StudiesDropZone from '../StudiesDropZone';
import { FormSectionsProps } from './types';

export const BasicInfoSection: React.FC<Pick<FormSectionsProps, 'formData' | 'handleFormChange'>> = ({
  formData,
  handleFormChange
}) => (
  <>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleFormChange}
          placeholder="Nome do nutracêutico"
          autoComplete="off"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="dosage">Dosagem (mg/10kg de peso)</Label>
        <Input
          id="dosage"
          name="dosage"
          value={formData.dosage}
          onChange={handleFormChange}
          placeholder="Ex: 100mg/10kg de peso"
          autoComplete="off"
        />
        <p className="text-xs text-muted-foreground">
          Informe a dosagem em mg por 10kg de peso do animal. Valores decimais são permitidos (ex: 0,25).
        </p>
      </div>
    </div>
    
    <div className="space-y-2">
      <Label htmlFor="source">Fonte</Label>
      <Input
        id="source"
        name="source"
        value={formData.source}
        onChange={handleFormChange}
        placeholder="Ex: Curcuma longa"
        autoComplete="off"
      />
    </div>
    
    <div className="space-y-2">
      <Label htmlFor="chemical_compound">Composto químico</Label>
      <Input
        id="chemical_compound"
        name="chemical_compound"
        value={formData.chemical_compound}
        onChange={handleFormChange}
        placeholder="Ex: Curcumina"
        autoComplete="off"
      />
    </div>
    
    <div className="space-y-2">
      <Label htmlFor="description">Descrição</Label>
      <Textarea
        id="description"
        name="description"
        value={formData.description}
        onChange={handleFormChange}
        placeholder="Breve descrição do nutracêutico"
        className="min-h-[80px]"
      />
    </div>
    
    <div className="space-y-2">
      <Label htmlFor="contraindications">Contraindicações (uma por linha)</Label>
      <Textarea
        id="contraindications"
        name="contraindications"
        value={formData.contraindications}
        onChange={handleFormChange}
        placeholder="Lista de contraindicações ou efeitos colaterais"
        className="min-h-[80px]"
      />
    </div>
  </>
);

export const RelationshipSection: React.FC<FormSectionsProps> = ({
  formData,
  handleOutcomeChange,
  handleEfficacyChange,
  handleAddRelation,
  outcomes,
  studies,
  studiesLoading,
  selectedStudies,
  handleStudiesDropped,
  handleFormChange
}) => (
  <div className="space-y-4 pt-4 border-t">
    <h3 className="font-medium">Relação com Outcomes e Estudos</h3>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="outcome">Outcome</Label>
        <Select 
          value={formData.outcome_id} 
          onValueChange={handleOutcomeChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione um outcome" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="no_outcome">
              Sem outcome
            </SelectItem>
            {outcomes?.map(outcome => (
              <SelectItem key={outcome.id} value={outcome.id}>
                {outcome.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="efficacy_score">Eficácia ({formData.efficacy_score}/5)</Label>
        <Slider
          id="efficacy_score"
          value={[formData.efficacy_score]}
          min={1}
          max={5}
          step={0.5}
          onValueChange={handleEfficacyChange}
        />
      </div>
    </div>
    
    <div className="space-y-2">
      <Label>Estudos Relacionados</Label>
      <StudiesDropZone 
        studies={studies} 
        selectedStudies={selectedStudies}
        onStudiesDropped={handleStudiesDropped}
        loading={studiesLoading}
      />
    </div>
    
    <div className="space-y-2">
      <Label htmlFor="notes">Notas ou observações</Label>
      <Textarea
        id="notes"
        name="notes"
        value={formData.notes}
        onChange={handleFormChange}
        placeholder="Observações sobre esta relação"
        className="min-h-[80px]"
      />
    </div>
    
    <Button 
      type="button" 
      variant="outline" 
      onClick={handleAddRelation}
      disabled={!formData.outcome_id || formData.outcome_id === "no_outcome"}
      className="w-full"
    >
      Adicionar relação
    </Button>
  </div>
);

export const RelationsList: React.FC<{
  relations: any[];
  handleRemoveRelation: (index: number) => void;
}> = ({ relations, handleRemoveRelation }) => {
  if (relations.length === 0) return null;
  
  return (
    <div className="border rounded-md p-3 space-y-2">
      <h4 className="font-medium text-sm">Relações adicionais</h4>
      
      {relations.map((relation, index) => (
        <div key={index} className="flex items-center justify-between bg-slate-50 p-2 rounded">
          <div>
            <span className="font-medium">{relation.outcome_name}</span>
            <div className="text-xs text-muted-foreground">
              Eficácia: {relation.efficacy_score}/5
              {relation.study_name && ` • Estudo: ${relation.study_name}`}
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => handleRemoveRelation(index)}
            className="h-6 w-6"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  );
};
