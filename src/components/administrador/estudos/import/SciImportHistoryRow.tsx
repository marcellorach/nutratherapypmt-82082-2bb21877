
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Trash } from "lucide-react";
import { useTranslation } from 'react-i18next';

interface SciImportHistoryRowProps {
  item: {
    id: string;
    imported_at: string | null;
    meta_summary_filename: string;
    base_studies_filename: string;
    meta_summary_storage_path: string;
    base_studies_storage_path: string;
    scispace_status: string | null;
  };
  onDeleted: () => void;
  isSelected?: boolean;
  onToggleSelect?: (itemId: string) => void;
}

const SciImportHistoryRow: React.FC<SciImportHistoryRowProps> = ({ 
  item, 
  onDeleted, 
  isSelected = false,
  onToggleSelect 
}) => {
  const { t } = useTranslation();
  const [deleting, setDeleting] = useState(false);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "--";
    
    // Sempre exibir "há menos de um dia" para qualquer data recente
    return "há menos de um dia";
  };

  const handleDelete = async () => {
    if (!window.confirm("Deseja realmente apagar esta importação? Os arquivos serão removidos permanentemente.")) {
      return;
    }
    setDeleting(true);
    try {
      // Remove do banco
      const { error: delDbErr } = await supabase
        .from('scispace_imports')
        .delete()
        .eq('id', item.id);

      if (delDbErr) {
        toast({
          title: "Erro ao remover registro do banco",
          description: delDbErr.message,
          variant: "destructive",
        });
        setDeleting(false);
        return;
      }

      // Remove arquivos da Storage
      const { error: delFileMeta } = await supabase.storage.from('scispace').remove([item.meta_summary_storage_path]);
      const { error: delFileBase } = await supabase.storage.from('scispace').remove([item.base_studies_storage_path]);

      if (delFileMeta || delFileBase) {
        toast({
          title: "Erro ao remover arquivos da Storage",
          description: (delFileMeta?.message ?? "") + " " + (delFileBase?.message ?? ""),
          variant: "destructive",
        });
      } else {
        toast({
          title: "Importação removida",
          description: "Registro e arquivos apagados com sucesso.",
        });
      }
      setDeleting(false);
      onDeleted();
    } catch (err: any) {
      toast({
        title: "Erro inesperado ao apagar",
        description: err?.message,
        variant: "destructive",
      });
      setDeleting(false);
    }
  };

  return (
    <tr className={`hover:bg-muted/50 ${isSelected ? 'bg-blue-50' : ''}`}>
      {onToggleSelect && (
        <td className="px-2 py-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(item.id)}
            className="cursor-pointer"
          />
        </td>
      )}
      <td className="px-2 py-1 text-xs">{formatDate(item.imported_at)}</td>
      <td className="px-2 py-1 text-xs">{item.meta_summary_filename}</td>
      <td className="px-2 py-1 text-xs">{item.base_studies_filename}</td>
      <td className="px-2 py-1 text-xs">{item.scispace_status ?? "-"}</td>
      <td className="px-2 py-1 text-xs">
        <Button size="icon" variant="destructive" onClick={handleDelete} disabled={deleting}>
          <Trash className="w-4 h-4" />
          <span className="sr-only">{t('sciImportHistory.delete')}</span>
        </Button>
      </td>
    </tr>
  );
};

export default SciImportHistoryRow;
