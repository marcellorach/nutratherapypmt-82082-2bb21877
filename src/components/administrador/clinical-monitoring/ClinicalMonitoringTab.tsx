import React, { useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from 'react-i18next';
import CohortObservatory from './CohortObservatory';
import LongitudinalTrajectories from './LongitudinalTrajectories';
import PatientExplorer from './PatientExplorer';
import DiscoverySignals from './DiscoverySignals';
import ModelFeedbackLoop from './ModelFeedbackLoop';
import PatientDetailDialog from './PatientDetailDialog';
import SyntheticDataBadge from './SyntheticDataBadge';
import { generateSyntheticCohort } from '@/utils/syntheticCohort';

// Kept for backwards compatibility with FilterPanel imports.
export interface ClinicalFilters {
  breed?: string;
  condition?: string;
  responseStatus?: string;
  treatmentDuration?: string;
  ageRange?: string;
  region?: string;
}

const ClinicalMonitoringTab: React.FC = () => {
  const { t } = useTranslation();
  const cohort = useMemo(() => generateSyntheticCohort(), []);
  const [openPatientId, setOpenPatientId] = useState<string | null>(null);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {t('clinicalMonitoring.v2.title')}
          </h1>
          <p className="text-muted-foreground max-w-3xl">
            {t('clinicalMonitoring.v2.subtitle')}
          </p>
        </div>
      </div>

      <SyntheticDataBadge
        treated={cohort.meta.treatedCount}
        mirror={cohort.meta.mirrorCount}
        twins={cohort.meta.twinCount}
      />

      <Tabs defaultValue="observatory" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="observatory">{t('clinicalMonitoring.v2.tabs.observatory')}</TabsTrigger>
          <TabsTrigger value="trajectories">{t('clinicalMonitoring.v2.tabs.trajectories')}</TabsTrigger>
          <TabsTrigger value="explorer">{t('clinicalMonitoring.v2.tabs.explorer')}</TabsTrigger>
          <TabsTrigger value="discovery">{t('clinicalMonitoring.v2.tabs.discovery')}</TabsTrigger>
          <TabsTrigger value="loop">{t('clinicalMonitoring.v2.tabs.loop')}</TabsTrigger>
        </TabsList>

        <TabsContent value="observatory" className="space-y-4 mt-4">
          <CohortObservatory cohort={cohort} />
        </TabsContent>
        <TabsContent value="trajectories" className="space-y-4 mt-4">
          <LongitudinalTrajectories cohort={cohort} />
        </TabsContent>
        <TabsContent value="explorer" className="space-y-4 mt-4">
          <PatientExplorer cohort={cohort} onOpenPatient={setOpenPatientId} />
        </TabsContent>
        <TabsContent value="discovery" className="space-y-4 mt-4">
          <DiscoverySignals cohort={cohort} />
        </TabsContent>
        <TabsContent value="loop" className="space-y-4 mt-4">
          <ModelFeedbackLoop cohort={cohort} />
        </TabsContent>
      </Tabs>

      <PatientDetailDialog
        cohort={cohort}
        patientId={openPatientId}
        onClose={() => setOpenPatientId(null)}
      />
    </div>
  );
};

export default ClinicalMonitoringTab;
