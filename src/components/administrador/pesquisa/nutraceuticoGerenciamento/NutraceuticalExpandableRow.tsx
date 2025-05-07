
import React from 'react';
import MainRow from './expandableRow/MainRow';
import ExpandedContent from './expandableRow/ExpandedContent';
import ErrorRow from './expandableRow/ErrorRow';

interface NutraceuticalExpandableRowProps {
  nutraceutical: any;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEditClick?: (nutraceutical: any) => void;
  onDeleteClick?: (id: string) => void;
  onManageRelationships?: (nutraceutical: any) => void;
}

const NutraceuticalExpandableRow: React.FC<NutraceuticalExpandableRowProps> = ({
  nutraceutical,
  isExpanded,
  onToggleExpand,
  onEditClick,
  onDeleteClick,
  onManageRelationships
}) => {
  // Verificação de segurança para garantir que o nutraceutical existe
  if (!nutraceutical || typeof nutraceutical !== 'object') {
    return <ErrorRow />;
  }

  return (
    <>
      {/* Linha principal */}
      <MainRow
        nutraceutical={nutraceutical}
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
        onEditClick={onEditClick}
        onDeleteClick={onDeleteClick}
        onManageRelationships={onManageRelationships}
      />
      
      {/* Conteúdo expandido */}
      {isExpanded && <ExpandedContent nutraceutical={nutraceutical} />}
    </>
  );
};

export default NutraceuticalExpandableRow;
