import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Loader2 } from 'lucide-react';

interface EditRelevanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  relation: any;
  onSave: (relationId: string, newScore: number) => Promise<void>;
}

const EditRelevanceDialog: React.FC<EditRelevanceDialogProps> = ({
  isOpen,
  onClose,
  relation,
  onSave
}) => {
  const [relevanceScore, setRelevanceScore] = useState<number>(3);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (relation) {
      setRelevanceScore(relation.relevance_score || 3);
    }
  }, [relation]);

  const handleSave = async () => {
    if (!relation) return;
    
    setIsSaving(true);
    try {
      await onSave(relation.id, relevanceScore);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar relevância:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const studyTitle = relation?.study?.title || 'Estudo';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Relevância do Estudo</DialogTitle>
          <DialogDescription className="text-sm break-words">
            {studyTitle}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label>Relevância ({relevanceScore}/5)</Label>
            <Slider
              value={[relevanceScore]}
              min={1}
              max={5}
              step={1}
              onValueChange={(value) => setRelevanceScore(value[0])}
              disabled={isSaving}
              className="py-2"
            />
            
            {/* Indicadores visuais */}
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(score => (
                <div
                  key={score}
                  className={`h-3 flex-1 rounded-sm transition-colors ${
                    score <= relevanceScore
                      ? 'bg-purple-500' 
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground bg-slate-50 p-3 rounded-md">
            <p className="font-medium mb-2">Escala de Relevância:</p>
            <ul className="space-y-1 text-xs">
              <li>• <strong>5:</strong> Evidência direta e robusta para o nutracêutico</li>
              <li>• <strong>4:</strong> Evidência forte com boa aplicabilidade</li>
              <li>• <strong>3:</strong> Evidência moderada ou indireta</li>
              <li>• <strong>2:</strong> Evidência fraca ou limitada</li>
              <li>• <strong>1:</strong> Evidência mínima ou tangencial</li>
            </ul>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Alterações'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditRelevanceDialog;
