
import React, { useState, useEffect } from 'react';
import { useStudies } from '@/hooks/nutraceuticals/useStudies';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { FileText, Loader2, Search, ExternalLink, Download, Plus } from 'lucide-react';
import AddScientificStudyDialog from '../AddScientificStudyDialog';

interface StudiesTabProps {
  nutraceutical: any;
  studies: any[];
  isLoading: boolean;
  onSuccess?: () => void;
}

const StudiesTab: React.FC<StudiesTabProps> = ({
  nutraceutical,
  studies: allStudies,
  isLoading: isLoadingProp,
  onSuccess
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudy, setSelectedStudy] = useState<any | null>(null);
  const [relevanceScore, setRelevanceScore] = useState<number>(4);
  const [isAssociating, setIsAssociating] = useState(false);
  const { associateStudyToNutraceutical, getStudyFileUrl } = useStudies();
  const { toast } = useToast();
  const [isAddStudyDialogOpen, setIsAddStudyDialogOpen] = useState(false);
  const [studiesRefreshKey, setStudiesRefreshKey] = useState(0);
  
  // Filtrar estudos por termo de pesquisa
  const filteredStudies = allStudies.filter(study => 
    study.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (study.journal && study.journal.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Função para associar estudo ao nutracêutico
  const handleAssociateStudy = async () => {
    if (!selectedStudy || !nutraceutical?.id) {
      toast({
        title: "Erro",
        description: "Selecione um estudo para associar",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsAssociating(true);
      console.log('Associando estudo ao nutracêutico:', {
        studyId: selectedStudy.id,
        nutraceuticalId: nutraceutical.id,
        relevanceScore
      });
      
      await associateStudyToNutraceutical(
        selectedStudy.id,
        nutraceutical.id,
        relevanceScore
      );
      
      toast({
        title: "Sucesso",
        description: "Estudo associado com sucesso ao nutracêutico",
      });
      
      setSelectedStudy(null);
      setRelevanceScore(4);
      
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      console.error('Erro ao associar estudo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível associar o estudo ao nutracêutico",
        variant: "destructive"
      });
    } finally {
      setIsAssociating(false);
    }
  };
  
  // Handler para quando um novo estudo é criado
  const handleStudyCreated = () => {
    setIsAddStudyDialogOpen(false);
    // Recarregar estudos
    setStudiesRefreshKey(prev => prev + 1);
    if (onSuccess) {
      onSuccess();
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="text"
            placeholder="Pesquisar estudos..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setIsAddStudyDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-1" /> Novo Estudo
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto p-1">
        {isLoadingProp ? (
          <div className="col-span-2 flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : filteredStudies.length === 0 ? (
          <div className="col-span-2 text-center py-8 text-gray-500">
            Nenhum estudo científico encontrado.
          </div>
        ) : (
          filteredStudies.map(study => (
            <Card 
              key={study.id} 
              className={`p-3 cursor-pointer transition-colors ${
                selectedStudy?.id === study.id ? 'bg-blue-50 border-blue-300' : ''
              }`}
              onClick={() => setSelectedStudy(study)}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1 flex-1">
                  <h4 className="font-medium text-sm line-clamp-2">{study.title}</h4>
                  <div className="text-xs text-gray-500">
                    {study.journal && (
                      <div className="line-clamp-1">{study.journal}, {study.year}</div>
                    )}
                    {!study.journal && study.year && (
                      <div>Publicado em {study.year}</div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {study.link && (
                    <a 
                      href={study.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span className="sr-only">Link para o estudo</span>
                    </a>
                  )}
                  
                  {study.file_path && (
                    <a 
                      href={getStudyFileUrl(study.file_path)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-green-600 hover:text-green-800"
                    >
                      <Download className="h-4 w-4" />
                      <span className="sr-only">Download do estudo</span>
                    </a>
                  )}
                </div>
              </div>
              
              {study.file_path && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500">
                  <FileText className="h-3 w-3" />
                  <span className="truncate">
                    {study.file_name || "Arquivo disponível"}
                  </span>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
      
      {selectedStudy && (
        <div className="border rounded-md p-3 mt-4">
          <h4 className="font-medium">Associar estudo ao nutracêutico</h4>
          <p className="text-sm text-gray-500 mb-3">
            Defina a relevância deste estudo para o nutracêutico {nutraceutical?.name}.
          </p>
          
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <Label>Relevância do estudo</Label>
                <span className="text-sm font-medium">{relevanceScore.toFixed(1)}</span>
              </div>
              <Slider
                defaultValue={[4]}
                min={1}
                max={5}
                step={0.1}
                value={[relevanceScore]}
                onValueChange={(vals) => setRelevanceScore(vals[0])}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Baixa</span>
                <span>Alta</span>
              </div>
            </div>
            
            <Button 
              onClick={handleAssociateStudy} 
              className="w-full"
              disabled={isAssociating}
            >
              {isAssociating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Associar Estudo
            </Button>
          </div>
        </div>
      )}
      
      <AddScientificStudyDialog
        open={isAddStudyDialogOpen}
        onOpenChange={setIsAddStudyDialogOpen}
        onSuccess={handleStudyCreated}
        nutraceuticalId={nutraceutical?.id}
      />
    </div>
  );
};

export default StudiesTab;
