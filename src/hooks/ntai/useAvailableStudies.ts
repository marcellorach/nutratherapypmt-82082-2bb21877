
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AvailableStudy } from './types/processing';

export const transformImportToStudy = (importData: any): AvailableStudy => ({
  id: importData.id,
  title: importData.meta_summary_filename || 'Estudo importado',
  description: importData.notes || 'Importado via SciSpace', // Garantindo valor não nulo
  journal: importData.journal || 'SciSpace Import', // Garantindo valor não nulo
  kanban_status: importData.scispace_status || 'new',
  import_type: importData.import_type || 'manual',
  created_at: importData.imported_at || new Date().toISOString(), // Garantindo valor não nulo
  scispace_status: importData.scispace_status
});

export const useAvailableStudies = () => {
  const [availableStudies, setAvailableStudies] = useState<AvailableStudy[]>([]);
  const { toast } = useToast();

  const loadStudies = async () => {
    const { data: processedData, error: processedError } = await supabase
      .from('processed_studies')
      .select(`
        id,
        title,
        description,
        journal,
        kanban_status,
        import_type,
        created_at
      `)
      .order('created_at', { ascending: false });

    const { data: importData, error: importError } = await supabase
      .from('scispace_imports')
      .select('*')
      .eq('is_deleted', false)
      .order('imported_at', { ascending: false });

    if (processedError) {
      console.error('Erro ao carregar estudos processados:', processedError);
      toast({
        title: "Erro ao carregar estudos",
        description: "Não foi possível carregar os estudos processados.",
        variant: "destructive",
      });
    }

    if (importError) {
      console.error('Erro ao carregar importações:', importError);
      toast({
        title: "Erro ao carregar importações",
        description: "Não foi possível carregar as importações do SciSpace.",
        variant: "destructive",
      });
    }

    const importStudies = importData ? importData.map(transformImportToStudy) : [];
    const processedStudies = processedData ? processedData.map(study => ({
      ...study,
      description: study.description || 'Processado anteriormente', // Garantindo valor não nulo
      journal: study.journal || 'Processamento anterior', // Garantindo valor não nulo
      created_at: study.created_at || new Date().toISOString() // Garantindo valor não nulo
    })) : [];
    
    const allStudies = [...processedStudies];
    
    importStudies.forEach(importStudy => {
      if (!allStudies.some(study => study.id === importStudy.id)) {
        allStudies.push(importStudy);
      }
    });

    setAvailableStudies(allStudies);
  };

  useEffect(() => {
    loadStudies();

    const processedChannel = supabase
      .channel('processed_studies_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'processed_studies' }, loadStudies)
      .subscribe();

    const importsChannel = supabase
      .channel('scispace_imports_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scispace_imports' }, loadStudies)
      .subscribe();

    return () => {
      supabase.removeChannel(processedChannel);
      supabase.removeChannel(importsChannel);
    };
  }, []);

  return { availableStudies, loadStudies };
};
