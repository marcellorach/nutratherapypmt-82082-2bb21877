import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarClock, ChevronDown, ChevronUp, Stethoscope, Pill, TestTube, FileText, Loader2 } from 'lucide-react';
import HelpHint from '@/components/ui/help-hint';
import { usePetConsultations } from '@/hooks/usePetConsultations';
import { format, parseISO } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import PhysicalExamBlock, { type PhysicalExam } from '@/components/pet/PhysicalExamBlock';
import ExamResultsWithReferences from '@/components/pet/ExamResultsWithReferences';
import AssessmentInterpretation, { type AssessmentInterpretationData } from '@/components/pet/AssessmentInterpretation';
import ConsultationMachineSummary from '@/components/pet/ConsultationMachineSummary';
import { partitionExams, mergePhysicalExamRows } from '@/services/exam-classification';

interface Props {
  petId: string;
}

/**
 * Vertical longitudinal timeline of all consultations for a pet.
 * The most recent visit (is_latest=true) is highlighted because the
 * MedGraphRAG inference weights it 1.0 against 0.4 for older visits.
 */
const PetConsultationsTimeline: React.FC<Props> = ({ petId }) => {
  const { t, i18n } = useTranslation();
  const { data, isLoading } = usePetConsultations(petId);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const locale = i18n.language?.startsWith('pt') ? ptBR : enUS;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6 flex items-center justify-center text-muted-foreground text-sm gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> {t('petTimeline.loading')}
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-primary" /> {t('petTimeline.title')}
            <HelpHint title={t('petTimeline.helpTitle')}>
              {t('petTimeline.helpBody')}
            </HelpHint>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground py-6">
          {t('petTimeline.empty')}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-primary" />
          {t('petTimeline.title')} ({data.length})
          <HelpHint title={t('petTimeline.helpTitle')}>
            {t('petTimeline.helpBody')}
          </HelpHint>
        </CardTitle>
        <p className="text-xs text-muted-foreground">{t('petTimeline.subtitle')}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.map((c, idx) => {
          const isOpen = expanded[c.id] ?? c.is_latest;
          const { physical: physicalExamRows, complementary: complementaryExams } = partitionExams(c.exams ?? []);
          const mergedPhysicalExam = mergePhysicalExamRows(
            (c as any).physical_exam ?? null,
            physicalExamRows,
          );
          const dateStr = (() => {
            try { return format(parseISO(c.consultation_date), 'PP', { locale }); } catch { return c.consultation_date; }
          })();
          return (
            <div
              key={c.id}
              className={`relative rounded-lg border p-4 ${
                c.is_latest
                  ? 'border-primary/60 bg-primary/5 shadow-sm'
                  : 'border-border bg-background'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center pt-1">
                  <span className={`h-3 w-3 rounded-full ${c.is_latest ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                  {idx < data.length - 1 && <span className="w-px flex-1 bg-border mt-1 min-h-[24px]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{dateStr}</span>
                    {c.is_latest && (
                      <Badge variant="default" className="text-[10px]">
                        {t('petTimeline.latestBadge')}
                      </Badge>
                    )}
                    {c.weight_kg_at_visit != null && (
                      <Badge variant="outline" className="text-[10px]">
                        {c.weight_kg_at_visit} kg
                      </Badge>
                    )}
                    {c.body_condition_score != null && (
                      <Badge variant="outline" className="text-[10px]">
                        ECC {c.body_condition_score}/9
                      </Badge>
                    )}
                  </div>
                  {c.chief_complaint && (
                    <p className="text-sm text-foreground mb-1">
                      <span className="font-medium text-xs uppercase text-muted-foreground mr-1">
                        {t('petTimeline.reason')}:
                      </span>
                      {c.chief_complaint}
                    </p>
                  )}
                  {isOpen && (
                    <div className="mt-2 space-y-2 text-sm">
                      {/* 1) Exame físico estruturado (com fallback texto livre) */}
                      <PhysicalExamBlock
                        exam={mergedPhysicalExam as PhysicalExam}
                        fallbackText={c.clinical_exam}
                      />

                      {/* 2) Exames complementares com faixa de referência canina */}
                      {complementaryExams.length > 0 ? (
                        <ExamResultsWithReferences exams={complementaryExams} />
                      ) : (
                        <div>
                          <p className="text-xs uppercase text-muted-foreground mb-1">
                            {t('examResults.title')}
                          </p>
                          <p className="text-xs text-muted-foreground italic">
                            {t('examResults.empty', {
                              defaultValue: 'Sem exames complementares (sangue, imagem, urina) registrados nesta consulta.',
                            })}
                          </p>
                        </div>
                      )}

                      {/* 3) Suspeita / Diagnóstico (texto cru do vet) + interpretação LLM */}
                      {(c.assessment || (c as any).assessment_interpretation) && (
                        <div className="border-l-2 border-primary/60 pl-3 py-1 bg-primary/5 rounded-sm">
                          <p className="text-xs uppercase text-muted-foreground font-semibold">
                            {t('petTimeline.assessmentTitle', { defaultValue: 'Suspeita / Diagnóstico' })}
                          </p>
                          {c.assessment && <p>{c.assessment}</p>}
                          <AssessmentInterpretation
                            data={(c as any).assessment_interpretation as AssessmentInterpretationData | null}
                          />
                        </div>
                      )}
                      {c.plan && (
                        <div>
                          <p className="text-xs uppercase text-muted-foreground">
                            {t('petTimeline.planTitle', { defaultValue: 'Plano / Conduta' })}
                          </p>
                          <p>{c.plan}</p>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {c.conditions.length > 0 && (
                          <Badge variant="secondary" className="gap-1">
                            <Stethoscope className="h-3 w-3" />
                            {c.conditions.length} {t('petTimeline.diagnoses')}
                          </Badge>
                        )}
                        {c.medications.length > 0 && (
                          <Badge variant="secondary" className="gap-1">
                            <Pill className="h-3 w-3" />
                            {c.medications.length} {t('petTimeline.medsAdded')}
                          </Badge>
                        )}
                        {complementaryExams.length > 0 && (
                          <Badge variant="secondary" className="gap-1">
                            <TestTube className="h-3 w-3" />
                            {complementaryExams.length} {t('petTimeline.examsAdded')}
                          </Badge>
                        )}
                        {c.notes.length > 0 && (
                          <Badge variant="secondary" className="gap-1">
                            <FileText className="h-3 w-3" />
                            {c.notes.length} {t('petTimeline.notesAdded')}
                          </Badge>
                        )}
                      </div>
                      {c.conditions.length > 0 && (
                        <ul className="text-xs text-muted-foreground list-disc pl-5">
                          {c.conditions.map((cd: any) => (
                            <li key={cd.id}>
                              {cd.condition_name} {cd.severity ? `· ${cd.severity}` : ''} {cd.status ? `· ${cd.status}` : ''}
                            </li>
                          ))}
                        </ul>
                      )}
                      {c.medications.length > 0 && (
                        <ul className="text-xs text-muted-foreground list-disc pl-5">
                          {c.medications.map((m: any) => (
                            <li key={m.id}>
                              {m.medication_name} {m.dosage ? `· ${m.dosage}` : ''} {m.frequency ? `· ${m.frequency}` : ''}
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* 4) Quadro amarelo: interpretação automática (tags + síntese + termos canônicos) */}
                      <ConsultationMachineSummary
                        tags={(c as any).tags as string[] | null}
                        machineSummary={(c as any).machine_summary as string | null}
                        interpretation={(c as any).assessment_interpretation as AssessmentInterpretationData | null}
                      />
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1 mt-1 text-xs"
                    onClick={() => setExpanded((prev) => ({ ...prev, [c.id]: !isOpen }))}
                  >
                    {isOpen ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                    {isOpen ? t('petTimeline.collapse') : t('petTimeline.expand')}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default PetConsultationsTimeline;