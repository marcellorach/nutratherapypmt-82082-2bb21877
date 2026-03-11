import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, Database, ArrowDownToLine, ArrowUpFromLine, 
  Loader2, TrendingUp 
} from 'lucide-react';
import { useSystemGuideStats } from '@/hooks/useSystemGuideStats';
import { cn } from '@/lib/utils';

interface SystemGuideDetailPanelProps {
  sectionStep: string;
  onNavigate: (step: string) => void;
}

const ioConfig: Record<string, { inputs: string[]; outputs: string[] }> = {
  'estudos': {
    inputs: ['PDFs', 'PubMed API', 'OpenAlex API', 'DOI'],
    outputs: ['scientific_studies', 'study_embeddings'],
  },
  'processamento-ia': {
    inputs: ['scientific_studies', 'full_text'],
    outputs: ['triplet_extractions', 'evidence_claims', 'embeddings'],
  },
  'nutraceuticals-unified': {
    inputs: ['manual', 'PubChem', 'imports'],
    outputs: ['nutraceuticals', 'categories', 'conditions_map'],
  },
  'veterinary-targets': {
    inputs: ['ontology', 'studies', 'manual'],
    outputs: ['health_conditions', 'mechanisms', 'pathways', 'effects'],
  },
  'breeds-management': {
    inputs: ['manual', 'breed_databases'],
    outputs: ['breeds', 'breed_groups', 'predispositions'],
  },
  'lab-references': {
    inputs: ['manual', 'lab_guides'],
    outputs: ['lab_reference_ranges'],
  },
  'base-knowledge': {
    inputs: ['PubChem', 'KEGG', 'UniProt'],
    outputs: ['base_knowledge_candidates'],
  },
  'knowledge-graph': {
    inputs: ['all_entities', 'triplets', 'edges'],
    outputs: ['medical_knowledge_graph', 'visualizations'],
  },
  'relacoes': {
    inputs: ['triplets', 'ontology', 'claims'],
    outputs: ['hierarchical_edges', 'canonical_resolutions'],
  },
  'ontology-audit': {
    inputs: ['all_edges', 'claims', 'conflicts'],
    outputs: ['audit_reports', 'resolutions', 'quality_scores'],
  },
  'ai-insights': {
    inputs: ['knowledge_graph', 'embeddings', 'patterns'],
    outputs: ['auto_discoveries', 'taxonomy_suggestions'],
  },
  'knowledge-base-settings': {
    inputs: ['admin_config'],
    outputs: ['ai_configurations', 'pipeline_params'],
  },
};

const SystemGuideDetailPanel: React.FC<SystemGuideDetailPanelProps> = ({
  sectionStep,
  onNavigate,
}) => {
  const { t } = useTranslation();
  const { data: stats, isLoading } = useSystemGuideStats(sectionStep);
  const io = ioConfig[sectionStep] || { inputs: [], outputs: [] };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="overflow-hidden"
    >
      <div className="mt-2 rounded-lg border border-border/60 bg-muted/20 p-4 space-y-4">
        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t(`systemGuide.details.${sectionStep}`)}
        </p>

        {/* Stats */}
        <div className="flex flex-wrap gap-3">
          {isLoading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              {t('common.loading')}
            </div>
          ) : (
            stats?.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-2 rounded-md border border-border/50 bg-card px-3 py-1.5"
              >
                <TrendingUp className="h-3 w-3 text-primary" />
                <span className="text-lg font-bold text-foreground">{stat.count.toLocaleString()}</span>
                <span className="text-[11px] text-muted-foreground">
                  {t(`systemGuide.statsLabels.${stat.label}`)}
                </span>
              </div>
            ))
          )}
        </div>

        {/* I/O Diagram */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md border border-border/40 bg-card/50 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <ArrowDownToLine className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t('systemGuide.io.inputs')}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {io.inputs.map((input) => (
                <Badge
                  key={input}
                  variant="outline"
                  className="text-[10px] bg-blue-500/5 text-blue-600 border-blue-500/20"
                >
                  {input}
                </Badge>
              ))}
            </div>
          </div>
          <div className="rounded-md border border-border/40 bg-card/50 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <ArrowUpFromLine className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t('systemGuide.io.outputs')}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {io.outputs.map((output) => (
                <Badge
                  key={output}
                  variant="outline"
                  className="text-[10px] bg-emerald-500/5 text-emerald-600 border-emerald-500/20"
                >
                  {output}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <Button
          size="sm"
          onClick={() => onNavigate(sectionStep)}
          className="gap-2"
        >
          {t('systemGuide.openSection')}
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </motion.div>
  );
};

export default SystemGuideDetailPanel;
