
export interface StudyPdfFile extends File {
  preview?: string;
  uploadProgress: number; // Definido explicitamente como number
  processingState: 'waiting' | 'uploading' | 'processing' | 'success' | 'error';
  error?: string;
  studyId: string;
  nutraceuticalAssociation?: string;
  conditionAssociation?: string;
}

export interface PdfFileItemProps {
  file: StudyPdfFile;
  index: number;
  onNutraceuticalChange: (index: number, value: string) => void;
  onConditionChange: (index: number, value: string) => void;
  onRemove: (index: number) => void;
  isSubmitting: boolean;
}
