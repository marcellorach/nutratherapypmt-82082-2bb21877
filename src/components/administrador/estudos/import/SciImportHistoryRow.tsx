
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Trash, FileText } from "lucide-react";

interface SciImportHistoryRowProps {
  item: {
    id: string;
    imported_at: string | null;
    meta_summary_filename: string;
    base_studies_filename: string;
    meta_summary_storage_path: string;
    base_studies_storage_path: string;
    scispace_status: string | null;
    consenso_name?: string;
  };
  onDeleted: () => void;
  onSubmitNTAI?: (item: any) => void;
}

const SciImportHistoryRow: React.FC<SciImportHistoryRowProps> = ({ 
  item, 
  onDeleted,
  onSubmitNTAI
}) => {
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmitNTAI = async () => {
    setSubmitting(true);
    try {
      // Atualiza o status para 'em_processamento'
      const { error } = await supabase
        .from('scispace_imports')
        .update({ scispace_status: 'em_processamento' })
        .eq('id', item.id);

      if (error) {
        throw new Error(`Erro ao atualizar status: ${error.message}`);
      }

      // Aqui seria o lugar para iniciar o processamento NTAI em segundo plano
      // Por enquanto vamos apenas simular com um timeout

      setTimeout(() => {
        if (onSubmitNTAI) {
          onSubmitNTAI(item);
        }
        toast({
          title: "Submissão NTAI iniciada",
          description: `O arquivo ${item.base_studies_filename} está sendo processado pelo NTAI.`,
        });
        setSubmitting(false);
      }, 1500);

    } catch (err: any) {
      toast({
        title: "Erro ao submeter para NTAI",
        description: err?.message,
        variant: "destructive",
      });
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch(status) {
      case 'em_processamento':
        return <span className="px-2 py-1 text-xs rounded bg-amber-100 text-amber-800">Em processamento</span>;
      case 'processado':
        return <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">Processado</span>;
      case 'erro':
        return <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-800">Erro</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">{status || "especial"}</span>;
    }
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-2 py-1 text-xs">{item.imported_at ? new Date(item.imported_at).toLocaleString("pt-BR") : "--"}</td>
      <td className="px-2 py-1 text-xs">{item.meta_summary_filename}</td>
      <td className="px-2 py-1 text-xs">{item.base_studies_filename}</td>
      <td className="px-2 py-1 text-xs">{item.consenso_name || "-"}</td>
      <td className="px-2 py-1 text-xs">{getStatusBadge(item.scispace_status)}</td>
      <td className="px-2 py-1 text-xs">
        <div className="flex space-x-1">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleSubmitNTAI} 
            disabled={submitting || item.scispace_status === 'em_processamento' || item.scispace_status === 'processado'}
            className="text-xs px-2 py-1 h-auto"
          >
            {submitting ? "Enviando..." : "Submeter NTAI"}
          </Button>
          <Button size="icon" variant="destructive" onClick={handleDelete} disabled={deleting} className="h-6 w-6">
            <Trash className="w-3 h-3" />
            <span className="sr-only">Apagar</span>
          </Button>
        </div>
      </td>
    </tr>
  );
};

export default SciImportHistoryRow;
