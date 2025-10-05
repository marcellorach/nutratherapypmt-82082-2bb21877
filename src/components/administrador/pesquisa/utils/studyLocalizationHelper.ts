import { OngoingStudy } from '../types/studyTypes';

/**
 * Localiza um estudo com base no idioma selecionado
 * @param study - Objeto de estudo
 * @param language - Idioma ('pt' ou 'en')
 * @returns Estudo com campos localizados
 */
export function getLocalizedStudy(
  study: OngoingStudy,
  language: 'pt' | 'en'
): OngoingStudy {
  const isEnglish = language === 'en';
  
  return {
    ...study,
    title: isEnglish && study.title_en ? study.title_en : (study.title_pt || study.title || ''),
    description: isEnglish && study.description_en ? study.description_en : (study.description_pt || study.description || ''),
    objective: isEnglish && study.objective_en ? study.objective_en : (study.objective_pt || study.objective || ''),
    ageRange: isEnglish && study.ageRange_en ? study.ageRange_en : (study.ageRange_pt || study.ageRange),
    interventionType: isEnglish && study.interventionType_en ? study.interventionType_en : (study.interventionType_pt || study.interventionType),
    notes: isEnglish && study.notes_en ? study.notes_en : (study.notes_pt || study.notes),
    metrics: study.metrics?.map(metric => ({
      ...metric,
      title: isEnglish && metric.title_en ? metric.title_en : (metric.title_pt || metric.title || ''),
      description: isEnglish && metric.description_en ? metric.description_en : (metric.description_pt || metric.description)
    })),
    phases: study.phases?.map(phase => ({
      ...phase,
      name: isEnglish && phase.name_en ? phase.name_en : (phase.name_pt || phase.name || '')
    }))
  };
}
