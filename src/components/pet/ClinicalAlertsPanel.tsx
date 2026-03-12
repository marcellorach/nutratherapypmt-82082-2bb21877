import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, TestTube, Pill, CheckCircle2, XCircle, Lightbulb, TrendingUp, HeartPulse } from 'lucide-react';
import type { BreedPredisposition, LabAlert, InteractionAlert, ClinicalDiscovery } from '@/services/clinical-analysis-pipeline';
import PredispositionTag from '@/components/administrador/tags/PredispositionTag';

interface ClinicalAlertsPanelProps {
  predispositions: BreedPredisposition[];
  labAlerts: LabAlert[];
  interactionAlerts: InteractionAlert[];
  clinicalDiscoveries?: ClinicalDiscovery[];
  breed: string;
  ageYears: number;
}

const labStatusColor = (status: LabAlert['status']) => {
  if (status.startsWith('critical')) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
  return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
};

const labStatusLabel = (status: LabAlert['status'], t: any) => {
  const labels: Record<string, string> = {
    low: t('petProfile.clinicalAlerts.low'),
    high: t('petProfile.clinicalAlerts.high'),
    critical_low: t('petProfile.clinicalAlerts.criticalLow'),
    critical_high: t('petProfile.clinicalAlerts.criticalHigh'),
  };
  return labels[status] || status;
};

const discoveryIcon = (type: ClinicalDiscovery['type']) => {
  switch (type) {
    case 'lab-condition-correlation': return <TrendingUp className="h-4 w-4 text-amber-500" />;
    case 'medication-monitoring': return <HeartPulse className="h-4 w-4 text-red-500" />;
    case 'breed-lab-confirmation': return <Shield className="h-4 w-4 text-blue-500" />;
    case 'compound-opportunity': return <Lightbulb className="h-4 w-4 text-emerald-500" />;
  }
};

const discoverySeverityBg = (severity: ClinicalDiscovery['severity']) => {
  switch (severity) {
    case 'critical': return 'bg-red-50 dark:bg-red-900/10 border-l-4 border-l-red-500';
    case 'warning': return 'bg-amber-50 dark:bg-amber-900/10 border-l-4 border-l-amber-500';
    case 'info': return 'bg-blue-50 dark:bg-blue-900/10 border-l-4 border-l-blue-500';
  }
};

const ClinicalAlertsPanel: React.FC<ClinicalAlertsPanelProps> = ({
  predispositions,
  labAlerts,
  interactionAlerts,
  clinicalDiscoveries = [],
  breed,
  ageYears,
}) => {
  const { t } = useTranslation();

  const undiagnosedRisks = predispositions.filter(p => !p.already_diagnosed);
  const totalAlerts = undiagnosedRisks.length + labAlerts.length + interactionAlerts.length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${totalAlerts > 0 ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
              {totalAlerts > 0 ? (
                <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              )}
            </div>
            <div>
              <p className="font-medium text-sm">
                {totalAlerts > 0
                  ? t('petProfile.clinicalAlerts.alertsFound', { count: totalAlerts })
                  : t('petProfile.clinicalAlerts.noAlerts')}
              </p>
              <p className="text-xs text-muted-foreground">
                {breed} · {ageYears} {t('petRegistration.profile.years')}
                {clinicalDiscoveries.length > 0 && ` · ${clinicalDiscoveries.length} ${t('petProfile.clinicalAlerts.discoveriesCount')}`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clinical Discoveries - AI-identified cross-references */}
      {clinicalDiscoveries.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              {t('petProfile.clinicalAlerts.clinicalDiscoveries')}
              <Badge variant="outline" className="ml-auto text-xs bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                {clinicalDiscoveries.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {clinicalDiscoveries.map((discovery, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-md text-sm ${discoverySeverityBg(discovery.severity)}`}
                >
                  <div className="flex items-start gap-2">
                    {discoveryIcon(discovery.type)}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{discovery.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{discovery.description}</p>
                      {discovery.relatedEntities.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {discovery.relatedEntities.filter(Boolean).slice(0, 4).map((entity, j) => (
                            <Badge key={j} variant="outline" className="text-[10px] px-1.5 py-0">
                              {entity}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Breed Predispositions */}
      {predispositions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 text-orange-500" />
              {t('petProfile.clinicalAlerts.breedPredispositions')}
              <Badge variant="outline" className="ml-auto text-xs">
                {predispositions.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {predispositions.map((p) => (
                <PredispositionTag
                  key={p.id}
                  conditionName={p.condition_name}
                  conditionNameEn={p.condition_name_en || undefined}
                  riskFactor={p.risk_factor}
                  evidenceGrade={p.evidence_grade}
                  alreadyDiagnosed={p.already_diagnosed}
                  notes={p.notes}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lab Alerts */}
      {labAlerts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TestTube className="h-4 w-4 text-red-500" />
              {t('petProfile.clinicalAlerts.labAbnormalities')}
              <Badge variant="outline" className="ml-auto text-xs">
                {labAlerts.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {labAlerts.map((alert, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 rounded-md bg-red-50 dark:bg-red-900/10 text-sm"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{alert.test_name}</span>
                      <Badge variant="outline" className={labStatusColor(alert.status)}>
                        {labStatusLabel(alert.status, t)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t('petProfile.clinicalAlerts.labValue', {
                        value: alert.value,
                        unit: alert.unit,
                        min: alert.min_normal,
                        max: alert.max_normal,
                      })}
                    </p>
                    {alert.clinical_significance && (
                      <p className="text-xs text-orange-700 dark:text-orange-400 mt-0.5">
                        → {alert.clinical_significance}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interaction Alerts */}
      {interactionAlerts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              {t('petProfile.clinicalAlerts.interactions')}
              <Badge variant="outline" className="ml-auto text-xs bg-red-100 text-red-800">
                {interactionAlerts.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {interactionAlerts.map((alert, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 p-2 rounded-md bg-red-50 dark:bg-red-900/10 text-sm"
                >
                  <Pill className="h-3.5 w-3.5 text-red-500 shrink-0" />
                  <div>
                    <p className="font-medium">
                      {alert.compound} ↔ {alert.medication}
                    </p>
                    <p className="text-xs text-muted-foreground">{alert.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No alerts state */}
      {totalAlerts === 0 && predispositions.length === 0 && clinicalDiscoveries.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            {t('petProfile.clinicalAlerts.noDataAvailable')}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClinicalAlertsPanel;
