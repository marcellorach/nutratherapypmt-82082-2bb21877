import { Sugestao, RecursosNecessarios, DadosAmostra } from '../types/sugestoes';

/**
 * Helper para obter dados localizados de uma sugestão
 * Retorna os campos no idioma selecionado (pt ou en)
 */
export const getLocalizedSugestao = (sugestao: Sugestao, language: string): Sugestao => {
  const isEnglish = language === 'en';
  
  return {
    ...sugestao,
    // Mantém campos originais _pt e _en
    titulo_pt: sugestao.titulo_pt,
    titulo_en: sugestao.titulo_en,
    raciocinio_pt: sugestao.raciocinio_pt,
    raciocinio_en: sugestao.raciocinio_en,
    baseado_em_pt: sugestao.baseado_em_pt,
    baseado_em_en: sugestao.baseado_em_en,
    populacao_sugerida_pt: sugestao.populacao_sugerida_pt,
    populacao_sugerida_en: sugestao.populacao_sugerida_en,
    metodologia_pt: sugestao.metodologia_pt,
    metodologia_en: sugestao.metodologia_en,
    marcadores_sugeridos_pt: sugestao.marcadores_sugeridos_pt,
    marcadores_sugeridos_en: sugestao.marcadores_sugeridos_en,
    
    // Campos de compatibilidade com valores localizados
    titulo: isEnglish && sugestao.titulo_en ? sugestao.titulo_en : sugestao.titulo_pt,
    raciocinio: isEnglish && sugestao.raciocinio_en ? sugestao.raciocinio_en : sugestao.raciocinio_pt,
    baseado_em: isEnglish && sugestao.baseado_em_en ? sugestao.baseado_em_en : sugestao.baseado_em_pt,
    populacao_sugerida: isEnglish && sugestao.populacao_sugerida_en ? sugestao.populacao_sugerida_en : sugestao.populacao_sugerida_pt,
    metodologia: isEnglish && sugestao.metodologia_en ? sugestao.metodologia_en : sugestao.metodologia_pt,
    marcadores_sugeridos: isEnglish && sugestao.marcadores_sugeridos_en ? sugestao.marcadores_sugeridos_en : sugestao.marcadores_sugeridos_pt,
    
    // Localiza dados de amostra se existirem
    dados_amostra: sugestao.dados_amostra ? getLocalizedDadosAmostra(sugestao.dados_amostra, language) : undefined,
    
    // Localiza recursos necessários se existirem
    recursos_necessarios: sugestao.recursos_necessarios ? getLocalizedRecursos(sugestao.recursos_necessarios, language) : undefined
  };
};

/**
 * Helper para localizar dados de amostra
 */
const getLocalizedDadosAmostra = (dados: DadosAmostra, language: string): DadosAmostra => {
  const isEnglish = language === 'en';
  
  return {
    ...dados,
    periodo_analise_pt: dados.periodo_analise_pt,
    periodo_analise_en: dados.periodo_analise_en,
    // Campo de compatibilidade com valor localizado
    periodo_analise: isEnglish && dados.periodo_analise_en ? dados.periodo_analise_en : dados.periodo_analise_pt
  };
};

/**
 * Helper para localizar recursos necessários
 */
const getLocalizedRecursos = (recursos: RecursosNecessarios, language: string): RecursosNecessarios => {
  const isEnglish = language === 'en';
  
  return {
    ...recursos,
    cronograma_exames: {
      pre_estudo_pt: recursos.cronograma_exames.pre_estudo_pt,
      pre_estudo_en: recursos.cronograma_exames.pre_estudo_en,
      durante_estudo_pt: recursos.cronograma_exames.durante_estudo_pt,
      durante_estudo_en: recursos.cronograma_exames.durante_estudo_en,
      pos_estudo_pt: recursos.cronograma_exames.pos_estudo_pt,
      pos_estudo_en: recursos.cronograma_exames.pos_estudo_en,
      acompanhamento_pt: recursos.cronograma_exames.acompanhamento_pt,
      acompanhamento_en: recursos.cronograma_exames.acompanhamento_en,
      // Campos de compatibilidade com valores localizados
      pre_estudo: isEnglish && recursos.cronograma_exames.pre_estudo_en ? recursos.cronograma_exames.pre_estudo_en : recursos.cronograma_exames.pre_estudo_pt,
      durante_estudo: isEnglish && recursos.cronograma_exames.durante_estudo_en ? recursos.cronograma_exames.durante_estudo_en : recursos.cronograma_exames.durante_estudo_pt,
      pos_estudo: isEnglish && recursos.cronograma_exames.pos_estudo_en ? recursos.cronograma_exames.pos_estudo_en : recursos.cronograma_exames.pos_estudo_pt,
      acompanhamento: isEnglish && recursos.cronograma_exames.acompanhamento_en ? recursos.cronograma_exames.acompanhamento_en : recursos.cronograma_exames.acompanhamento_pt
    },
    populacao_estudo: {
      ...recursos.populacao_estudo,
      racas_cardiacas: recursos.populacao_estudo.racas_cardiacas?.map(raca => ({
        ...raca,
        predisposicao_pt: raca.predisposicao_pt,
        predisposicao_en: raca.predisposicao_en,
        // Campo de compatibilidade com valor localizado
        predisposicao: isEnglish && raca.predisposicao_en ? raca.predisposicao_en : raca.predisposicao_pt
      }))
    }
  };
};
