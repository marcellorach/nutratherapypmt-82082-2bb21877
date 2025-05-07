
import React from 'react';

interface CardFooterProps {
  filteredCount: number;
  totalCount: number;
}

const CardFooterComponent: React.FC<CardFooterProps> = ({
  filteredCount,
  totalCount
}) => {
  return (
    <div className="text-sm text-muted-foreground">
      {filteredCount} de {totalCount} nutracêuticos
    </div>
  );
};

export default CardFooterComponent;
