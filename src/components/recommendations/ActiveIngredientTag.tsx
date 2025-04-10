
import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { Edit2, X, Info } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Nutraceutical } from '@/types';

interface ActiveIngredientTagProps {
  name: string;
  quantity: string;
  originalIndex: number;
  nutraceutical: Nutraceutical;
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
  efficacy: number;
  onEfficacyChange: (index: number, value: number) => void;
  onQuantityChange: (index: number, quantity: string) => void;
}

const ActiveIngredientTag: React.FC<ActiveIngredientTagProps> = ({
  name,
  quantity,
  originalIndex,
  nutraceutical,
  onEdit,
  onRemove,
  efficacy,
  onEfficacyChange,
  onQuantityChange
}) => {
  // Iniciar o slider em posição diferente para cada ingrediente usando o índice
  const initialSlider = 10 + ((originalIndex % 3) * 10); // Posições diferentes: 10, 20, 30
  const [sliderValue, setSliderValue] = useState([initialSlider]);
  const [currentQuantity, setCurrentQuantity] = useState(quantity);
  
  // Extrair o valor numérico e a unidade do formato "10mg"
  useEffect(() => {
    const match = quantity.match(/(\d+)(\w+)/);
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2];
      setCurrentQuantity(`${value}${unit}`);
    }
  }, [quantity]);

  // Calcular a eficácia não linearmente com base no valor do slider
  // Fórmula não linear: eficácia = 1 + (slider/100)^2 * 2
  const calculateEfficacy = (sliderVal: number) => {
    const baseEfficacy = 1;
    const maxIncrease = 2; // Máximo incremento de eficácia
    const nonLinearFactor = Math.pow(sliderVal / 100, 2) * maxIncrease;
    return Math.min(baseEfficacy + nonLinearFactor, 5); // Limitar ao máximo de 5
  };

  const handleSliderChange = (value: number[]) => {
    setSliderValue(value);
    const sliderVal = value[0];
    
    // Calcular nova eficácia usando fórmula não linear
    const newEfficacy = calculateEfficacy(sliderVal);
    onEfficacyChange(originalIndex, newEfficacy);
    
    // Calcular nova quantidade (5 a 50mg) baseada no valor do slider
    const match = currentQuantity.match(/(\d+)(\w+)/);
    if (match) {
      const unit = match[2];
      const newQuantityValue = Math.round(5 + (sliderVal / 100) * 45); // 5mg a 50mg
      const newQuantity = `${newQuantityValue}${unit}`;
      setCurrentQuantity(newQuantity);
      onQuantityChange(originalIndex, newQuantity);
    }
  };

  useEffect(() => {
    // Aplicar valor de eficácia inicial (1) mas manter posição do slider variada
    const initialEfficacy = calculateEfficacy(initialSlider);
    onEfficacyChange(originalIndex, initialEfficacy);
    
    // Também atualizar a quantidade correspondente ao slider inicial
    const match = quantity.match(/(\d+)(\w+)/);
    if (match) {
      const unit = match[2];
      const newQuantityValue = Math.round(5 + (initialSlider / 100) * 45);
      const newQuantity = `${newQuantityValue}${unit}`;
      setCurrentQuantity(newQuantity);
      onQuantityChange(originalIndex, newQuantity);
    }
  }, []);

  return (
    <Badge 
      variant="outline" 
      className="py-1 pl-2 pr-1 flex items-center gap-1 bg-slate-50"
    >
      <div className="flex flex-col w-full">
        <div className="flex items-center gap-1 w-full justify-between">
          <div className="flex items-center gap-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-5 w-5 p-0.5 hover:bg-transparent">
                  <Info size={12} className="text-blue-500" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4">
                <div className="space-y-2">
                  <h4 className="font-medium">{name}</h4>
                  <p className="text-sm text-gray-600">
                    Este princípio ativo é utilizado para tratar {nutraceutical.condition.toLowerCase()}.
                  </p>
                  
                  <div className="mt-2 space-y-1">
                    <h5 className="text-xs font-medium text-gray-500">Estudos Científicos:</h5>
                    {nutraceutical.scientificEvidence.studies.map((study, i) => (
                      <div key={i} className="text-xs flex items-start gap-1">
                        <a href={study.link} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center">
                          <span className="ml-1">{study.title} ({study.year})</span>
                        </a>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-2 flex gap-2 text-xs">
                    <Badge variant="outline" className="bg-slate-50">
                      Eficácia: {nutraceutical.scientificEvidence.efficacyScore}/5
                    </Badge>
                    <Badge variant="outline" className="bg-slate-50">
                      Sustentação: {nutraceutical.scientificEvidence.sustainabilityScore}/5
                    </Badge>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            <span>{name} ({currentQuantity})</span>
          </div>
          <div className="flex">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 p-0.5 hover:bg-slate-200" 
              onClick={() => onEdit(originalIndex)}
            >
              <Edit2 size={14} className="text-blue-500" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 p-0.5 hover:bg-slate-200" 
              onClick={() => onRemove(originalIndex)}
            >
              <X size={14} className="text-red-500" />
            </Button>
          </div>
        </div>
        
        <div className="mt-2 px-1 w-full flex items-center gap-2">
          <span className="text-xs text-gray-500 min-w-14">Eficácia: {calculateEfficacy(sliderValue[0]).toFixed(1)}</span>
          <Slider
            value={sliderValue}
            max={100}
            step={1}
            className="w-full max-w-32"
            onValueChange={handleSliderChange}
          />
        </div>
      </div>
    </Badge>
  );
};

export default ActiveIngredientTag;
