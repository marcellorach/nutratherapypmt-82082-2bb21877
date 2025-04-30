
import React, { useState, useEffect } from 'react';
import { nutraceuticals } from '@/data';
import { NutraceuticosHeader } from './nutraceuticos/NutraceuticosHeader';
import { SearchFilters } from './nutraceuticos/SearchFilters';
import { NutraceuticosTable } from './nutraceuticos/NutraceuticosTable';
import { Nutraceutical } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

const NutraceuticosTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEfficacy, setFilterEfficacy] = useState<number | null>(null);
  const [filterCondition, setFilterCondition] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dbNutraceuticals, setDbNutraceuticals] = useState<any[]>([]);
  const { toast } = useToast();

  // Carregar nutracêuticos do banco de dados
  const loadNutraceuticals = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('nutraceuticals')
        .select(`
          *,
          category_id:nutraceutical_categories(*),
          nutraceutical_benefits(id, benefit),
          nutraceutical_scientific_metadata(*),
          nutraceutical_health_conditions:nutraceutical_conditions(
            id, 
            relationship_type,
            efficacy_score,
            condition:health_conditions(*)
          ),
          nutraceutical_studies(
            id,
            relevance_score,
            study:scientific_studies(*)
          )
        `)
        .order('name');
        
      if (error) {
        throw error;
      }
      
      setDbNutraceuticals(data || []);
      console.log('Nutracêuticos carregados:', data);
    } catch (err: any) {
      console.error('Erro ao carregar nutracêuticos:', err);
      toast({
        title: "Erro ao carregar dados",
        description: err.message || "Não foi possível carregar os nutracêuticos.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Carregar dados iniciais
  useEffect(() => {
    loadNutraceuticals();
    
    // Adicionar listener para recarregar após importação
    const handleImport = () => {
      console.log('Evento de importação detectado, recarregando nutracêuticos...');
      loadNutraceuticals();
    };
    
    window.addEventListener('nutraceuticals-imported', handleImport);
    
    return () => {
      window.removeEventListener('nutraceuticals-imported', handleImport);
    };
  }, []);

  // Função para mapear os dados do banco para o formato esperado pelo componente
  const mapDbToUiFormat = (dbItems: any[]): Nutraceutical[] => {
    return dbItems.map(item => {
      // Extrair condições de saúde associadas
      const healthConditions = (item.nutraceutical_health_conditions || [])
        .filter((nch: any) => nch.condition)
        .map((nch: any) => ({
          id: nch.condition.id,
          name: nch.condition.name,
          description: nch.condition.description,
          efficacyScore: nch.efficacy_score,
          relationshipType: nch.relationship_type
        }));
        
      // Extrair estudos científicos associados
      const studies = (item.nutraceutical_studies || [])
        .filter((ns: any) => ns.study)
        .map((ns: any) => ({
          id: ns.study.id,
          title: ns.study.title,
          authors: ns.study.authors,
          year: ns.study.year,
          journal: ns.study.journal,
          relevanceScore: ns.relevance_score
        }));
        
      // Dados científicos
      const scientificData = item.nutraceutical_scientific_metadata && 
        item.nutraceutical_scientific_metadata.length > 0 ? 
        item.nutraceutical_scientific_metadata[0] : 
        { efficacy_score: 0, sustainability_score: 0 };
      
      // Benefícios
      const benefits = (item.nutraceutical_benefits || [])
        .map((b: any) => b.benefit);
        
      return {
        id: item.id,
        name: item.name,
        description: item.description || '',
        chemicalCompound: item.chemical_compound || '',
        source: item.source || '',
        dosage: item.dosage || '',
        category: item.category_id?.name || 'Sem categoria',
        scientificEvidence: {
          efficacyScore: scientificData.efficacy_score || 0,
          sustainabilityScore: scientificData.sustainability_score || 0,
          studies: studies.length,
        },
        condition: item.category_id?.name || 'Geral',
        contraindications: item.contraindications || [],
        benefits: benefits,
        healthConditions: healthConditions,
        studies: studies
      };
    });
  };

  // Combinar dados do banco com dados de exemplo
  const allNutraceuticals = [
    ...mapDbToUiFormat(dbNutraceuticals),
    ...nutraceuticals
  ];

  // Filtrar nutracêuticos com base nos critérios
  const filteredNutraceuticals = allNutraceuticals.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.chemicalCompound.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEfficacy = 
      filterEfficacy === null || 
      Math.floor(item.scientificEvidence.efficacyScore) === filterEfficacy;
    
    const matchesCondition = 
      filterCondition === null ||
      item.condition === filterCondition;
    
    return matchesSearch && matchesEfficacy && matchesCondition;
  });

  const clearFilters = () => {
    setFilterEfficacy(null);
    setFilterCondition(null);
    setSearchTerm('');
  };

  // Função para atualizar os dados
  const handleRefreshData = () => {
    setIsRefreshing(true);
    
    loadNutraceuticals().then(() => {
      setIsRefreshing(false);
      toast({
        title: "Dados atualizados",
        description: "A lista de nutracêuticos foi atualizada com sucesso."
      });
    });
  };

  return (
    <>
      <NutraceuticosHeader />
      
      <div className="bg-white rounded-md shadow mb-6">
        <SearchFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterEfficacy={filterEfficacy}
          setFilterEfficacy={setFilterEfficacy}
          filterCondition={filterCondition}
          setFilterCondition={setFilterCondition}
          clearFilters={clearFilters}
          onRefresh={handleRefreshData}
          isRefreshing={isRefreshing}
        />
        
        {isLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <NutraceuticosTable 
            nutraceuticals={filteredNutraceuticals}
          />
        )}
      </div>
    </>
  );
};

export default NutraceuticosTab;
