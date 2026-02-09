
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Filter, Loader2, Users, UserPlus } from "lucide-react";
import PetProfileCard from '@/components/pet/PetProfileCard';
import GenerateSamplePetsButton from '@/components/pet/GenerateSamplePetsButton';
import PetRegistrationForm from '@/components/pet/PetRegistrationForm';
import { usePetProfiles, useCreatePetProfile } from '@/hooks/usePetProfile';
import type { PetProfileData } from '@/hooks/usePetProfile';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';

const AdminPetManagementTab: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('list');
  const { data: petProfiles, isLoading } = usePetProfiles();
  const createPet = useCreatePetProfile();

  const handleCreatePet = (data: PetProfileData) => {
    createPet.mutate(data, {
      onSuccess: () => {
        toast({ title: t('admin.patients.created') });
        setActiveTab('list');
      },
    });
  };

  const filteredPets = (petProfiles || []).filter(pet =>
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
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter size={16} />
                  {t('veterinarian.filter')}
                </Button>
                <Button onClick={() => setActiveTab('register')}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('veterinarian.newPet')}
                </Button>
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
          </div>
        </TabsContent>

        <TabsContent value="register" className="mt-6">
          <PetRegistrationForm onSubmit={handleCreatePet} isLoading={createPet.isPending} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPetManagementTab;
