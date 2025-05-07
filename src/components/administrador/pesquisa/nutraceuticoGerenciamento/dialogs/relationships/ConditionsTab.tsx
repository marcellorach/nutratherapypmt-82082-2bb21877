
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, Plus } from 'lucide-react';
import { NutraceuticalRelationsService } from '@/services/nutraceuticals/relations-service';

interface ConditionsTabProps {
  nutraceutical: any;
  conditions: any[];
  isLoading: boolean;
  onSuccess?: () => void;
}

const ConditionsTab: React.FC<ConditionsTabProps> = ({
  nutraceutical,
  conditions,
  isLoading,
  onSuccess
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCondition, setSelectedCondition] = useState<any | null>(null);
  const [relationshipType, setRelationshipType] = useState<'prevention' | 'treatment' | 'support'>('support');
  const [efficacyScore, setEfficacyScore] = useState<number>(3);
  const [notes, setNotes] = useState('');
  const [isAssociating, setIsAssociating] = useState(false);
  const { toast } = useToast();
  
  // Filtrar condições por termo de pesquisa
  const filteredConditions = conditions.filter(condition => 
    condition.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (condition.description && condition.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Função para associar condição ao nutracêutico
  const handleAssociateCondition = async () => {
    if (!selectedCondition || !nutraceutical?.id) {
      toast({
        title: "Erro",
        description: "Selecione uma condição para associar",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsAssociating(true);
      
      await NutraceuticalRelationsService.relateToCondition(
        nutraceutical.id,
        selectedCondition.id,
        relationshipType,
        efficacyScore,
        notes
      );
      
      toast({
        title: "Sucesso",
        description: "Condição associada com sucesso ao nutracêutico",
      });
      
      // Resetar campos
      setSelectedCondition(null);
      setRelationshipType('support');
      setEfficacyScore(3);
      setNotes('');
      
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      console.error('Erro ao associar condição:', error);
      toast({
        title: "Erro",
        description: "Não foi possível associar a condição ao nutracêutico",
        variant: "destructive"
      });
    } finally {
      setIsAssociating(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="text"
            placeholder="Pesquisar condições..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button 
          variant="outline" 
          size="sm"
          disabled // Será implementado na próxima versão
        >
          <Plus className="h-4 w-4 mr-1" /> Nova Condição
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto p-1">
        {isLoading ? (
          <div className="col-span-2 flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : filteredConditions.length === 0 ? (
          <div className="col-span-2 text-center py-8 text-gray-500">
            Nenhuma condição de saúde encontrada.
          </div>
        ) : (
          filteredConditions.map(condition => (
            <Card 
              key={condition.id} 
              className={`p-3 cursor-pointer transition-colors ${
                selectedCondition?.id === condition.id ? 'bg-blue-50 border-blue-300' : ''
              }`}
              onClick={() => setSelectedCondition(condition)}
            >
              <div className="space-y-1">
                <h4 className="font-medium text-sm">{condition.name}</h4>
                {condition.description && (
                  <div className="text-xs text-gray-500 line-clamp-2">
                    {condition.description}
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
      
      {selectedCondition && (
        <div className="border rounded-md p-3 mt-4">
          <h4 className="font-medium">Associar condição ao nutracêutico</h4>
          <p className="text-sm text-gray-500 mb-3">
            Defina como este nutracêutico se relaciona com a condição {selectedCondition?.name}.
          </p>
          
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Tipo de relação</label>
              <Select 
                value={relationshipType}
                onValueChange={(value) => setRelationshipType(value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de relação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prevention">Prevenção</SelectItem>
                  <SelectItem value="treatment">Tratamento</SelectItem>
                  <SelectItem value="support">Suporte</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Eficácia</label>
                <span className="text-sm">{efficacyScore.toFixed(1)}</span>
              </div>
              <Slider
                defaultValue={[3]}
                min={1}
                max={5}
                step={0.1}
                value={[efficacyScore]}
                onValueChange={(vals) => setEfficacyScore(vals[0])}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Baixa</span>
                <span>Alta</span>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Notas (opcional)</label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações sobre a relação"
              />
            </div>
            
            <Button 
              onClick={handleAssociateCondition} 
              className="w-full"
              disabled={isAssociating}
            >
              {isAssociating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Associar Condição
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConditionsTab;
