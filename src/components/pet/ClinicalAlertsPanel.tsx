import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, TestTube, Pill, CheckCircle2, XCircle } from 'lucide-react';
import type { BreedPredisposition, LabAlert, InteractionAlert } from '@/services/clinical-analysis-pipeline';

interface ClinicalAlertsPanelProps {
  predispositions: BreedPredisposition[];
  labAlerts: LabAlert[];
  interactionAlerts: InteractionAlert[];
  breed: string;
  ageYears: number;
}

const riskBadgeColor = (risk: number) => {
  if (risk >= 3.5) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
  if (risk >= 2.5) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
  return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
};

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

const ClinicalAlertsPanel: React.FC<ClinicalAlertsPanelProps> = ({
  predispositions,
  labAlerts,
  interactionAlerts,
  breed,
  ageYears,
}) => {
  const { t } = useTranslation();

  const undiagnosedRisks = predispositions.filter(p => !p.already_diagnosed);
  const diagnosedRisks = predispositions.filter(p => p.already_diagnosed);
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
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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
            <div className="space-y-2">
              {predispositions.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-2 rounded-md text-sm ${
                    p.already_diagnosed
                      ? 'bg-muted/50 opacity-70'
                      : 'bg-orange-50 dark:bg-orange-900/10'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1">
                    {p.already_diagnosed ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                    )}
                    <div>
                      <span className="font-medium">{p.condition_name}</span>
                      {p.already_diagnosed && (
                        <span className="text-xs text-muted-foreground ml-1">
                          ({t('petProfile.clinicalAlerts.alreadyDiagnosed')})
                        </span>
                      )}
                      {p.notes && (
                        <p className="text-xs text-muted-foreground">{p.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant="outline" className={riskBadgeColor(p.risk_factor)}>
                      {p.risk_factor}x
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {p.evidence_grade}
                    </Badge>
                  </div>
                </div>
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
      {totalAlerts === 0 && predispositions.length === 0 && (
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
