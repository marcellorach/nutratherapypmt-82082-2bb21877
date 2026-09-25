import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { AITaskDefinition } from "@/config/ai-tasks";

interface Props {
  task: AITaskDefinition;
  current: string;
}

/**
 * Troca do modelo de leitura de PDF (Google direto). Antes de salvar, testa o
 * modelo no Google via gemini-file-search {action:'validate_model'}.
 */
const PdfModelPicker: React.FC<Props> = ({ task, current }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [value, setValue] = useState(current);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("gemini-file-search", {
        body: { action: "validate_model", model: value },
      });
      if (error) {
        toast({ title: t("aiModelSelector.tasks.validationFailed"), description: t("aiModelSelector.tasks.validationFailedDesc", { error: error.message }), variant: "destructive" });
        return;
      }
      if (!data?.ok) {
        toast({ title: t("aiModelSelector.tasks.modelInvalid"), description: t("aiModelSelector.tasks.modelInvalidDesc", { model: value, status: data?.google_status ?? "?" }), variant: "destructive" });
        return;
      }
      const { error: upErr } = await supabase.from("ai_configurations").upsert(
        { config_key: `ai_model_${task.id}`, config_value: JSON.stringify(value), description: "Model for pdf_reading (Google direct)", is_active: true },
        { onConflict: "config_key" },
      );
      if (upErr) {
        toast({ title: t("aiModelSelector.configSaveError"), description: upErr.message, variant: "destructive" });
        return;
      }
      toast({ title: t("aiModelSelector.configSaved"), description: t("aiGovernance.usage.savedNext") });
      qc.invalidateQueries({ queryKey: ["task-model-usage"] });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger className="w-[240px]" aria-label={t("aiGovernance.usage.changeModel")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {task.candidate_models.map((m) => (
            <SelectItem key={m} value={m}>{m}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="sm" onClick={save} disabled={saving || value === current}>
        {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
        {saving ? t("aiModelSelector.tasks.validating") : t("aiGovernance.usage.testAndSave")}
      </Button>
    </div>
  );
};

export default PdfModelPicker;
