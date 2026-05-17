import React, { lazy } from 'react';
import { Loader2 } from "lucide-react";

// Lazy loading dos componentes principais do administrador
export const AdminPainel = lazy(() => import('@/components/administrador/AdminPainel'));
export const NutraceuticalsUnifiedTab = lazy(() => import('@/components/administrador/NutraceuticalsUnifiedTab'));
export const ConfiguracoesTab = lazy(() => import('@/components/administrador/ConfiguracoesTab'));
export const DataAnalysisTab = lazy(() => import('@/components/administrador/dataAnalysis/DataAnalysisTab'));
export const PromptConfigurationTab = lazy(() => import('@/components/administrador/PromptConfigurationTab'));

// Lazy loading dos módulos de acompanhamento

export const DashboardModule = lazy(() => import('@/components/administrador/acompanhamento/modules/DashboardModule'));

// Lazy loading dos componentes de estudos
export const SciImportSection = lazy(() => import('@/components/administrador/estudos/import/SciImportSection'));

// Lazy loading dos dialogs pesados
export const ConditionsDialog = lazy(() => import('@/components/administrador/settings/panels/nutraceuticalManagement/ConditionsDialog'));
export const OutcomesDialog = lazy(() => import('@/components/administrador/settings/panels/nutraceuticalManagement/OutcomesDialog'));

// Fallback loading component
const ComponentLoadingFallback: React.FC<{ height?: string }> = ({ 
  height = "h-64" 
}) => (
  <div className={`flex items-center justify-center ${height}`}>
    <div className="flex flex-col items-center gap-2">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Carregando componente...</p>
    </div>
  </div>
);

// Simplificar sem HOC complexo - usar Suspense diretamente
export const withLazyFallback = (
  LazyComponent: React.LazyExoticComponent<React.ComponentType<any>>,
  fallbackComponent?: React.ReactNode
) => {
  return (props: any) => (
    <React.Suspense fallback={fallbackComponent || <ComponentLoadingFallback />}>
      <LazyComponent {...props} />
    </React.Suspense>
  );
};

// Componentes exportados com fallback
export const LazyAdminPainel = withLazyFallback(AdminPainel);

export const LazyDashboardModule = withLazyFallback(DashboardModule);
export const LazySciImportSection = withLazyFallback(SciImportSection);