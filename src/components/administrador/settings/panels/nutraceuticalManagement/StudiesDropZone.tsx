
import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDropzone } from 'react-dropzone';
import { FileText, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

interface StudiesDropZoneProps {
  studies: any[];
  selectedStudies: string[];
  onStudiesDropped: (studyIds: string[]) => void;
  loading?: boolean;
}

const StudiesDropZone: React.FC<StudiesDropZoneProps> = ({ 
  studies, 
  selectedStudies = [],
  onStudiesDropped,
  loading = false
}) => {
  const { t } = useTranslation();
  const [draggedStudies, setDraggedStudies] = useState<string[]>([]);
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const availableStudies = studies
      .filter(study => !selectedStudies.includes(study.id))
      .slice(0, acceptedFiles.length)
      .map(study => study.id);
    
    if (availableStudies.length > 0) {
      const updatedStudies = [...selectedStudies, ...availableStudies];
      onStudiesDropped(updatedStudies);
    }
  }, [studies, selectedStudies, onStudiesDropped]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
  });

  const handleSelectStudy = (studyId: string) => {
    const isSelected = selectedStudies.includes(studyId);
    
    if (isSelected) {
      const filtered = selectedStudies.filter(id => id !== studyId);
      onStudiesDropped(filtered);
    } else {
      onStudiesDropped([...selectedStudies, studyId]);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div 
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-4 text-center transition-colors",
          isDragActive ? "border-blue-400 bg-blue-50" : "border-gray-300"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-2">
          <FileText className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {isDragActive 
              ? t('studiesDropZone.dropHint')
              : t('studiesDropZone.dragHint')}
          </p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <ScrollArea className="h-40">
          <CardContent className="p-2">
            {studies.length === 0 ? (
              <div className="flex items-center justify-center h-36 text-sm text-muted-foreground">
                {t('studiesDropZone.noStudies')}
              </div>
            ) : (
              <div className="space-y-1">
                {studies.map((study) => {
                  const isSelected = selectedStudies.includes(study.id);
                  
                  return (
                    <div 
                      key={study.id}
                      className={cn(
                        "flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-slate-50",
                        isSelected && "bg-blue-50 hover:bg-blue-50"
                      )}
                      onClick={() => handleSelectStudy(study.id)}
                    >
                      <div className="flex items-center gap-2">
                        <FileText className={cn(
                          "h-4 w-4",
                          isSelected ? "text-blue-500" : "text-gray-400"
                        )} />
                        <span className="text-sm font-medium">{study.title}</span>
                        {study.journal && (
                          <Badge variant="outline" className="text-xs">
                            {study.journal}
                          </Badge>
                        )}
                      </div>
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="ghost" 
                        className="h-6 w-6 p-0"
                      >
                        {isSelected ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </ScrollArea>
      </Card>

      {selectedStudies.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-muted-foreground mb-1">
            {t('studiesDropZone.selectedCount', { count: selectedStudies.length })}
          </p>
          <div className="flex flex-wrap gap-1">
            {selectedStudies.map(studyId => {
              const study = studies.find(s => s.id === studyId);
              if (!study) return null;
              
              return (
                <Badge key={studyId} variant="secondary" className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {study.title.substring(0, 20)}{study.title.length > 20 ? '...' : ''}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-4 w-4 p-0 ml-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectStudy(studyId);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudiesDropZone;
