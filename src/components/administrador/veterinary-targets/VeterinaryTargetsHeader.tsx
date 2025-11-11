
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VeterinaryTargetsHeaderProps {
  onAddNew: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

const VeterinaryTargetsHeader: React.FC<VeterinaryTargetsHeaderProps> = ({
  onAddNew,
  onRefresh,
  isRefreshing
}) => {
  const { t } = useTranslation();
  const [isTranslating, setIsTranslating] = useState(false);

  const handleAutoTranslate = async () => {
    setIsTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke('translate-conditions');
      
      if (error) throw error;
      
      if (data.success) {
        toast.success(data.message);
        onRefresh();
      } else {
        toast.error(data.error || 'Erro ao traduzir condições');
      }
    } catch (error) {
      console.error('Erro ao chamar função de tradução:', error);
      toast.error('Erro ao iniciar tradução automática');
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold">{t('admin.sidebar.knowledgeBase.veterinaryTargets')}</h2>
        <p className="text-muted-foreground">
          {t('admin.veterinaryTargets.header.subtitle')}
        </p>
      </div>
      
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={handleAutoTranslate}
          disabled={isTranslating}
          className="flex items-center gap-2"
        >
          <Languages className={`h-4 w-4 ${isTranslating ? 'animate-pulse' : ''}`} />
          {isTranslating ? 'Traduzindo...' : 'Traduzir para EN'}
        </Button>
        
        <Button
          variant="outline"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {t('admin.veterinaryTargets.header.refresh')}
        </Button>
        
        <Button
          onClick={onAddNew}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {t('admin.veterinaryTargets.header.newCondition')}
        </Button>
      </div>
    </div>
  );
};

export default VeterinaryTargetsHeader;
