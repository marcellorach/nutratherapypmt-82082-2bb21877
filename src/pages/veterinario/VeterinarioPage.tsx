
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Filter, Loader2 } from "lucide-react";
import PetProfileCard from '@/components/pet/PetProfileCard';
import GenerateSamplePetsButton from '@/components/pet/GenerateSamplePetsButton';
import { usePetProfiles, useDeletePetProfile } from '@/hooks/usePetProfile';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const VeterinarioPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const { data: petProfiles, isLoading } = usePetProfiles();
  const deletePet = useDeletePetProfile();
  const { toast } = useToast();

  const handleDeletePet = (id: string) => {
    deletePet.mutate(id, {
      onSuccess: () => {
        toast({ title: t('admin.patients.deleted', 'Pet removido com sucesso') });
        setDeleteTarget(null);
      },
    });
  };

  // Filter pets based on search
  const filteredPets = (petProfiles || []).filter(pet =>
    pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pet.breed.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="container mx-auto py-6 px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">{t('veterinarian.portal')}</h1>
            <p className="text-muted-foreground">{t('veterinarian.portalDesc')}</p>
          </div>
          
          <div className="flex gap-4 mt-4 md:mt-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t('veterinarian.searchPet')}
                className="w-64 pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={() => navigate('/veterinario/pet/new')}>
              <Plus className="mr-2 h-4 w-4" />
              {t('veterinarian.newPet')}
            </Button>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <p className="text-muted-foreground">
              {isLoading
                ? t('common.loading')
                : t('veterinarian.patient', { count: filteredPets.length })}
            </p>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter size={16} />
              {t('veterinarian.filter')}
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredPets.map((pet) => (
                <PetProfileCard key={pet.id} pet={pet} />
              ))}

              {filteredPets.length === 0 && (
                <div className="col-span-full text-center py-10">
                  <p className="text-muted-foreground">{t('veterinarian.noPetsFound')}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-center mt-6">
            <GenerateSamplePetsButton />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default VeterinarioPage;
