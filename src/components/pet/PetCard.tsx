import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Info, Smartphone, Clock, AlertTriangle } from "lucide-react";
import { Pet } from '@/types';
import { useTranslation } from 'react-i18next';

interface PetCardProps {
  pet: Pet;
  onSelect?: (pet: Pet) => void;
  onViewDetails?: (pet: Pet) => void;
}

const PetCard: React.FC<PetCardProps> = ({ pet, onSelect, onViewDetails }) => {
  const { t } = useTranslation();
  
  // Fallbacks em caso de não haver dados
  const petImage = pet.imageUrl || `/lovable-uploads/11263f77-191e-4f66-bd55-da169a94c26f.png`;
  const fallbackImage = '🐕';
  
  // Definir cores com base nos dias de revisão
  const getReviewStatusColor = (days: number | undefined) => {
    if (days === undefined) return '';
    if (days >= 10) return 'bg-red-500';
    if (days >= 7) return 'bg-amber-500';
    return 'bg-gray-800';
  };

  const reviewStatusColor = getReviewStatusColor(pet.reviewDays);
  
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
            {t('pet.card.plan')}: {pet.petLovePlan}
          </Badge>
        )}
        
        {pet.reviewDays !== undefined && pet.reviewDays > 0 && (
          <div className={`absolute bottom-0 left-0 right-0 ${reviewStatusColor} text-white py-1 px-2 flex items-center gap-1`}>
            {pet.reviewDays >= 7 && <AlertTriangle size={14} />}
            <Clock size={14} />
            <span className="text-xs">
              {t('pet.card.awaitingReview', { count: pet.reviewDays })}
            </span>
          </div>
        )}
      </div>
      
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center justify-between">
          <span>{pet.name}</span>
          {pet.chipNumber && (
            <span className="text-xs flex items-center gap-1 text-gray-500" title={t('pet.card.chipNumber')}>
              <Smartphone size={12} />
              {pet.chipNumber}
            </span>
          )}
        </CardTitle>
        <CardDescription className="flex items-center justify-between">
          <span>{pet.breed}</span>
          {pet.veterinarianName && (
            <span className="text-xs flex items-center gap-1 text-gray-500" title={t('pet.card.responsibleVet')}>
              <User size={12} />
              {pet.veterinarianName}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-1 text-sm">
          <p><span className="font-semibold">{t('pet.card.age')}:</span> {pet.age} {t('pet.card.years')}</p>
          <p><span className="font-semibold">{t('pet.card.weight')}:</span> {pet.weight} {t('pet.card.kg')}</p>
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
            {t('pet.card.select')}
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
            {t('pet.card.viewDetails')}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default PetCard;
