import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { AITaskDefinition } from "@/config/ai-tasks";

interface Props { task: AITaskDefinition; current: string }

/**
 * Troca do modelo de uma tarefa roteada (ai-task-router lê
 * ai_configurations.ai_model_<task_id> a cada execução). Não chama IA:
 * a conferência real é feita quando o usuário mandar reprocessar 1 estudo.
 */
const RouterModelPicker: React.FC<Props> = ({ task, current }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const options = Array.from(new Set([current, ...task.candidate_models].filter(Boolean)));
  const [value, setValue] = useState(current);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("ai_configurations").upsert(
        { config_key: `ai_model_${task.id}`, config_value: JSON.stringify(value), description: `Model for ${task.id}`, is_active: true },
        { onConflict: "config_key" },
      );
      if (error) {
        toast({ title: t("aiModelSelector.configSaveError"), description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: t("aiModelSelector.configSaved"), description: t("aiGovernance.performance.savedUntested", { previous: current }) });
      qc.invalidateQueries({ queryKey: ["task-model-usage"] });
      qc.invalidateQueries({ queryKey: ["model-performance"] });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger className="w-[240px] h-8 text-xs" aria-label={t("aiGovernance.usage.changeModel")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
        </SelectContent>
      </Select>
      <Button size="sm" className="h-8" onClick={save} disabled={saving || value === current}>
        {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
        {t("aiGovernance.performance.save")}
      </Button>
    </div>
  );
};

export default RouterModelPicker;
