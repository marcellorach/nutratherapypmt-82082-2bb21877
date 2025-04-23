
import React from "react";
import { Button } from "@/components/ui/button";

interface SciSpaceStepSelectProps {
  currentStep: number;
  setStep: (step: number) => void;
  canGoNext: boolean;
}

const steps = [
  "Meta Sumário",
  "Base de Estudos", 
  "Revisar & Submeter"
];

const SciSpaceStepSelect: React.FC<SciSpaceStepSelectProps> = ({ currentStep, setStep, canGoNext }) => (
  <div className="flex items-center justify-center space-x-2 mb-6">
    {steps.map((label, idx) => (
      <React.Fragment key={idx}>
        <Button
          size="sm"
          variant={idx === currentStep ? "default" : "outline"}
          onClick={() => idx <= currentStep && setStep(idx)}
          disabled={idx > currentStep || (idx > 0 && !canGoNext)}
        >
          <span className="w-20 truncate">{label}</span>
        </Button>
        {idx < steps.length - 1 && <span className="text-gray-300">→</span>}
      </React.Fragment>
    ))}
  </div>
);

export default SciSpaceStepSelect;
