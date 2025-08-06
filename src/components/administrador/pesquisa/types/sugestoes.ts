
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
  periodo_analise: string;
  resultados_observacionais: {
    reducao_eventos_cardiovasculares: string;
    melhora_funcao_renal: string;
    reducao_mortalidade: string;
  };
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
      predisposicao: string;
    }[];
  };
  cronograma_exames: {
    pre_estudo: string[];
    durante_estudo: string[];
    pos_estudo: string[];
    acompanhamento: string[];
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
  titulo: string;
  confianca: number;
  baseado_em: string[];
  populacao_sugerida: string;
  metodologia: string;
  marcadores_sugeridos: string[];
  raciocinio: string;
  status: 'nova' | 'aprovada' | 'rejeitada' | 'em_analise';
  approvalChain: ApprovalStep[];
  origem: OrigemSugestao;
  dados_amostra?: DadosAmostra;
  recursos_necessarios?: RecursosNecessarios;
}
