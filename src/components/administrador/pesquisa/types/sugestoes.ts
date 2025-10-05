
import { ReactNode } from 'react';

// Definição dos estágios da cadeia de aprovação
export interface ApprovalStage {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export interface ApprovalStep {
  stage: string;
  approved: boolean | null;
  date: string | null;
}

export type OrigemSugestao = 'ia' | 'comite_cientifico' | 'externa';

export interface DadosAmostra {
  total_caes: number;
  usuarios_tratamento: number;
  grupo_controle: number;
  periodo_analise_pt: string;
  periodo_analise_en?: string;
  resultados_observacionais: {
    reducao_eventos_cardiovasculares: string;
    melhora_funcao_renal: string;
    reducao_mortalidade: string;
  };
  // Campos temporários para compatibilidade (deprecated)
  periodo_analise?: string;
}

export interface RecursosNecessarios {
  populacao_estudo: {
    total_caes: number;
    idade: string;
    grupo_placebo: number;
    grupo_tratamento: number;
    duracao_meses: number;
    distribuicao_racas: {
      pequeno_porte: number;
      medio_porte: number;
      grande_porte: number;
    };
    racas_cardiacas?: {
      raca: string;
      voluntarios: number;
      predisposicao_pt: string;
      predisposicao_en?: string;
      // Campo temporário para compatibilidade (deprecated)
      predisposicao?: string;
    }[];
  };
  cronograma_exames: {
    pre_estudo_pt: string[];
    pre_estudo_en?: string[];
    durante_estudo_pt: string[];
    durante_estudo_en?: string[];
    pos_estudo_pt: string[];
    pos_estudo_en?: string[];
    acompanhamento_pt: string[];
    acompanhamento_en?: string[];
    // Campos temporários para compatibilidade (deprecated)
    pre_estudo?: string[];
    durante_estudo?: string[];
    pos_estudo?: string[];
    acompanhamento?: string[];
  };
  custos_estimados: {
    exames_laboratoriais: number;
    ultrassons: number;
    medicamentos: number;
    pessoal: number;
    total: number;
    custo_por_animal_mes: number;
  };
}

export interface Sugestao {
  id: string;
  titulo_pt: string;
  titulo_en?: string;
  confianca: number;
  baseado_em_pt: string[];
  baseado_em_en?: string[];
  populacao_sugerida_pt: string;
  populacao_sugerida_en?: string;
  metodologia_pt: string;
  metodologia_en?: string;
  marcadores_sugeridos_pt: string[];
  marcadores_sugeridos_en?: string[];
  raciocinio_pt: string;
  raciocinio_en?: string;
  status: 'nova' | 'aprovada' | 'rejeitada' | 'em_analise';
  approvalChain: ApprovalStep[];
  origem: OrigemSugestao;
  dados_amostra?: DadosAmostra;
  recursos_necessarios?: RecursosNecessarios;
  // Campos temporários para compatibilidade (deprecated)
  titulo?: string;
  baseado_em?: string[];
  populacao_sugerida?: string;
  metodologia?: string;
  marcadores_sugeridos?: string[];
  raciocinio?: string;
}
