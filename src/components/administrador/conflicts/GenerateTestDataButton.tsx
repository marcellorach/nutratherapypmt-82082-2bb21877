import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlaskConical, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface GeneratedData {
  studies: number;
  triplets: number;
  claims: number;
  conflicts: number;
}

const GenerateTestDataButton: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState<GeneratedData | null>(null);

  const generateTestData = async () => {
    setIsGenerating(true);
    setGeneratedData(null);

    try {
      // Test nutraceuticals and conditions for our mock studies
      const testPairs = [
        { nutraceutical: 'Curcumin', condition: 'Osteoarthritis', doses: [50, 100, 200, 500] },
        { nutraceutical: 'Omega-3', condition: 'Cognitive Decline', doses: [30, 50, 100, 150] },
        { nutraceutical: 'Glucosamine', condition: 'Hip Dysplasia', doses: [20, 40, 60, 100] },
        { nutraceutical: 'Resveratrol', condition: 'Cardiac Health', doses: [10, 25, 50, 100] },
        { nutraceutical: 'CoQ10', condition: 'Mitochondrial Function', doses: [5, 10, 30, 50] }
      ];

      const studiesCreated: string[] = [];
      const tripletsCreated: string[] = [];
      const claimsCreated: string[] = [];

      // Create mock studies
      for (let i = 0; i < testPairs.length; i++) {
        const pair = testPairs[i];
        
        // Create 2-3 studies per pair with different dosages
        const studyCount = Math.min(pair.doses.length, 3);
        
        for (let j = 0; j < studyCount; j++) {
          const studyId = `test_study_${Date.now()}_${i}_${j}`;
          const year = 2020 + j;
          
          // Insert processed study
          const { data: study, error: studyError } = await supabase
            .from('processed_studies')
            .insert({
              study_id: studyId,
              title: `Effect of ${pair.nutraceutical} on ${pair.condition} in Dogs - Study ${j + 1}`,
              original_filename: `test_${pair.nutraceutical.toLowerCase()}_${j + 1}.pdf`,
              storage_path: `test/${studyId}.pdf`,
              import_type: 'test_data',
              kanban_status: 'extracted',
              year: year,
              journal: `Journal of Veterinary ${j === 0 ? 'Medicine' : j === 1 ? 'Science' : 'Research'}`,
              authors: [`Dr. Test Author ${j + 1}`, 'AI Generated Data'],
              description: `Simulated study testing ${pair.nutraceutical} at ${pair.doses[j]}mg/kg for ${pair.condition}`
            })
            .select('id')
            .single();

          if (studyError) {
            console.error('Error creating study:', studyError);
            continue;
          }

          studiesCreated.push(study.id);

          // Create triplet extraction
          const { data: triplet, error: tripletError } = await supabase
            .from('triplet_extractions')
            .insert({
              study_id: study.id,
              subject_name: pair.nutraceutical,
              subject_type: 'nutraceutical',
              subject_layer: 'layer_0_compound',
              predicate: 'TREATS',
              object_name: pair.condition,
              object_type: 'condition',
              object_layer: 'layer_4_outcome',
              species_context: ['dog'],
              dose_range: {
                min: pair.doses[j] * 0.8,
                max: pair.doses[j] * 1.2,
                unit: 'mg/kg',
                frequency: 'daily'
              },
              extraction_confidence: 0.85 + (j * 0.03),
              llm_confidence: 0.8 + (j * 0.05),
              curation_status: 'approved',
              evidence_level: j === 0 ? 'moderate' : j === 1 ? 'high' : 'low'
            })
            .select('id')
            .single();

          if (tripletError) {
            console.error('Error creating triplet:', tripletError);
            continue;
          }

          tripletsCreated.push(triplet.id);

          // Create evidence claim
          const { data: claim, error: claimError } = await supabase
            .from('evidence_claims')
            .insert({
              subject_name: pair.nutraceutical,
              subject_type: 'nutraceutical',
              predicate: 'TREATS',
              object_name: pair.condition,
              object_type: 'condition',
              species_context: ['dog'],
              dose_value: pair.doses[j],
              dose_min: pair.doses[j] * 0.8,
              dose_max: pair.doses[j] * 1.2,
              dose_unit: 'mg/kg',
              dose_frequency: 'daily',
              study_id: study.id,
              triplet_id: triplet.id,
              study_quality_score: 0.7 + (j * 0.1),
              study_year: year,
              extraction_confidence: 0.85 + (j * 0.03)
            })
            .select('id')
            .single();

          if (claimError) {
            console.error('Error creating claim:', claimError);
            continue;
          }

          claimsCreated.push(claim.id);
        }
      }

      // Create conflict records for claims with different dosages
      const conflictsCreated: string[] = [];
      
      for (const pair of testPairs) {
        // Find claims for this pair
        const { data: pairClaims } = await supabase
          .from('evidence_claims')
          .select('id, dose_value, dose_min, dose_max, study_id')
          .eq('subject_name', pair.nutraceutical)
          .eq('object_name', pair.condition)
          .in('id', claimsCreated);

        if (pairClaims && pairClaims.length >= 2) {
          // Calculate variance
          const doses = pairClaims.map(c => c.dose_value).filter(d => d !== null) as number[];
          const mean = doses.reduce((a, b) => a + b, 0) / doses.length;
          const variance = doses.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / doses.length;
          const cv = Math.sqrt(variance) / mean;
          
          const conflictLevel = cv > 0.5 ? 'high' : cv > 0.25 ? 'medium' : 'low';

          const { data: conflict, error: conflictError } = await supabase
            .from('evidence_conflicts')
            .insert({
              subject_name: pair.nutraceutical,
              subject_type: 'nutraceutical',
              predicate: 'TREATS',
              object_name: pair.condition,
              object_type: 'condition',
              species_context: ['dog'],
              conflict_level: conflictLevel,
              claim_count: pairClaims.length,
              study_count: pairClaims.length,
              claim_ids: pairClaims.map(c => c.id),
              variance_coefficient: cv,
              agreement_score: 1 - cv,
              status: 'pending',
              ai_recommended_action: conflictLevel === 'high' 
                ? 'human_review_required' 
                : conflictLevel === 'medium' 
                  ? 'weighted_average_suggested'
                  : 'auto_resolve_possible',
              ai_suggestion: `Detected ${conflictLevel} dosage variance (CV: ${(cv * 100).toFixed(1)}%) across ${pairClaims.length} studies for ${pair.nutraceutical} → ${pair.condition}`
            })
            .select('id')
            .single();

          if (!conflictError && conflict) {
            conflictsCreated.push(conflict.id);
          }
        }
      }

      const result: GeneratedData = {
        studies: studiesCreated.length,
        triplets: tripletsCreated.length,
        claims: claimsCreated.length,
        conflicts: conflictsCreated.length
      };

      setGeneratedData(result);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['evidence-conflicts'] });
      queryClient.invalidateQueries({ queryKey: ['processed-studies'] });
      queryClient.invalidateQueries({ queryKey: ['triplet-extractions'] });
      
      toast.success(
        t('admin.testing.success', 
          'Dados de teste gerados: {{studies}} estudos, {{conflicts}} conflitos', 
          { studies: result.studies, conflicts: result.conflicts }
        )
      );

    } catch (error) {
      console.error('Error generating test data:', error);
      toast.error(t('admin.testing.error', 'Erro ao gerar dados de teste'));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        onClick={generateTestData}
        disabled={isGenerating}
        className="w-full"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {t('admin.testing.generating', 'Gerando dados de teste...')}
          </>
        ) : (
          <>
            <FlaskConical className="h-4 w-4 mr-2" />
            {t('admin.testing.generate', 'Gerar Dados de Teste para Conflitos')}
          </>
        )}
      </Button>

      {generatedData && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-800 dark:text-green-200">
              {t('admin.testing.successTitle', 'Dados gerados com sucesso!')}
            </span>
          </div>
          <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
            <li>• {generatedData.studies} {t('admin.testing.studies', 'estudos criados')}</li>
            <li>• {generatedData.triplets} {t('admin.testing.triplets', 'triplets extraídos')}</li>
            <li>• {generatedData.claims} {t('admin.testing.claims', 'claims de evidência')}</li>
            <li>• {generatedData.conflicts} {t('admin.testing.conflicts', 'conflitos detectados')}</li>
          </ul>
          <p className="text-xs text-green-600 dark:text-green-400 mt-2">
            {t('admin.testing.checkConflicts', 'Verifique a tab "Conflitos de Evidência" para revisar os conflitos.')}
          </p>
        </div>
      )}
    </div>
  );
};

export default GenerateTestDataButton;
