
import { MouseEvent } from 'react';

export interface Nutraceutical {
  id?: string;
  name: string;
  description?: string;
  source?: string;
  dosage?: string;
  chemical_compound?: string;
  contraindications?: string[];
  outcome_id?: string;
}

export interface NutraceuticalRelation {
  outcome_id: string;
  efficacy_score: number;
  notes?: string;
  studies?: string[];
}

export interface NutraceuticalFormData extends Nutraceutical {
  relations: NutraceuticalRelation[];
}

export interface Study {
  id: string;
  title: string;
  journal?: string;
  year?: number;
  url?: string;
}

export interface Outcome {
  id: string;
  name: string;
}

export interface FormDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isCreate: boolean;
  formData: NutraceuticalFormData;
  handleFormChange: (field: keyof Nutraceutical, value: any) => void;
  handleOutcomeChange: (relationIndex: number, value: string) => void;
  handleEfficacyChange: (relationIndex: number, value: number) => void;
  handleStudyChange: (relationIndex: number, studyId: string, checked: boolean) => void;
  handleAddRelation: () => void;
  handleRemoveRelation: (index: number, e: MouseEvent) => void;
  submitAction: () => void;
  relations: NutraceuticalRelation[];
  studies: Study[];
  outcomes: Outcome[];
  studiesLoading: boolean;
  selectedStudies: {[key: number]: string[]};
  handleStudiesDropped?: (acceptedFiles: File[], relationIndex: number) => void;
}
