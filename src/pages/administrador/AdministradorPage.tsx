
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import AdminLayout from '@/components/administrador/AdminLayout';
import { adminTabsConfig, getTabConfig } from '@/config/admin-tabs';
import { NutraceuticalProvider } from '@/contexts/NutraceuticalContext';
import { useTranslation } from 'react-i18next';

const AdministradorPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [currentStep, setCurrentStep] = useState<string>(tabParam || "estudos");
  const { t } = useTranslation();
  
  const handleStepChange = (newStep: string) => {
    setCurrentStep(newStep);
    setSearchParams({ tab: newStep });
  };
  
  useEffect(() => {
    if (tabParam && tabParam !== currentStep) {
      setCurrentStep(tabParam);
    }
  }, [tabParam, currentStep]);
  
  const renderContent = () => {
    const tabConfig = getTabConfig(currentStep);
    
    if (!tabConfig) {
      // Fallback para tabs não configuradas ainda
      return (
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold text-gray-500">{t('admin.errors.tabNotFound')}</h2>
          <p className="text-gray-600 mt-2">{t('admin.errors.tabNotFoundDesc', { tab: currentStep })}</p>
          <Button 
            onClick={() => handleStepChange('estudos')} 
            className="mt-4"
          >
            {t('admin.errors.backToStudies')}
          </Button>
        </div>
      );
    }

    const Component = tabConfig.component;

    // Para tabs que precisam do NutraceuticalProvider
    const needsProvider = ['nutraceuticos', 'nutraceu-gerenciamento', 'analytics'].includes(currentStep);

    const componentElement = (
      <Suspense fallback={<LoadingTab />}>
        <Component />
      </Suspense>
    );

    return needsProvider ? (
      <NutraceuticalProvider>
        {componentElement}
      </NutraceuticalProvider>
    ) : componentElement;
  };
  
  return (
    <AdminLayout currentStep={currentStep} setCurrentStep={handleStepChange}>
      <div className="min-h-screen">
        {renderContent()}
      </div>
    </AdminLayout>
  );
};

const LoadingTab: React.FC = () => (
  <div className="p-6 space-y-4">
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-3">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-20 w-full" />
        </div>
      ))}
    </div>
  </div>
);

export default AdministradorPage;
