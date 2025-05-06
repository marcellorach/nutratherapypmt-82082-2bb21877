
export interface FormData {
  name: string;
  description: string;
  dosage: string;
  source: string;
  chemical_compound: string;
  contraindications: string;
  outcome_id: string;
  efficacy_score: number;
  notes: string;
  study_id: string;
}

export interface Relation {
  outcome_id: string;
  outcome_name: string;
  efficacy_score: number;
  notes: string;
  study_id: string;
  study_name: string;
}

export interface FormDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isCreate: boolean;
  formData: FormData;
  handleFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleOutcomeChange: (value: string) => void;
  handleEfficacyChange: (value: number[]) => void;
  handleStudyChange: (value: string) => void;
  handleAddRelation: () => void;
  handleRemoveRelation: (index: number) => void;
  submitAction: () => void;
  relations: Relation[];
  studies: any[];
  outcomes: any[];
  studiesLoading?: boolean;
  handleStudiesDropped?: (studyIds: string[]) => void;
  selectedStudies?: string[];
}

export interface DeleteDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  name: string;
  onConfirm: () => void;
}

export interface NutraceuticalTableProps {
  filteredNutraceuticals: any[];
  isLoading: boolean;
  onEditClick: (nutraceutical: any) => void;
  onDeleteClick: (nutraceutical: any) => void;
  onOutcomesClick: (nutraceutical: any) => void;
  getOutcomeName: (outcomeId: string | null) => string;
}

export interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export interface OutcomesDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  nutraceutical: any;
  onComplete: () => void;
}
