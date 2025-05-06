
import { FormData, Relation } from '../types';

export interface FormSectionsProps {
  formData: FormData;
  handleFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleOutcomeChange: (value: string) => void;
  handleEfficacyChange: (value: number[]) => void;
  handleAddRelation: () => void;
  outcomes: any[];
  studies: any[];
  studiesLoading?: boolean;
  selectedStudies?: string[];
  handleStudiesDropped?: (studyIds: string[]) => void;
}

export interface DialogContentProps {
  isCreate: boolean;
  formData: FormData;
  handleFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleOutcomeChange: (value: string) => void;
  handleEfficacyChange: (value: number[]) => void;
  handleStudyChange: (value: string) => void;
  handleAddRelation: () => void;
  handleRemoveRelation: (index: number) => void;
  relations: Relation[];
  studies: any[];
  outcomes: any[];
  studiesLoading?: boolean;
  selectedStudies?: string[];
  handleStudiesDropped?: (studyIds: string[]) => void;
}
