import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '@/components/layout/Layout';
import PetRegistrationForm from '@/components/pet/PetRegistrationForm';
import PetClinicalChat from '@/components/pet/PetClinicalChat';
import PetExamPdfUploader from '@/components/pet/PetExamPdfUploader';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useCreatePetProfile, type PetProfileData } from '@/hooks/usePetProfile';
import { useToast } from '@/hooks/use-toast';
import { uploadPetPhoto } from '@/components/pet/PetPhotoUploader';
import { uploadPetExamPdfs } from '@/services/pet-exam-uploader';
import { writeConsultationsChronological, type ConsultationBundle } from '@/services/pet-consultation-writer';
import { supabase } from '@/integrations/supabase/client';

const PetRegistrationPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const createPet = useCreatePetProfile();
  const [createdPetId, setCreatedPetId] = React.useState<string | null>(null);
  const [petBreed, setPetBreed] = React.useState<string>('');
  const [petAge, setPetAge] = React.useState<number>(0);

  const handleSubmit = async (
    data: PetProfileData,
    extras: { photoFile: File | null; examFiles: File[]; historicalConsultations: ConsultationBundle[] },
  ) => {
    try {
      const result = await createPet.mutateAsync(data);
      const petId = result.id as string;
      setCreatedPetId(petId);
      setPetBreed(data.breed);
      setPetAge(data.age_years);

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id ?? null;

      // Run side effects in parallel; surface failures via toast but don't block flow.
      const tasks: Promise<unknown>[] = [];
      if (extras.photoFile) tasks.push(uploadPetPhoto(petId, extras.photoFile));
      if (extras.historicalConsultations.length) {
        tasks.push(writeConsultationsChronological(petId, extras.historicalConsultations, userId));
      }
      if (extras.examFiles.length) tasks.push(uploadPetExamPdfs(petId, extras.examFiles, null));
      const results = await Promise.allSettled(tasks);
      const failures = results.filter((r) => r.status === 'rejected').length;

      toast({
        title: t('petRegistration.form.successTitle'),
        description: failures
          ? `${t('petRegistration.form.successDesc', { name: data.name })} (${failures} extra(s) com falha)`
          : t('petRegistration.form.successDesc', { name: data.name }),
        variant: failures ? 'destructive' : undefined,
      });
    } catch (error) {
      // Error handled by the mutation
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/veterinario')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{t('petRegistration.title')}</h1>
            <p className="text-muted-foreground">{t('petRegistration.description')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <PetRegistrationForm
              onSubmit={handleSubmit}
              isLoading={createPet.isPending}
            />
          </div>

          <div className="min-h-[600px]">
            {createdPetId ? (
              <div className="space-y-4">
                <PetExamPdfUploader petId={createdPetId} />
                <PetClinicalChat
                  petId={createdPetId}
                  petBreed={petBreed}
                  petAge={petAge}
                />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center border rounded-lg bg-muted/30">
                <div className="text-center p-8">
                  <p className="text-muted-foreground text-sm">
                    {t('petRegistration.chat.registerFirst')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {createdPetId && (
          <div className="mt-6 flex justify-center gap-4">
            <Button variant="outline" onClick={() => navigate('/veterinario')}>
              {t('common.backToPatients')}
            </Button>
            <Button onClick={() => navigate(`/veterinario/pet/${createdPetId}`)}>
              {t('petRegistration.goToProfile')}
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PetRegistrationPage;
