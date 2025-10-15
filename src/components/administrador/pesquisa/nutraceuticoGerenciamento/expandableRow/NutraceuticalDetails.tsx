
import React from 'react';

interface NutraceuticalDetailsProps {
  description?: string;
  chemical_compound?: string;
  source?: string;
  dosage?: string;
}

const NutraceuticalDetails: React.FC<NutraceuticalDetailsProps> = ({
  description,
  chemical_compound,
  source,
  dosage
}) => {
  return (
    <div className="space-y-2">
      <h4 className="font-medium text-sm">Detalhes</h4>
      <div className="text-sm">
        <p><span className="font-medium">Descrição:</span> {description || "Não definida"}</p>
        <p><span className="font-medium">Composto Químico:</span> {chemical_compound || "Não definido"}</p>
        <p><span className="font-medium">Origem:</span> {source || "Não definida"}</p>
        <p><span className="font-medium">Dosagem:</span> {dosage || "Não definida"}</p>
      </div>
    </div>
  );
};

export default NutraceuticalDetails;
