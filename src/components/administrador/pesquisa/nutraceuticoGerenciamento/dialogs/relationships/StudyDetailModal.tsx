import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface StudyDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  relation: any;
}

const StudyDetailModal: React.FC<StudyDetailModalProps> = ({
  isOpen,
  onClose,
  relation
}) => {
  const [relatedNutraceuticals, setRelatedNutraceuticals] = useState<any[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState<boolean>(false);
  
  const study = relation?.study || {};
  const relevanceScore = relation?.relevance_score;

  // Carregar nutracêuticos relacionados a este estudo
  useEffect(() => {
    if (isOpen && study.id) {
      loadRelatedNutraceuticals();
    }
  }, [isOpen, study.id]);

  const loadRelatedNutraceuticals = async () => {
    setIsLoadingRelated(true);
    try {
      const { data, error } = await supabase
        .from('nutraceutical_studies')
        .select(`
          id,
          relevance_score,
          nutraceuticals (
            id,
            name
          )
        `)
        .eq('study_id', study.id);

      if (error) throw error;

      setRelatedNutraceuticals(data || []);
    } catch (error) {
      console.error('Erro ao carregar nutracêuticos relacionados:', error);
    } finally {
      setIsLoadingRelated(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="space-y-2">
            <DialogTitle className="text-xl leading-tight">
              {study.title || 'Título não disponível'}
            </DialogTitle>
            {study.title_en && study.title_en !== study.title && (
              <p className="text-sm text-muted-foreground italic leading-tight">
                {study.title_en}
              </p>
            )}
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Metadados */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Ano</Label>
              <p className="font-medium">{study.year || 'N/A'}</p>
            </div>
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground">Journal</Label>
              <p className="font-medium text-sm">{study.journal || 'N/A'}</p>
            </div>
            {relevanceScore && (
              <div>
                <Label className="text-xs text-muted-foreground">Relevância</Label>
                <Badge className="bg-purple-50 text-purple-700 border-purple-200">
                  {relevanceScore}/5
                </Badge>
              </div>
            )}
          </div>
          
          {study.doi && (
            <div>
              <Label className="text-xs text-muted-foreground">DOI</Label>
              <Button
                variant="link"
                className="h-auto p-0 text-xs"
                onClick={() => window.open(`https://doi.org/${study.doi}`, '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                {study.doi}
              </Button>
            </div>
          )}
          
          <Separator />
          
          {/* Autores */}
          {study.authors && Array.isArray(study.authors) && study.authors.length > 0 && (
            <>
              <div>
                <Label className="text-sm font-semibold mb-2 block">Autores</Label>
                <div className="flex flex-wrap gap-2">
                  {study.authors.map((author: string, idx: number) => (
                    <Badge key={idx} variant="outline">
                      {author}
                    </Badge>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}
          
          {/* Abstract (PT) */}
          {study.abstract && (
            <div>
              <Label className="text-sm font-semibold mb-2 block">Resumo</Label>
              <Card className="bg-slate-50 border-slate-200">
                <CardContent className="p-4">
                  <p className="text-sm leading-relaxed whitespace-pre-line">
                    {study.abstract}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Abstract (EN) */}
          {study.abstract_en && study.abstract_en !== study.abstract && (
            <div>
              <Label className="text-sm font-semibold mb-2 block">Abstract (English)</Label>
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <p className="text-sm leading-relaxed whitespace-pre-line">
                    {study.abstract_en}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
          
          <Separator />
          
          {/* Nutracêuticos relacionados */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">
              Nutracêuticos Relacionados
            </Label>
            {isLoadingRelated ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : relatedNutraceuticals.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum nutracêutico relacionado encontrado
              </p>
            ) : (
              <div className="space-y-2">
                {relatedNutraceuticals.map((rel: any) => (
                  <div 
                    key={rel.id} 
                    className="flex justify-between items-center p-3 border rounded-md bg-white hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-sm font-medium">
                      {rel.nutraceuticals?.name || 'Nome não disponível'}
                    </span>
                    <Badge variant="outline" className="bg-purple-50 text-purple-700">
                      Relevância: {rel.relevance_score || 0}/5
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row justify-between gap-2">
          <div className="flex gap-2 flex-wrap">
            {study.link && (
              <Button
                variant="outline"
                onClick={() => window.open(study.link, '_blank')}
                className="text-sm"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Ver Estudo Completo
              </Button>
            )}
            {study.doi && (
              <Button
                variant="outline"
                onClick={() => window.open(`https://doi.org/${study.doi}`, '_blank')}
                className="text-sm"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Abrir via DOI
              </Button>
            )}
          </div>
          <Button onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StudyDetailModal;
