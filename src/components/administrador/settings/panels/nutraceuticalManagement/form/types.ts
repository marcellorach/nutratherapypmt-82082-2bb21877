
import { Study, Outcome, NutraceuticalFormData, NutraceuticalRelation, Nutraceutical } from '../types';

export interface FormSectionsProps {
  formData: any;
  handleFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleOutcomeChange?: (value: string) => void;
  handleEfficacyChange?: (value: number[]) => void;
  handleStudyChange?: (value: string) => void;
  handleAddRelation?: () => void;
  studies?: Study[];
  outcomes?: Outcome[];
  studiesLoading?: boolean;
  selectedStudies?: any;
  handleStudiesDropped?: (studyIds: string[]) => void;
}
