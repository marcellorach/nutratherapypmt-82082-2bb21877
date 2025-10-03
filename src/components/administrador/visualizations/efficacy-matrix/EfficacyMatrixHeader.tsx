import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Filter, PlusCircle } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

interface EfficacyMatrixHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export const EfficacyMatrixHeader: React.FC<EfficacyMatrixHeaderProps> = ({
  searchTerm,
  onSearchChange
}) => {
  const { t } = useTranslation();
  
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('efficacyMatrix.header.title')}</h2>
          <p className="text-gray-600">
            {t('efficacyMatrix.header.description')}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder={t('efficacyMatrix.header.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8 max-w-[250px]"
            />
          </div>
          <Button variant="outline" className="flex items-center">
            <Filter className="mr-2 h-4 w-4" />
            {t('efficacyMatrix.header.filters')}
          </Button>
          <Button variant="outline" className="flex items-center">
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('efficacyMatrix.header.newRelation')}
          </Button>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-2">
        <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
          {t('efficacyMatrix.badges.glucosamine')}
        </Badge>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
          {t('efficacyMatrix.badges.omega3')}
        </Badge>
        <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100">
          {t('efficacyMatrix.badges.arthritis')}
        </Badge>
        <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100">
          {t('efficacyMatrix.badges.inflammation')}
        </Badge>
        <Badge variant="outline" className="bg-orange-50 text-orange-700 hover:bg-orange-100">
          {t('efficacyMatrix.badges.highEfficacy')}
        </Badge>
      </div>
    </>
  );
};
