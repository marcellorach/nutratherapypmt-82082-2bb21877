import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Users, Eye, Trash2, Edit, ExternalLink } from 'lucide-react';

interface StudyCardProps {
  relation: any;
  onViewDetails: (relation: any) => void;
  onEditRelevance: (relation: any) => void;
  onRemove: (relationId: string) => void;
  isSaving: boolean;
}

const StudyCard: React.FC<StudyCardProps> = ({
  relation,
  onViewDetails,
  onEditRelevance,
  onRemove,
  isSaving
}) => {
  const study = relation.study || {};
  
  // Escala visual de relevância
  const renderRelevanceScale = () => {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Relevância:</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(score => (
            <div
              key={score}
              className={`h-2 w-6 rounded-sm transition-colors ${
                score <= (relation.relevance_score || 0)
                  ? 'bg-purple-500' 
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <Badge variant="outline" className="bg-purple-50 text-purple-700 text-xs">
          {relation.relevance_score || 0}/5
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEditRelevance(relation)}
          className="h-6 w-6 p-0"
          disabled={isSaving}
        >
          <Edit className="h-3 w-3" />
        </Button>
      </div>
    );
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-3">
          <div className="space-y-1 flex-1 min-w-0">
            {/* Título + Ano */}
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm leading-tight break-words">
                  {study.title || 'Título não disponível'}
                </h4>
              </div>
              {study.year && (
                <Badge variant="outline" className="flex-shrink-0 text-xs">
                  {study.year}
                </Badge>
              )}
            </div>
            
            {/* Journal */}
            {study.journal && (
              <p className="text-xs text-muted-foreground italic pl-6">
                {study.journal}
              </p>
            )}
            
            {/* Autores (primeiros 3) */}
            {study.authors && Array.isArray(study.authors) && study.authors.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground pl-6">
                <Users className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">
                  {study.authors.slice(0, 3).join(', ')}
                  {study.authors.length > 3 && ` +${study.authors.length - 3} mais`}
                </span>
              </div>
            )}
          </div>
          
          {/* Ações no canto superior direito */}
          <div className="flex gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewDetails(relation)}
              className="h-8 w-8 p-0"
              title="Ver detalhes"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(relation.id)}
              className="h-8 w-8 p-0"
              disabled={isSaving}
              title="Remover"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        {/* Relevância com escala visual */}
        {renderRelevanceScale()}
        
        {/* Abstract preview */}
        {study.abstract && (
          <div className="text-xs text-muted-foreground">
            <p className="line-clamp-2 leading-relaxed">
              {study.abstract.substring(0, 200)}
              {study.abstract.length > 200 ? '...' : ''}
            </p>
          </div>
        )}
        
        {/* Links (DOI + Link do estudo) */}
        <div className="flex gap-2 flex-wrap">
          {study.doi && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={() => window.open(`https://doi.org/${study.doi}`, '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              DOI
            </Button>
          )}
          {study.link && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={() => window.open(study.link, '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Ver Estudo Completo
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StudyCard;
