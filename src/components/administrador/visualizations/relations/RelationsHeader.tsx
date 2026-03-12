
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Search, RefreshCw } from "lucide-react";

interface RelationsHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  relationshipFilter: string;
  onRelationshipFilterChange: (value: string) => void;
  entityTypeFilter?: string;
  onEntityTypeFilterChange?: (value: string) => void;
  relationshipTypes?: string[];
  entityTypes?: string[];
  isLoading?: boolean;
  onRefresh?: () => void;
  nodeCount?: number;
  linkCount?: number;
}

const RelationsHeader: React.FC<RelationsHeaderProps> = ({
  searchTerm,
  onSearchChange,
  relationshipFilter,
  onRelationshipFilterChange,
  entityTypeFilter = 'all',
  onEntityTypeFilterChange,
  relationshipTypes = [],
  entityTypes = [],
  isLoading = false,
  onRefresh,
  nodeCount = 0,
  linkCount = 0,
}) => {
  const { t } = useTranslation();
  
  return (
    <div className="flex items-center justify-between flex-wrap gap-2">
      <div>
        <h2 className="text-2xl font-bold">{t('relations.title')}</h2>
        <p className="text-muted-foreground text-sm">
          {t('relations.description')}
          {nodeCount > 0 && (
            <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full">
              {nodeCount} nodes · {linkCount} edges | Knowledge Graph
            </span>
          )}
        </p>
      </div>
      <div className="flex gap-2 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('relations.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 min-w-[200px]"
            disabled={isLoading}
          />
        </div>
        
        {/* Relationship type filter */}
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
            {relationshipTypes.map(rt => (
              <SelectItem key={rt} value={rt}>{rt}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Entity type filter */}
        {onEntityTypeFilterChange && (
          <Select
            value={entityTypeFilter}
            onValueChange={onEntityTypeFilterChange}
            disabled={isLoading}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Entity Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              {entityTypes.map(et => (
                <SelectItem key={et} value={et}>{et}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        
        {onRefresh && (
          <Button 
            variant="outline" 
            className="flex items-center" 
            disabled={isLoading}
            onClick={onRefresh}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {t('relations.filters')}
          </Button>
        )}
      </div>
    </div>
  );
};

export default RelationsHeader;
