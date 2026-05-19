
import React from 'react';
import { useTranslation } from 'react-i18next';
import { FlaskConical, AlertCircle, Link2 } from "lucide-react";
import ExtractedDataVisualization from '../../visualization/ExtractedDataVisualization';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

interface AnaliseTabProps {
  estudo: any;
}

const AnaliseTab: React.FC<AnaliseTabProps> = ({ estudo }) => {
  const { t } = useTranslation();
  const [triplets, setTriplets] = React.useState<any[] | null>(null);

  const analysisData = estudo?.analysis_data;
  const hasExtractedData = analysisData && (
    analysisData.study_population ||
    analysisData.structured_dosages?.length > 0 ||
    analysisData.biomarkers?.length > 0 ||
    analysisData.detailed_side_effects?.length > 0 ||
    analysisData.contraindications?.length > 0 ||
    analysisData.drug_interactions?.length > 0 ||
    analysisData.synergies?.length > 0
  );

  // Fallback: quando Stage 3 não rodou, mostrar resumo derivado dos triplets
  React.useEffect(() => {
    if (!hasExtractedData && estudo?.id) {
      supabase
        .from('triplet_extractions')
        .select('subject_name, subject_type, predicate, object_name, object_type, extraction_confidence')
        .eq('study_id', estudo.id)
        .order('extraction_confidence', { ascending: false })
        .limit(50)
        .then(({ data }) => setTriplets(data || []));
    } else {
      setTriplets(null);
    }
  }, [estudo?.id, hasExtractedData]);

  const groupedTriplets = React.useMemo(() => {
    if (!triplets) return null;
    const groups: Record<string, typeof triplets> = {};
    for (const t of triplets) {
      const key = t.predicate || 'OTHER';
      (groups[key] = groups[key] || []).push(t);
    }
    return groups;
  }, [triplets]);

  return (
    <div className="space-y-4">
      {!hasExtractedData ? (
        <div className="bg-yellow-50 border border-yellow-100 p-3 rounded-md text-sm">
          <p className="text-yellow-700 flex items-center">
            <FlaskConical className="h-4 w-4 mr-2" />
            {t('studies.analysis.aiProcessing')}
          </p>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-100 p-3 rounded-md text-sm">
          <p className="text-green-700 flex items-center">
            <FlaskConical className="h-4 w-4 mr-2" />
            {t('studies.analysis.dataExtracted')}
          </p>
        </div>
      )}

      {hasExtractedData && <ExtractedDataVisualization analysisData={analysisData} />}

      {/* Fallback derivado de triplets quando Stage 3 não populou os dados estruturados */}
      {!hasExtractedData && triplets && triplets.length > 0 && groupedTriplets && (
        <div className="border rounded-md p-4 space-y-3 bg-muted/30">
          <div className="flex items-center gap-2 text-sm">
            <Link2 className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {t('studies.analysis.tripletFallbackTitle', 'Resumo derivado das relações extraídas')}
            </span>
            <Badge variant="outline" className="text-xs">{triplets.length}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {t('studies.analysis.tripletFallbackHint', 'Dados estruturados (dosagens, biomarcadores, efeitos adversos) ainda não foram extraídos. Reprocesse o estudo para detalhes completos.')}
          </p>
          <div className="space-y-3">
            {Object.entries(groupedTriplets).map(([predicate, items]) => (
              <div key={predicate}>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  {predicate} <span className="text-border">·</span> {items.length}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {items.slice(0, 12).map((tr, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="text-xs font-normal"
                      title={`${tr.subject_type} → ${tr.object_type} (${Math.round((tr.extraction_confidence || 0) * 100)}%)`}
                    >
                      <span className="font-medium">{tr.subject_name}</span>
                      <span className="mx-1 text-muted-foreground">→</span>
                      <span>{tr.object_name}</span>
                    </Badge>
                  ))}
                  {items.length > 12 && (
                    <Badge variant="secondary" className="text-xs">+{items.length - 12}</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!hasExtractedData && (
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium">{t('studies.analysis.awaitingExtraction')}</h4>
            <p className="text-sm text-muted-foreground">
              {t('studies.analysis.processStudyDesc')}
            </p>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>{t('studies.analysis.useProcessButton')}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnaliseTab;
