
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Filter, Loader2, Users, UserPlus, Trash2, Eye, EyeOff } from "lucide-react";
import PetProfileCard from '@/components/pet/PetProfileCard';
import GenerateSamplePetsButton from '@/components/pet/GenerateSamplePetsButton';
import PetRegistrationForm from '@/components/pet/PetRegistrationForm';
import { usePetProfiles, useCreatePetProfile, useDeletePetProfile, useDeleteDemoPets } from '@/hooks/usePetProfile';
import type { PetProfileData } from '@/hooks/usePetProfile';
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

const AdminPetManagementTab: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('list');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteAllDemoOpen, setDeleteAllDemoOpen] = useState(false);
  const [showDemo, setShowDemo] = useState(true);
  const { data: petProfiles, isLoading } = usePetProfiles();
  const createPet = useCreatePetProfile();
  const deletePet = useDeletePetProfile();
  const deleteDemoPets = useDeleteDemoPets();

  const handleCreatePet = (data: PetProfileData) => {
    createPet.mutate(data, {
      onSuccess: () => {
        toast({ title: t('admin.patients.created') });
        setActiveTab('list');
      },
    });
  };

  const handleDeletePet = (id: string) => {
    deletePet.mutate(id, {
      onSuccess: () => {
        toast({ title: t('admin.patients.deleted', 'Pet removido com sucesso') });
        setDeleteTarget(null);
      },
    });
  };

  const handleDeleteAllDemo = () => {
    deleteDemoPets.mutate(undefined, {
      onSuccess: () => {
        toast({ title: t('admin.patients.allDemoDeleted', 'Todos os pets demo foram removidos') });
        setDeleteAllDemoOpen(false);
      },
    });
  };

  const demoCount = (petProfiles || []).filter((p: any) => p.is_demo).length;

  const filteredPets = (petProfiles || [])
    .filter((pet: any) => showDemo || !pet.is_demo)
    .filter((pet: any) =>
      pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pet.breed.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('admin.patients.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('admin.patients.description')}</p>
        </div>
        <GenerateSamplePetsButton />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>{t('admin.patients.tabs.list')}</span>
          </TabsTrigger>
          <TabsTrigger value="register" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            <span>{t('admin.patients.tabs.register')}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
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
              <div className="flex gap-2">
                <Button
                  variant={showDemo ? "outline" : "secondary"}
                  size="sm"
                  onClick={() => setShowDemo(!showDemo)}
                  className="gap-1"
                >
                  {showDemo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showDemo
                    ? t('admin.patients.hideDemo', 'Ocultar Demo')
                    : t('admin.patients.showDemo', 'Mostrar Demo')}
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter size={16} />
                  {t('veterinarian.filter')}
                </Button>
                <Button onClick={() => setActiveTab('register')}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('veterinarian.newPet')}
                </Button>
                {demoCount > 0 && (
                  <Button variant="destructive" size="sm" onClick={() => setDeleteAllDemoOpen(true)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t('admin.patients.deleteAllDemo', 'Apagar Demo')} ({demoCount})
                  </Button>
                )}
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              {isLoading
                ? t('common.loading')
                : t('veterinarian.patient', { count: filteredPets.length })}
            </p>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredPets.map((pet: any) => (
                  <PetProfileCard key={pet.id} pet={pet} onDelete={(id) => setDeleteTarget(id)} />
                ))}

                {filteredPets.length === 0 && (
                  <div className="col-span-full text-center py-10">
                    <p className="text-muted-foreground">{t('veterinarian.noPetsFound')}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="register" className="mt-6">
          <PetRegistrationForm onSubmit={handleCreatePet} isLoading={createPet.isPending} />
        </TabsContent>
      </Tabs>

      {/* Delete single pet dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.patients.deleteConfirmTitle', 'Confirmar exclusão')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.patients.deleteConfirmDesc', 'Tem certeza que deseja remover este pet? Esta ação não pode ser desfeita.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => deleteTarget && handleDeletePet(deleteTarget)}>
              {t('common.delete', 'Apagar')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete all demo pets dialog */}
      <AlertDialog open={deleteAllDemoOpen} onOpenChange={setDeleteAllDemoOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.patients.deleteAllDemoTitle', 'Apagar todos os pets demo')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.patients.deleteAllDemoDesc', 'Tem certeza que deseja remover TODOS os pets marcados como DEMO? Pets reais não serão afetados.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleDeleteAllDemo}>
              {t('admin.patients.deleteAllDemoConfirm', 'Sim, apagar todos demo')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPetManagementTab;
