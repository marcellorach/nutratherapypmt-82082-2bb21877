
import React, { useState } from 'react';
import { useConditions } from '@/hooks/nutraceuticals/useConditions';
import VeterinaryTargetsHeader from './veterinary-targets/VeterinaryTargetsHeader';
import VeterinaryTargetsStats from './veterinary-targets/VeterinaryTargetsStats';
import VeterinaryTargetsTable from './veterinary-targets/VeterinaryTargetsTable';
import VeterinaryTargetCRUDDialog from './veterinary-targets/VeterinaryTargetCRUDDialog';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';

const VeterinaryTargetsTab: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { conditions, isLoading, fetchConditions } = useConditions();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCondition, setSelectedCondition] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredConditions = conditions.filter(condition => {
    const matchesSearch = searchTerm === '' || 
      condition.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (condition.description && condition.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesCategory = !selectedCategory || condition.category === selectedCategory;
    const matchesSeverity = !selectedSeverity || condition.severity_level === selectedSeverity;
      
    return matchesSearch && matchesCategory && matchesSeverity;
  });

  const handleAddNew = () => {
    setSelectedCondition(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (condition: any) => {
    setSelectedCondition(condition);
    setIsDialogOpen(true);
  };

  const handleDelete = async (conditionId: string) => {
    try {
      const { error } = await supabase
        .from('health_conditions')
        .delete()
        .eq('id', conditionId);

      if (error) throw error;

      toast({
        title: "Condição removida",
        description: "A condição foi removida com sucesso.",
      });
      
      fetchConditions();
    } catch (error: any) {
      toast({
        title: "Erro ao remover",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchConditions();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSuccess = () => {
    setIsDialogOpen(false);
    setSelectedCondition(null);
    fetchConditions();
  };

  return (
    <div className="space-y-6">
      <VeterinaryTargetsHeader 
        onAddNew={handleAddNew}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      <VeterinaryTargetsStats 
        conditions={conditions}
        isLoading={isLoading}
      />

      <VeterinaryTargetsTable
        conditions={filteredConditions}
        isLoading={isLoading}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedSeverity={selectedSeverity}
        setSelectedSeverity={setSelectedSeverity}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <VeterinaryTargetCRUDDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        condition={selectedCondition}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default VeterinaryTargetsTab;
