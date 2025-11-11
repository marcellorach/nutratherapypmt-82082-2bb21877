
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface VeterinaryTargetCRUDDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  condition: any | null;
  onSuccess: () => void;
}

const VeterinaryTargetCRUDDialog: React.FC<VeterinaryTargetCRUDDialogProps> = ({
  open,
  onOpenChange,
  condition,
  onSuccess
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    severity_level: 'moderate'
  });

  useEffect(() => {
    if (condition) {
      setFormData({
        name: condition.name || '',
        description: condition.description || '',
        category: condition.category || '',
        severity_level: condition.severity_level || 'moderate'
      });
    } else {
      setFormData({
        name: '',
        description: '',
        category: '',
        severity_level: 'moderate'
      });
    }
  }, [condition, open]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe o nome da condição.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      if (condition) {
        // Update
        const { error } = await supabase
          .from('health_conditions')
          .update(formData)
          .eq('id', condition.id);

        if (error) throw error;

        toast({
          title: "Condição atualizada",
          description: "A condição foi atualizada com sucesso.",
        });
      } else {
        // Create
        const { error } = await supabase
          .from('health_conditions')
          .insert([formData]);

        if (error) throw error;

        toast({
          title: "Condição criada",
          description: "A nova condição foi criada com sucesso.",
        });
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {condition ? 'Editar Condição' : 'Nova Condição'}
          </DialogTitle>
          <DialogDescription>
            {condition 
              ? 'Atualize as informações da condição de saúde veterinária.'
              : 'Adicione uma nova condição de saúde veterinária ao sistema.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Condição *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Artrite"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva a condição de saúde..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Ex: Articular"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="severity">Nível de Severidade</Label>
              <Select
                value={formData.severity_level}
                onValueChange={(value) => setFormData({ ...formData, severity_level: value })}
              >
                <SelectTrigger id="severity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="moderate">Moderada</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="critical">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VeterinaryTargetCRUDDialog;
