
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Search, PlusCircle } from "lucide-react";

interface RelationsHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  relationshipFilter: string;
  onRelationshipFilterChange: (value: string) => void;
  isLoading?: boolean;
}

const RelationsHeader: React.FC<RelationsHeaderProps> = ({
  searchTerm,
  onSearchChange,
  relationshipFilter,
  onRelationshipFilterChange,
  isLoading = false
}) => {
  const { t } = useTranslation();
  
  return (
    <div className="flex items-center justify-between flex-wrap gap-2">
      <div>
        <h2 className="text-2xl font-bold">{t('relations.title')}</h2>
        <p className="text-gray-600">
          {t('relations.description')}
        </p>
      </div>
      <div className="flex gap-2 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder={t('relations.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 min-w-[200px]"
            disabled={isLoading}
          />
        </div>
        <Select 
          value={relationshipFilter} 
          onValueChange={onRelationshipFilterChange}
          disabled={isLoading}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('relations.relationshipType')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('relations.allTypes')}</SelectItem>
            <SelectItem value="prevention">{t('relations.prevention')}</SelectItem>
            <SelectItem value="treatment">{t('relations.treatment')}</SelectItem>
            <SelectItem value="support">{t('relations.support')}</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="flex items-center" disabled={isLoading}>
          <Filter className="mr-2 h-4 w-4" />
          {t('relations.filters')}
        </Button>
        <Button className="flex items-center">
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('relations.newRelation')}
        </Button>
      </div>
    </div>
  );
};

export default RelationsHeader;
