import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PawPrint, Info, Stethoscope } from 'lucide-react';

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
  };
}

const PetProfileCard: React.FC<PetProfileCardProps> = ({ pet }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="relative h-32 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
        <PawPrint className="h-16 w-16 text-muted-foreground/30" />
        <div className="absolute top-2 right-2 flex gap-1">
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
      </CardFooter>
    </Card>
  );
};

export default PetProfileCard;
