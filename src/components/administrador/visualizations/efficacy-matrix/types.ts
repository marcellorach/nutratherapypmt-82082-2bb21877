
export interface MatrixCell {
  nutraceuticoId: number;
  condicaoId: number;
  efficacyScore: number;
  evidenceLevel: string;
  studyCount: number;
  description?: string;
}

export interface MatrixItem {
  id: number;
  name: string;
  description?: string;
  category: 'nutraceutico' | 'condicao';
}

export interface EfficacyMatrixProps {
  nutraceuticos: MatrixItem[];
  condicoes: MatrixItem[];
  data: MatrixCell[];
}
