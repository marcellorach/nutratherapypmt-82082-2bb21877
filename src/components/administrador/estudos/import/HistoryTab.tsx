
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Brain, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import SciImportHistoryRow from './SciImportHistoryRow';

interface ImportHistoryRow {
  id: string;
  imported_at: string | null;
  meta_summary_filename: string;
  meta_summary_storage_path: string;
  base_studies_filename: string;
  base_studies_storage_path: string;
  scispace_status: string | null;
}

interface HistoryTabProps {
  onProcessWithAI: () => void;
}

const HistoryTab: React.FC<HistoryTabProps> = ({ onProcessWithAI }) => {
  const [importHistory, setImportHistory] = useState<ImportHistoryRow[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = () => {
    setHistoryLoading(true);
    supabase
      .from("scispace_imports")
      .select("id, imported_at, meta_summary_filename, meta_summary_storage_path, base_studies_filename, base_studies_storage_path, scispace_status")
      .order("imported_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          toast({
            title: "Erro ao buscar histórico",
            description: error.message,
            variant: "destructive"
          });
          setImportHistory([]);
        } else {
          setImportHistory(data || []);
        }
        setHistoryLoading(false);
      });
  };
  
  return (
    <div className="py-2">
      {historyLoading ? (
        <div className="text-center p-6 text-gray-400">Carregando histórico...</div>
      ) : (
        <>
          <div className="flex justify-between mb-2">
            <Button variant="outline" size="sm" onClick={fetchHistory}>
              Atualizar lista
            </Button>
            
            <Button 
              variant="default" 
              size="sm" 
              className="bg-purple-600 hover:bg-purple-700"
              onClick={onProcessWithAI}
            >
              <Brain className="mr-1 h-4 w-4" />
              Processar com IA
            </Button>
          </div>
          {importHistory && importHistory.length > 0 ? (
            <div className="overflow-auto border rounded-lg">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-2 py-1">Data / Hora</th>
                    <th className="px-2 py-1">Meta Sumário</th>
                    <th className="px-2 py-1">Base Estudos</th>
                    <th className="px-2 py-1">Status</th>
                    <th className="px-2 py-1">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {importHistory.map((item) => (
                    <SciImportHistoryRow
                      key={item.id}
                      item={item}
                      onDeleted={fetchHistory}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Nenhuma importação anterior registrada.
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HistoryTab;
