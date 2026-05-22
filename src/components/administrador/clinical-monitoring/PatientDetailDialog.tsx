import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { FlaskConical, User, Stethoscope, Pill, FileText, Activity, Users, Wrench, Sparkles } from 'lucide-react';
import {
  SyntheticCohort,
  findPatientBundle,
  syntheticSnapshot,
  SYNTHETIC_CONDITIONS,
  meanTrajectory,
} from '@/utils/syntheticCohort';

interface Props {
  cohort: SyntheticCohort;
  patientId: string | null;
  onClose: () => void;
}

const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base flex items-center gap-2">
        {icon}
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

const PatientDetailDialog: React.FC<Props> = ({ cohort, patientId, onClose }) => {
  const { t, i18n } = useTranslation();
  const bundle = patientId ? findPatientBundle(cohort, patientId) : null;

  const trajectoryData = useMemo(() => {
    if (!bundle) return [];
    const { treated, twin, mirrors } = bundle;
    const mirrorMean = meanTrajectory(mirrors);
    const maxLen = Math.max(treated.monthlySeverity.length, twin?.monthlySeverity.length ?? 0, mirrorMean.length);
    const rows = [];
    for (let m = 0; m < maxLen; m++) {
      rows.push({
        month: m,
        treated: treated.monthlySeverity[m] ?? null,
        twin: twin?.monthlySeverity[m] ?? null,
        mirror: mirrorMean[m]?.mean ?? null,
      });
    }
    return rows;
  }, [bundle]);

  if (!bundle) return null;
  const { treated, twin, mirrors } = bundle;
  const cond = SYNTHETIC_CONDITIONS.find((c) => c.id === treated.primaryConditionId)!;
  const snap = syntheticSnapshot(treated);
  const condName = i18n.language === 'en' ? cond.name_en : cond.name;
  const reason = i18n.language === 'en' ? snap.reason_en : snap.reason;
  const physical = i18n.language === 'en' ? snap.physicalExam_en : snap.physicalExam;

  // Synthetic protocol adjustments timeline (deterministic based on id)
  const adjustments = [
    { month: Math.max(2, Math.floor(treated.monthsOnProtocol / 4)), action: t('clinicalMonitoring.v2.detail.adj.addCoq10') },
    { month: Math.max(4, Math.floor(treated.monthsOnProtocol / 2)), action: t('clinicalMonitoring.v2.detail.adj.tuneDose') },
  ].filter((a) => a.month < treated.monthsOnProtocol);

  return (
    <Dialog open={!!patientId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-2xl flex items-center gap-3">
                <span className="font-mono">{treated.id}</span>
                <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 gap-1">
                  <FlaskConical className="h-3 w-3" /> {t('clinicalMonitoring.v2.syntheticBadge.compact')}
                </Badge>
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-2">
                {treated.breed} · {treated.ageYears}a · {treated.sex} · {treated.region} · {t('clinicalMonitoring.v2.detail.startedAgo', { months: treated.monthsOnProtocol })}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* 1. T0 Snapshot */}
          <Section icon={<Stethoscope className="h-4 w-4" />} title={t('clinicalMonitoring.v2.detail.t0Title')}>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs uppercase text-muted-foreground">{t('clinicalMonitoring.v2.detail.reason')}</p>
                <p>{reason}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">{t('clinicalMonitoring.v2.detail.physicalExam')}</p>
                <p>{physical}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground mb-1">{t('clinicalMonitoring.v2.detail.diagnoses')}</p>
                <div className="flex flex-wrap gap-2">
                  {snap.diagnoses.map((d, i) => (
                    <Badge key={i} variant="secondary">
                      {i18n.language === 'en' ? d.name_en : d.name} · {d.severity}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="rounded border p-2 text-center">
                  <p className="text-xs text-muted-foreground">{t('clinicalMonitoring.v2.detail.severityT0')}</p>
                  <p className="text-lg font-bold">{(treated.severityT0 * 100).toFixed(0)}%</p>
                </div>
                <div className="rounded border p-2 text-center">
                  <p className="text-xs text-muted-foreground">{t('clinicalMonitoring.v2.detail.currentSeverity')}</p>
                  <p className="text-lg font-bold">{(treated.monthlySeverity[treated.monthlySeverity.length - 1] * 100).toFixed(0)}%</p>
                </div>
                <div className="rounded border p-2 text-center">
                  <p className="text-xs text-muted-foreground">{t('clinicalMonitoring.v2.detail.adherence')}</p>
                  <p className="text-lg font-bold">{treated.adherencePct}%</p>
                </div>
              </div>
            </div>
          </Section>

          {/* 2. Senex Stack */}
          <Section icon={<Pill className="h-4 w-4" />} title={t('clinicalMonitoring.v2.detail.stackTitle')}>
            <p className="text-xs text-muted-foreground mb-3">{t('clinicalMonitoring.v2.detail.stackSubtitle')}</p>
            <div className="flex flex-wrap gap-2">
              {treated.stack.map((c) => (
                <Badge key={c} variant="outline" className="border-primary/30 text-primary">{c}</Badge>
              ))}
            </div>
          </Section>

          {/* 3. Tutor proposal */}
          <Section icon={<FileText className="h-4 w-4" />} title={t('clinicalMonitoring.v2.detail.proposalTitle')}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="rounded border p-3">
                <p className="text-xs text-muted-foreground">{t('clinicalMonitoring.v2.detail.annualCost')}</p>
                <p className="text-lg font-bold">R$ {(2400 + treated.stack.length * 180).toLocaleString()}</p>
              </div>
              <div className="rounded border p-3">
                <p className="text-xs text-muted-foreground">{t('clinicalMonitoring.v2.detail.yearsGained')}</p>
                <p className="text-lg font-bold text-emerald-600">+{treated.yearsGained}a</p>
              </div>
              <div className="rounded border p-3">
                <p className="text-xs text-muted-foreground">{t('clinicalMonitoring.v2.detail.roe')}</p>
                <p className="text-lg font-bold">R$ {treated.estimatedRoeBrl.toLocaleString()}</p>
              </div>
            </div>
          </Section>

          {/* 4. Trajectory: treated vs twin vs mirror */}
          <Section icon={<Activity className="h-4 w-4" />} title={t('clinicalMonitoring.v2.detail.trajectoryTitle')}>
            <p className="text-xs text-muted-foreground mb-3">{t('clinicalMonitoring.v2.detail.trajectorySubtitle', { n: mirrors.length })}</p>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={trajectoryData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="month" label={{ value: t('clinicalMonitoring.v2.trajectories.xAxis'), position: 'insideBottom', offset: -5, fontSize: 11 }} />
                <YAxis domain={[0, 1]} />
                <Tooltip formatter={(v: any) => (typeof v === 'number' ? v.toFixed(3) : v)} />
                <Legend />
                <Line type="monotone" dataKey="mirror" stroke="#94a3b8" strokeWidth={2} dot={false} name={t('clinicalMonitoring.v2.detail.mirrorMean')} strokeDasharray="6 4" />
                <Line type="monotone" dataKey="treated" stroke="hsl(var(--primary))" strokeWidth={3} dot name={t('clinicalMonitoring.v2.detail.thisPatient')} />
                <Line type="monotone" dataKey="twin" stroke="#10b981" strokeWidth={2} dot={false} name={t('clinicalMonitoring.v2.detail.twin')} strokeDasharray="2 4" />
              </LineChart>
            </ResponsiveContainer>
          </Section>

          {/* 5. Mirror cohort detail */}
          <Section icon={<Users className="h-4 w-4" />} title={t('clinicalMonitoring.v2.detail.mirrorTitle')}>
            <p className="text-xs text-muted-foreground mb-3">{t('clinicalMonitoring.v2.detail.mirrorSubtitle')}</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase text-muted-foreground">
                    <th className="text-left py-2 px-2">ID</th>
                    <th className="text-left py-2 px-2">{t('clinicalMonitoring.v2.explorer.col.breed')}</th>
                    <th className="text-left py-2 px-2">{t('clinicalMonitoring.v2.explorer.col.age')}</th>
                    <th className="text-left py-2 px-2">Δ {t('clinicalMonitoring.v2.detail.severity')}</th>
                  </tr>
                </thead>
                <tbody>
                  {mirrors.map((m) => {
                    const delta = ((m.monthlySeverity[m.monthlySeverity.length - 1] - m.monthlySeverity[0]) * 100).toFixed(1);
                    return (
                      <tr key={m.id} className="border-b">
                        <td className="py-2 px-2 font-mono text-xs">{m.id}</td>
                        <td className="py-2 px-2">{m.breed}</td>
                        <td className="py-2 px-2">{m.ageYears}a</td>
                        <td className={`py-2 px-2 ${Number(delta) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{Number(delta) > 0 ? '+' : ''}{delta}pp</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Section>

          {/* 6. Adjustments timeline */}
          {adjustments.length > 0 && (
            <Section icon={<Wrench className="h-4 w-4" />} title={t('clinicalMonitoring.v2.detail.adjustmentsTitle')}>
              <ol className="space-y-2 text-sm">
                {adjustments.map((a, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Badge variant="outline" className="font-mono shrink-0">M{a.month}</Badge>
                    <span>{a.action}</span>
                  </li>
                ))}
              </ol>
            </Section>
          )}

          {/* 7. Aggregate signal */}
          <Section icon={<Sparkles className="h-4 w-4" />} title={t('clinicalMonitoring.v2.detail.contributionTitle')}>
            <p className="text-sm text-muted-foreground">
              {t('clinicalMonitoring.v2.detail.contributionText', {
                condition: condName,
                compound: treated.stack[0],
              })}
            </p>
          </Section>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PatientDetailDialog;