
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
}
