import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { OutcomeFamily, CreateOutcomeFamilyData } from '@/services/outcome-families-service';

interface FamilyManagementDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  family?: OutcomeFamily | null;
  onSubmit: (data: CreateOutcomeFamilyData) => void;
  isCreate?: boolean;
}

const AVAILABLE_ICONS = ['🫀', '🧠', '🦴', '🛡️', '⏳', '🏥', '💊', '🔬', '⚕️', '🌿'];
const AVAILABLE_COLORS = ['#EF4444', '#8B5CF6', '#F59E0B', '#10B981', '#6366F1', '#EC4899', '#3B82F6', '#84CC16', '#F97316', '#8B5CF6'];

const FamilyManagementDialog: React.FC<FamilyManagementDialogProps> = ({
  isOpen,
  setIsOpen,
  family,
  onSubmit,
  isCreate = true
}) => {
  const [formData, setFormData] = useState<CreateOutcomeFamilyData>({
    name: '',
    description: '',
    color: '#3B82F6',
    icon: '🏥',
    sort_order: 0
  });

  useEffect(() => {
    if (family && !isCreate) {
      setFormData({
        name: family.name,
        description: family.description || '',
        color: family.color,
        icon: family.icon,
        sort_order: family.sort_order
      });
    } else {
      setFormData({
        name: '',
        description: '',
        color: '#3B82F6',
        icon: '🏥',
        sort_order: 0
      });
    }
  }, [family, isCreate, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setIsOpen(false);
  };

  const handleInputChange = (field: keyof CreateOutcomeFamilyData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isCreate ? 'Criar Nova Família' : 'Editar Família'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Família</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Ex: Cardiovascular"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Descrição da família de outcomes..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ícone</Label>
              <div className="grid grid-cols-5 gap-2">
                {AVAILABLE_ICONS.map((icon) => (
                  <Button
                    key={icon}
                    type="button"
                    variant={formData.icon === icon ? 'default' : 'outline'}
                    className="h-10 w-10 p-0"
                    onClick={() => handleInputChange('icon', icon)}
                  >
                    {icon}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="grid grid-cols-5 gap-2">
                {AVAILABLE_COLORS.map((color) => (
                  <Button
                    key={color}
                    type="button"
                    variant="outline"
                    className="h-10 w-10 p-0 border-2"
                    style={{ 
                      backgroundColor: formData.color === color ? color : 'transparent',
                      borderColor: color 
                    }}
                    onClick={() => handleInputChange('color', color)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sort_order">Ordem de Exibição</Label>
            <Input
              id="sort_order"
              type="number"
              value={formData.sort_order}
              onChange={(e) => handleInputChange('sort_order', parseInt(e.target.value) || 0)}
              min="0"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {isCreate ? 'Criar Família' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FamilyManagementDialog;