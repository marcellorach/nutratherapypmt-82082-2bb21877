
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pet } from '@/types';

interface PetCardProps {
  pet: Pet;
  onSelect?: (pet: Pet) => void;
  onViewDetails?: (pet: Pet) => void;
}

const PetCard: React.FC<PetCardProps> = ({ pet, onSelect, onViewDetails }) => {
  const species = pet.species === 'Cachorro' ? '🐕' : pet.species === 'Gato' ? '🐈' : '🐾';
  
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <span className="text-2xl">{species}</span>
          {pet.name}
        </CardTitle>
        <CardDescription>{pet.breed}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 text-sm">
          <p><span className="font-semibold">Idade:</span> {pet.age} anos</p>
          <p><span className="font-semibold">Peso:</span> {pet.weight} kg</p>
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex justify-between">
        {onSelect && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onSelect(pet)}
          >
            Selecionar
          </Button>
        )}
        
        {onViewDetails && (
          <Button 
            variant="link" 
            size="sm" 
            onClick={() => onViewDetails(pet)}
          >
            Ver detalhes
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default PetCard;
