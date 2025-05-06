
import React from 'react';
import { DialogContentProps } from './types';
import { BasicInfoSection, RelationshipSection, RelationsList } from './FormSections';

const DialogContent: React.FC<DialogContentProps> = ({
  isCreate,
  formData,
  handleFormChange,
  handleOutcomeChange,
  handleEfficacyChange,
  handleStudyChange,
  handleAddRelation,
  handleRemoveRelation,
  relations,
  studies,
  outcomes,
  studiesLoading,
  selectedStudies,
  handleStudiesDropped
}) => {
  return (
    <div className="grid gap-4 py-4">
      <BasicInfoSection formData={formData} handleFormChange={handleFormChange} />
      
      <RelationshipSection 
        formData={formData}
        handleFormChange={handleFormChange}
        handleOutcomeChange={handleOutcomeChange}
        handleEfficacyChange={handleEfficacyChange}
        handleAddRelation={handleAddRelation}
        outcomes={outcomes}
        studies={studies}
        studiesLoading={studiesLoading}
        selectedStudies={selectedStudies}
        handleStudiesDropped={handleStudiesDropped}
      />
      
      <RelationsList relations={relations} handleRemoveRelation={handleRemoveRelation} />
    </div>
  );
};

export default DialogContent;
