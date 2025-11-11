
import { AIInsight } from './types';

export const mockInsights: AIInsight[] = [
  {
    id: 'insight-001',
    type: 'longitudinal-discovery',
    title: 'Alternating SGLT2 inhibitors protocol (dapagliflozin/empagliflozin) for cardiovascular and renal protection in non-diabetic dogs',
    confidence: 92,
    discoveredAt: '2025-02-10',
    overview: {
      summary: 'Longitudinal analysis identified desensitization patterns in continuous SGLT2 use. Alternating mechanism may prevent desensitization while maintaining cardioprotective and nephroprotective efficacy.',
      basedOn: [
        'Longitudinal epidemiological analysis of 18,347 dogs on the platform (Jan/2023 - Dec/2024)',
        'Meta-analysis of DECLARE-TIMI 58 and DAPA-CKD studies translated to canine models',
        'Machine learning algorithms identified desensitization patterns in continuous use',
        'Comparative pharmacokinetic modeling of dapagliflozin vs empagliflozin in canines'
      ],
      methodology: 'Triple-blind randomized study with alternating protocol: dapagliflozin 0.1mg/kg/day (12 days) → empagliflozin 0.08mg/kg/day (12 days) → rest (6 days), in monthly cycles for 18 months vs placebo',
      markers: [
        'Cardiac biomarkers (NT-proBNP, troponin I)',
        'Renal function (creatinine, SDMA, proteinuria)',
        'All-cause mortality',
        'Major adverse cardiovascular events (MACE)',
        'SGLT2 inhibitor sensitivity markers'
      ]
    },
    evidence: {
      dataSource: 'Platform longitudinal database + clinical monitoring',
      sampleSize: 18347,
      timeframe: 'Jan/2023 - Dec/2024',
      statisticalSignificance: 'p < 0.01, CI 95%',
      findings: [
        'Dogs with cardiac predisposition showed 34% reduction in cardiac events with alternating protocol',
        'Renal markers improved by 28% compared to continuous single-drug protocol',
        'No significant desensitization detected in alternating group vs 19% in continuous group',
        'Higher compliance rates (92%) in alternating vs continuous (78%)'
      ]
    },
    resources: {
      studyPopulation: {
        totalDogs: 200,
        ageRange: '5-8 years',
        duration: '18 months',
        groups: { placebo: 100, treatment: 100 }
      },
      sizeDistribution: { small: 25, medium: 45, large: 30 },
      breeds: [
        { name: 'Cavalier King Charles Spaniel', condition: 'Degenerative mitral valve disease', volunteers: 45 },
        { name: 'Dobermann', condition: 'Dilated cardiomyopathy', volunteers: 35 },
        { name: 'Golden Retriever', condition: 'Cardiomyopathy and subaortic stenosis', volunteers: 40 }
      ]
    },
    approvalChain: [
      { stage: 'Scientific Supervision', status: 'approved', date: '10/01/2025' },
      { stage: 'Scientific Committee', status: 'approved', date: '18/01/2025' },
      { stage: 'Ethics Committee', status: 'approved', date: '25/01/2025' },
      { stage: 'Direction', status: 'approved', date: '02/02/2025' }
    ],
    recommendation: {
      action: 'Initiate triple-blind randomized controlled trial',
      priority: 'high',
      impact: 'Potential breakthrough in canine cardiovascular and renal protection with reduced desensitization risk'
    }
  },
  {
    id: 'insight-002',
    type: 'efficacy-analysis',
    title: 'Glucosamine + Chondroitin efficacy validation in 3,421 dogs with osteoarthritis (12-month follow-up)',
    confidence: 87,
    discoveredAt: '2025-02-01',
    overview: {
      summary: 'Real-world monitoring of 3,421 dogs diagnosed with osteoarthritis and prescribed Glucosamine (1500mg) + Chondroitin (1200mg) showed 67% clinical improvement in mobility scores after 12 months.',
      basedOn: [
        'Platform clinical monitoring data (Jan/2024 - Jan/2025)',
        'Veterinary mobility assessments (0-10 scale)',
        'Owner-reported quality of life surveys',
        'Comparison with control group (n=1,205) not receiving supplementation'
      ]
    },
    evidence: {
      dataSource: 'Platform clinical monitoring + veterinary assessments',
      sampleSize: 3421,
      timeframe: 'Jan/2024 - Jan/2025',
      statisticalSignificance: 'p < 0.001, CI 95%',
      findings: [
        '67% of dogs showed improvement in mobility scores (≥2 points increase)',
        'Control group showed only 23% improvement (natural variation)',
        'Medium and large breeds showed better response (72%) vs small breeds (58%)',
        'Early intervention (<6 months from diagnosis) had 81% efficacy vs late intervention 54%',
        'No significant adverse events reported'
      ]
    },
    recommendation: {
      action: 'Reinforce Glucosamine + Chondroitin as first-line intervention for canine osteoarthritis',
      priority: 'high',
      impact: 'Validates current recommendation with large-scale real-world evidence'
    }
  },
  {
    id: 'insight-003',
    type: 'new-study',
    title: 'NMN (Nicotinamide Mononucleotide) reverses age-associated cognitive decline in senior dogs (Nature Aging, Dec 2024)',
    confidence: 94,
    discoveredAt: '2024-12-15',
    overview: {
      summary: 'Groundbreaking study published in Nature Aging demonstrates that NMN supplementation (250mg/day) for 6 months significantly improved cognitive function, memory, and spatial awareness in dogs aged 10+ years.',
      basedOn: [
        'Published study: "NMN supplementation restores NAD+ levels and reverses cognitive aging in Canis familiaris" (Nature Aging, Dec 2024)',
        'Double-blind, placebo-controlled trial with n=156 senior dogs',
        'Cognitive assessments using Canine Cognitive Dysfunction Scale (CCDS)',
        'Biomarker analysis: NAD+ levels, telomere length, inflammatory markers'
      ]
    },
    evidence: {
      dataSource: 'Published peer-reviewed study (Nature Aging)',
      sampleSize: 156,
      timeframe: '6 months',
      statisticalSignificance: 'p < 0.0001, effect size d=1.2',
      findings: [
        'CCDS scores improved by 42% in NMN group vs 8% in placebo',
        'NAD+ levels increased by 68% after 6 months',
        'Telomere attrition reduced by 31%',
        'Inflammatory markers (IL-6, TNF-α) decreased by 38%',
        'No adverse events; excellent tolerability profile'
      ]
    },
    recommendation: {
      action: 'Integrate NMN into longevity and cognitive health protocols for senior dogs',
      priority: 'critical',
      impact: 'First conclusive evidence of cognitive aging reversal in dogs; potential paradigm shift in geriatric veterinary care'
    }
  }
];
