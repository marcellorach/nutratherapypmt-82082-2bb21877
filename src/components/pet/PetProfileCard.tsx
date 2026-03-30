import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PawPrint, Info, Stethoscope, Trash2 } from 'lucide-react';

interface PetProfileCardProps {
  pet: {
    id: string;
    name: string;
    breed: string;
    age_years: number;
    weight_kg: number;
    sex: string;
    neutered: boolean;
    species: string;
    owner_name?: string | null;
    photo_url?: string | null;
    is_demo?: boolean;
  };
  onDelete?: (id: string) => void;
}

const PetProfileCard: React.FC<PetProfileCardProps> = ({ pet, onDelete }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="relative h-32 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center overflow-hidden">
        {pet.photo_url ? (
          <img
            src={pet.photo_url}
            alt={`${pet.name} - ${pet.breed}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <PawPrint className="h-16 w-16 text-muted-foreground/30" />
        )}
        <div className="absolute top-2 right-2 flex gap-1">
          {pet.is_demo && (
            <Badge className="bg-amber-500 text-white border-amber-600 text-xs">
              DEMO
            </Badge>
          )}
          <Badge variant="outline" className="bg-background/80 text-xs">
            {pet.sex === 'male' ? '♂' : '♀'}
          </Badge>
          {pet.neutered && (
            <Badge variant="outline" className="bg-background/80 text-xs">
              {t('petRegistration.form.neutered')}
            </Badge>
          )}
        </div>
      </div>

      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">{pet.name}</CardTitle>
        <CardDescription>{pet.breed}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-1 text-sm">
          <p>
            <span className="font-semibold">{t('petRegistration.form.age')}:</span>{' '}
            {pet.age_years} {t('petRegistration.profile.years')}
          </p>
          <p>
            <span className="font-semibold">{t('petRegistration.form.weight')}:</span>{' '}
            {pet.weight_kg} kg
          </p>
          {pet.owner_name && (
            <p>
              <span className="font-semibold">{t('petRegistration.form.ownerName')}:</span>{' '}
              {pet.owner_name}
            </p>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-2 flex justify-between">
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/veterinario/pet/${pet.id}`)}
            className="gap-1"
          >
            <Stethoscope className="h-3.5 w-3.5" />
            {t('petRegistration.profile.viewProfile')}
          </Button>
          <Button
            variant="link"
            size="sm"
            onClick={() => navigate(`/veterinario/pet/${pet.id}`)}
            className="gap-1"
          >
            <Info className="h-3.5 w-3.5" />
            {t('common.details')}
          </Button>
        </div>
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(pet.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default PetProfileCard;
