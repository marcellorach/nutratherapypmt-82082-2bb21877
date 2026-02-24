
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useOutcomes } from "@/hooks/nutraceuticals/useOutcomes";
import { useTranslation } from 'react-i18next';

export const useOutcomeManagement = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState<any>(null);
  const [filteredOutcomes, setFilteredOutcomes] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    name: "",
    name_en: "",
    description: "",
    description_en: "",
    family_id: ""
  });

  const { outcomes, isLoading, fetchOutcomes, createOutcome, updateOutcome, deleteOutcome } = useOutcomes();

  useEffect(() => {
    fetchOutcomes();
  }, []);

  useEffect(() => {
    if (outcomes) {
      setFilteredOutcomes(
        outcomes.filter(item => 
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      );
    }
  }, [searchTerm, outcomes]);

  const handleEditClick = (outcome: any) => {
    setSelectedOutcome(outcome);
    setFormData({
      name: outcome.name || "",
      name_en: outcome.name_en || "",
      description: outcome.description || "",
      description_en: outcome.description_en || "",
      family_id: outcome.family_id || "none"
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (outcome: any) => {
    setSelectedOutcome(outcome);
    setIsDeleteDialogOpen(true);
  };

  const handleCreateSubmit = async () => {
    try {
      await createOutcome({
        name: formData.name,
        name_en: formData.name_en,
        description: formData.description,
        description_en: formData.description_en,
        family_id: formData.family_id === 'none' ? undefined : formData.family_id || undefined
      });

      toast({
        title: t('common.success'),
        description: t('outcomeToasts.createSuccess'),
      });
      
      setIsCreateDialogOpen(false);
      resetFormData();
      fetchOutcomes();
    } catch (err) {
      toast({
        title: t('common.error'),
        description: t('outcomeToasts.createError'),
        variant: "destructive",
      });
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedOutcome) return;
    
    try {
      await updateOutcome(selectedOutcome.id, {
        name: formData.name,
        name_en: formData.name_en,
        description: formData.description,
        description_en: formData.description_en,
        family_id: formData.family_id === 'none' ? undefined : formData.family_id || undefined
      });

      toast({
        title: t('common.success'),
        description: t('outcomeToasts.updateSuccess'),
      });
      
      setIsEditDialogOpen(false);
      fetchOutcomes();
    } catch (err) {
      toast({
        title: t('common.error'),
        description: t('outcomeToasts.updateError'),
        variant: "destructive",
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedOutcome) return;
    
    try {
      await deleteOutcome(selectedOutcome.id);

      toast({
        title: t('common.success'),
        description: t('outcomeToasts.deleteSuccess'),
      });
      
      setIsDeleteDialogOpen(false);
      fetchOutcomes();
    } catch (err) {
      toast({
        title: t('common.error'),
        description: t('outcomeToasts.deleteError'),
        variant: "destructive",
      });
    }
  };

  const resetFormData = () => {
    setFormData({
      name: "",
      name_en: "",
      description: "",
      description_en: "",
      family_id: "none"
    });
  };

  const handleOpenCreateDialog = () => {
    resetFormData();
    setIsCreateDialogOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFamilyChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      family_id: value
    }));
  };

  return {
    searchTerm,
    setSearchTerm,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    selectedOutcome,
    filteredOutcomes,
    formData,
    setFormData,
    isLoading,
    handleEditClick,
    handleDeleteClick,
    handleCreateSubmit,
    handleEditSubmit,
    handleDeleteConfirm,
    handleOpenCreateDialog,
    handleFormChange,
    handleFamilyChange
  };
};
