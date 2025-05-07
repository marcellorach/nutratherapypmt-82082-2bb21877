
import { supabase } from '@/integrations/supabase/client';

/**
 * Serviço para gerenciar estudos científicos no Supabase
 */
export const ScientificStudiesService = {
  /**
   * Busca todos os estudos científicos
   */
  async getAllStudies() {
    // Usando type assertion para contornar a verificação de tipos do TypeScript
    const client = supabase as any;
    const { data, error } = await client
      .from('scientific_studies')
      .select('*')
      .order('year', { ascending: false });

    if (error) {
      console.error('Erro ao buscar estudos científicos:', error);
      throw new Error('Não foi possível carregar os estudos científicos');
    }

    return data;
  },

  /**
   * Busca um estudo científico pelo ID
   */
  async getStudyById(id: string) {
    // Usando type assertion para contornar a verificação de tipos do TypeScript
    const client = supabase as any;
    const { data, error } = await client
      .from('scientific_studies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar estudo científico:', error);
      throw new Error('Não foi possível carregar o estudo científico');
    }

    return data;
  },

  /**
   * Cria um novo estudo científico
   */
  async createStudy({ 
    title, 
    link, 
    year,
    journal,
    authors,
    abstract,
    file,
    nutraceuticalId
  }: {
    title: string;
    link?: string;
    year: number;
    journal?: string;
    authors?: string | string[];
    abstract?: string;
    file?: File;
    nutraceuticalId?: string;
  }) {
    // Usando type assertion para contornar a verificação de tipos do TypeScript
    const client = supabase as any;
    
    let file_path = null;
    let file_name = null;
    let file_type = null;
    let file_size = null;
    
    // Se temos um arquivo, vamos fazer o upload
    if (file) {
      try {
        console.log('Fazendo upload do arquivo:', file.name);
        
        // Criar um nome de arquivo único com timestamp
        const timestamp = new Date().getTime();
        const fileExtension = file.name.split('.').pop();
        const fileName = `${timestamp}_${file.name.replace(/\.[^/.]+$/, "")}.${fileExtension}`;
        const filePath = `studies/${fileName}`;
        
        // Upload do arquivo para o Storage
        const { data: uploadData, error: uploadError } = await client.storage
          .from('scientific_studies')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (uploadError) {
          console.error('Erro ao fazer upload do arquivo:', uploadError);
          throw new Error('Falha no upload do arquivo');
        }
        
        // Obter URL pública para o arquivo
        const { data: { publicUrl } } = client.storage
          .from('scientific_studies')
          .getPublicUrl(filePath);
          
        console.log('Arquivo enviado com sucesso. URL:', publicUrl);
        
        file_path = filePath;
        file_name = file.name;
        file_type = file.type;
        file_size = file.size;
      } catch (uploadError) {
        console.error('Erro no processo de upload:', uploadError);
        throw new Error('Falha no processo de upload do arquivo');
      }
    }
    
    // Criar o registro do estudo no banco de dados
    const { data, error } = await client
      .from('scientific_studies')
      .insert([{
        title,
        link,
        year,
        journal,
        authors,
        abstract,
        file_path,
        file_name,
        file_type,
        file_size
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar estudo científico:', error);
      throw new Error('Não foi possível criar o estudo científico');
    }
    
    // Se temos um ID de nutracêutico, vamos criar a relação
    if (nutraceuticalId && data) {
      const { error: relationError } = await client
        .from('nutraceutical_studies')
        .insert([{
          nutraceutical_id: nutraceuticalId,
          study_id: data.id,
          relevance_score: 4.0 // Valor padrão para relevância
        }]);
        
      if (relationError) {
        console.error('Erro ao associar estudo ao nutracêutico:', relationError);
        // Não vamos lançar erro aqui, apenas logar, pois o estudo já foi criado
      }
    }

    return data;
  },

  /**
   * Atualiza um estudo científico existente
   */
  async updateStudy(
    id: string, 
    { 
      title, 
      link, 
      year,
      journal,
      authors,
      abstract,
      file
    }: {
      title?: string;
      link?: string;
      year?: number;
      journal?: string;
      authors?: string | string[];
      abstract?: string;
      file?: File;
    }
  ) {
    // Usando type assertion para contornar a verificação de tipos do TypeScript
    const client = supabase as any;
    
    // Dados para atualização
    const updateData: any = {
      title,
      link,
      year,
      journal,
      authors,
      abstract
    };
    
    // Se temos um arquivo novo, vamos fazer o upload
    if (file) {
      try {
        // Primeiro, buscar o registro atual para ver se já tem arquivo
        const { data: currentStudy } = await client
          .from('scientific_studies')
          .select('file_path')
          .eq('id', id)
          .single();
          
        // Se já existe um arquivo, vamos removê-lo para não acumular arquivos
        if (currentStudy && currentStudy.file_path) {
          await client.storage
            .from('scientific_studies')
            .remove([currentStudy.file_path]);
        }
        
        // Upload do novo arquivo
        const timestamp = new Date().getTime();
        const fileExtension = file.name.split('.').pop();
        const fileName = `${timestamp}_${file.name.replace(/\.[^/.]+$/, "")}.${fileExtension}`;
        const filePath = `studies/${fileName}`;
        
        const { data: uploadData, error: uploadError } = await client.storage
          .from('scientific_studies')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (uploadError) {
          throw new Error('Falha no upload do arquivo');
        }
        
        // Adicionar informações do arquivo nos dados a atualizar
        updateData.file_path = filePath;
        updateData.file_name = file.name;
        updateData.file_type = file.type;
        updateData.file_size = file.size;
      } catch (uploadError) {
        console.error('Erro no processo de upload:', uploadError);
        throw new Error('Falha no processo de upload do arquivo');
      }
    }
    
    // Atualizar o registro no banco de dados
    const { data, error } = await client
      .from('scientific_studies')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar estudo científico:', error);
      throw new Error('Não foi possível atualizar o estudo científico');
    }

    return data;
  },

  /**
   * Remove um estudo científico
   */
  async deleteStudy(id: string) {
    // Usando type assertion para contornar a verificação de tipos do TypeScript
    const client = supabase as any;
    
    // Primeiro, buscar o estudo para obter o caminho do arquivo
    const { data: study } = await client
      .from('scientific_studies')
      .select('file_path')
      .eq('id', id)
      .single();
    
    // Se o estudo tem um arquivo associado, remover do storage
    if (study && study.file_path) {
      const { error: storageError } = await client.storage
        .from('scientific_studies')
        .remove([study.file_path]);
        
      if (storageError) {
        console.error('Erro ao remover arquivo do estudo:', storageError);
        // Continuamos mesmo com erro de remoção do arquivo
      }
    }
    
    // Remover quaisquer relações com nutracêuticos
    const { error: relationsError } = await client
      .from('nutraceutical_studies')
      .delete()
      .eq('study_id', id);
      
    if (relationsError) {
      console.error('Erro ao remover relações do estudo:', relationsError);
    }
    
    // Remover o registro do estudo
    const { error } = await client
      .from('scientific_studies')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir estudo científico:', error);
      throw new Error('Não foi possível excluir o estudo científico');
    }

    return true;
  },
  
  /**
   * Obtém a URL pública de um arquivo de estudo
   */
  getPublicFileUrl(filePath: string) {
    if (!filePath) return null;
    
    const client = supabase as any;
    const { data: { publicUrl } } = client.storage
      .from('scientific_studies')
      .getPublicUrl(filePath);
      
    return publicUrl;
  }
};
