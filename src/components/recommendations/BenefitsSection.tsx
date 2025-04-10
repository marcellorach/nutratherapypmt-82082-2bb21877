
import React from 'react';

interface BenefitsSectionProps {
  benefits: string[];
}

const BenefitsSection: React.FC<BenefitsSectionProps> = ({ benefits }) => {
  return (
    <div>
      <p className="text-sm font-medium">Benefícios esperados:</p>
      <ul className="list-disc list-inside text-sm">
        {benefits.map((benefit, index) => (
          <li key={index}>{benefit}</li>
        ))}
      </ul>
    </div>
  );
};

export default BenefitsSection;
