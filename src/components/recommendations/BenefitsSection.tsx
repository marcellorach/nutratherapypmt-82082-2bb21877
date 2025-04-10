
import React from 'react';

interface BenefitsSectionProps {
  benefits: string[];
}

const BenefitsSection: React.FC<BenefitsSectionProps> = ({ benefits }) => {
  return (
    <div>
      <p className="text-sm font-medium">Benefícios esperados:</p>
      <ul className="list-disc list-inside text-sm">
        {benefits.slice(0, 2).map((benefit, index) => (
          <li key={index}>{benefit}</li>
        ))}
        {benefits.length > 2 && (
          <li>+ {benefits.length - 2} outros</li>
        )}
      </ul>
    </div>
  );
};

export default BenefitsSection;
