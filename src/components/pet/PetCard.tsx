
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Info, Smartphone } from "lucide-react";
import { Pet } from '@/types';

interface PetCardProps {
  pet: Pet;
  onSelect?: (pet: Pet) => void;
  onViewDetails?: (pet: Pet) => void;
}

const PetCard: React.FC<PetCardProps> = ({ pet, onSelect, onViewDetails }) => {
  // Fallbacks em caso de não haver dados
  const petImage = pet.imageUrl || `/lovable-uploads/56284482-b2f9-4ef0-a5c8-6bd2afc82e04.png`;
  const fallbackImage = pet.species === 'Cachorro' ? '🐕' : pet.species === 'Gato' ? '🐈' : '🐾';
  
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="relative h-40 overflow-hidden">
        <img 
          src={petImage} 
          alt={`${pet.breed}`}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "https://placehold.co/400x300?text=" + pet.breed;
          }}
        />
        {pet.petLovePlan && (
          <Badge className="absolute top-2 right-2 bg-white text-black border border-gray-300">
            Plano PetLove: {pet.petLovePlan}
          </Badge>
        )}
      </div>
      
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center justify-between">
          <span>{pet.name}</span>
          {pet.chipNumber && (
            <span className="text-xs flex items-center gap-1 text-gray-500" title="Número do Chip">
              <Smartphone size={12} />
              {pet.chipNumber}
            </span>
          )}
        </CardTitle>
        <CardDescription className="flex items-center justify-between">
          <span>{pet.breed}</span>
          {pet.veterinarianName && (
            <span className="text-xs flex items-center gap-1 text-gray-500" title="Veterinário Responsável">
              <User size={12} />
              {pet.veterinarianName}
            </span>
          )}
        </CardDescription>
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
            className="border-gray-300 hover:border-gray-400"
          >
            Selecionar
          </Button>
        )}
        
        {onViewDetails && (
          <Button 
            variant="link" 
            size="sm" 
            onClick={() => onViewDetails(pet)}
            className="text-gray-700"
          >
            <Info size={16} className="mr-1" />
            Ver detalhes
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default PetCard;
