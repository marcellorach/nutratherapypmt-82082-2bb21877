import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, RefreshCw, Save, Loader2, AlertTriangle, ShieldCheck, FileSpreadsheet, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { invalidateTaskAliasCache } from "@/hooks/useTaskAlias";
import { enrichItemsWithDrift, countDrift } from "./modelInventoryDrift";

interface AliasRow {
  task_id: string;
  real_model: string;
  alias_label_pt: string;
  alias_label_en: string;
  description: string | null;
  updated_at?: string;
}

interface InventoryItem {
  task_id: string;
  edge_function: string;
  prompt_source: string;
  prompt_key: string | null;
  real_model: string;
  resolution_source: string;
  provider: string;
  governed: boolean;
  alias_label_pt: string;
  alias_label_en: string;
  has_alias: boolean;
  alias_matches_real: boolean;
  notes: string | null;
  alias_partner_facing?: string;
  partner_surfaces?: string[];
}

const ModelAliasesPanel: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [rows, setRows] = useState<AliasRow[]>([]);
  const [draft, setDraft] = useState<Record<string, Partial<AliasRow>>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("ai_task_aliases")
      .select("task_id, real_model, alias_label_pt, alias_label_en, description, updated_at")
      .order("task_id");
    if (error) {
      toast({ title: t("admin.modelAliases.toast.loadError"), description: error.message, variant: "destructive" });
    } else {
      setRows((data ?? []) as AliasRow[]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); refreshInventory(false); }, []);

  const refreshInventory = async (persist: boolean) => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke("model-inventory", {
        method: persist ? "POST" : "GET",
      });
      if (error) throw error;
      setInventory((data?.items ?? []) as InventoryItem[]);
      if (persist) {
        toast({
          title: t("admin.modelAliases.toast.snapshotSaved"),
          description: t("admin.modelAliases.toast.snapshotSavedDesc"),
        });
      }
    } catch (e: any) {
      toast({
        title: t("admin.modelAliases.toast.inventoryError"),
        description: e?.message ?? String(e),
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const onChange = (id: string, field: keyof AliasRow, val: string) => {
    setDraft((d) => ({ ...d, [id]: { ...(d[id] ?? {}), [field]: val } }));
  };

  const saveRow = async (row: AliasRow) => {
    const patch = draft[row.task_id];
    if (!patch) return;
    setSavingId(row.task_id);
    const { error } = await supabase
      .from("ai_task_aliases")
      .update({
        alias_label_pt: patch.alias_label_pt ?? row.alias_label_pt,
        alias_label_en: patch.alias_label_en ?? row.alias_label_en,
        description: patch.description ?? row.description,
      })
      .eq("task_id", row.task_id);
    setSavingId(null);
    if (error) {
      toast({ title: t("admin.modelAliases.toast.saveError"), description: error.message, variant: "destructive" });
      return;
    }
    invalidateTaskAliasCache();
    setDraft((d) => { const x = { ...d }; delete x[row.task_id]; return x; });
    await load();
    toast({ title: t("admin.modelAliases.toast.saved") });
  };

  const downloadReport = async (format: "csv" | "json" | "pdf") => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("model-inventory", { method: "GET" });
      if (error) throw error;
      const rawItems: InventoryItem[] = data?.items ?? [];
      // Enrich with stored alias real_model to surface drift in reports
      const { data: aliasData } = await supabase
        .from("ai_task_aliases")
        .select("task_id, real_model");
      const storedByTask = new Map<string, string>(
        (aliasData ?? []).map((a: any) => [a.task_id, a.real_model]),
      );
      const items = enrichItemsWithDrift(rawItems, storedByTask);
      const driftCount = countDrift(items);
      let blob: Blob;
      let filename: string;
      const ts = new Date().toISOString().replace(/[:.]/g, "-");
      if (format === "json") {
        blob = new Blob([JSON.stringify({ ...data, items }, null, 2)], { type: "application/json" });
        filename = `model-inventory_${ts}.json`;
      } else if (format === "csv") {
        const header = ["task_id","edge_function","prompt_source","prompt_key","real_model","stored_real_model","drift","drift_note","resolution_source","provider","governed","alias_label_pt","alias_label_en","alias_partner_facing","partner_surfaces","has_alias","alias_matches_real","notes"];
        const csv = [
          header.join(","),
          ...items.map((i) => header.map((h) => {
            const v = (i as any)[h];
            const s = v === null || v === undefined
              ? ""
              : Array.isArray(v) ? v.join("|") : String(v);
            return s.includes(",") || s.includes("\"") ? `"${s.replace(/"/g, '""')}"` : s;
          }).join(",")),
        ].join("\n");
        blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        filename = `model-inventory_${ts}.csv`;
      } else {
        const { jsPDF } = await import("jspdf");
        const autoTable = (await import("jspdf-autotable")).default;
        const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
        doc.setFontSize(14);
        doc.text("Inventário de Modelos de IA", 40, 40);
        doc.setFontSize(9);
        doc.setTextColor(120);
        doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")} — ${items.length} tarefas — ${driftCount} com drift`, 40, 56);
        doc.setTextColor(0);
        autoTable(doc, {
          startY: 72,
          head: [["Tarefa", "Função / Origem", "Modelo real", "Alias PT", "Alias EN", "Alias Parceiro", "Status"]],
          body: items.map((i) => [
            i.task_id,
            `${i.edge_function}${i.prompt_key ? `\n${i.prompt_key}` : ""}`,
            i.drift
              ? `${i.real_model}\n⚠ difere do registrado (${i.stored_real_model})`
              : i.real_model,
            i.alias_label_pt,
            i.alias_label_en,
            (i as any).alias_partner_facing || "—",
            `${i.governed ? "governed" : "inline"}${i.drift ? "\nDRIFT" : ""}`,
          ]),
          styles: { fontSize: 8, cellPadding: 4, overflow: "linebreak" },
          headStyles: { fillColor: [15, 23, 42], textColor: 255 },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          didParseCell: (hook: any) => {
            const row = items[hook.row.index];
            if (row?.drift) {
              hook.cell.styles.textColor = [180, 83, 9];
            }
          },
          columnStyles: {
            0: { cellWidth: 110 },
            1: { cellWidth: 140 },
            2: { cellWidth: 130 },
            3: { cellWidth: 110 },
            4: { cellWidth: 110 },
            5: { cellWidth: 110 },
            6: { cellWidth: 60 },
          },
        });
        blob = doc.output("blob");
        filename = `model-inventory_${ts}.pdf`;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      toast({ title: t("admin.modelAliases.toast.reportReady") });
    } catch (e: any) {
      toast({
        title: t("admin.modelAliases.toast.reportError"),
        description: e?.message ?? String(e),
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const inventoryByTask = new Map((inventory ?? []).map((i) => [i.task_id, i]));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                {t("admin.modelAliases.title")}
              </CardTitle>
              <CardDescription>{t("admin.modelAliases.description")}</CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => refreshInventory(true)} disabled={refreshing}>
                {refreshing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                {t("admin.modelAliases.actions.refreshSnapshot")}
              </Button>
              <Button size="sm" onClick={() => downloadReport("pdf")} disabled={generating}>
                {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                {t("admin.modelAliases.actions.reportPdf")}
              </Button>
              <Button size="sm" variant="outline" onClick={() => downloadReport("csv")} disabled={generating}>
                {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 mr-2" />}
                {t("admin.modelAliases.actions.reportCsv")}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => downloadReport("json")} disabled={generating}>
                <Download className="h-4 w-4 mr-2" />
                {t("admin.modelAliases.actions.reportJson")}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> {t("admin.modelAliases.loading")}
            </div>
          ) : (
            <ScrollArea className="h-[600px] w-full rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">{t("admin.modelAliases.cols.task")}</TableHead>
                    <TableHead className="w-[220px]">{t("admin.modelAliases.cols.realModel")}</TableHead>
                    <TableHead>{t("admin.modelAliases.cols.aliasPt")}</TableHead>
                    <TableHead>{t("admin.modelAliases.cols.aliasEn")}</TableHead>
                    <TableHead className="w-[120px]">{t("admin.modelAliases.cols.status")}</TableHead>
                    <TableHead className="w-[90px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => {
                    const inv = inventoryByTask.get(row.task_id);
                    const drift = inv && inv.real_model !== row.real_model;
                    const dirty = !!draft[row.task_id];
                    return (
                      <TableRow key={row.task_id}>
                        <TableCell>
                          <code className="text-xs">{row.task_id}</code>
                          {row.description && (
                            <div className="text-[11px] text-muted-foreground mt-1">{row.description}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <code className="text-xs">{inv?.real_model ?? row.real_model}</code>
                          {drift && (
                            <div className="flex items-center gap-1 text-[11px] text-amber-600 mt-1">
                              <AlertTriangle className="h-3 w-3" />
                              {t("admin.modelAliases.drift", { stored: row.real_model })}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Input
                            value={draft[row.task_id]?.alias_label_pt ?? row.alias_label_pt}
                            onChange={(e) => onChange(row.task_id, "alias_label_pt", e.target.value)}
                            className="h-8 text-xs"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={draft[row.task_id]?.alias_label_en ?? row.alias_label_en}
                            onChange={(e) => onChange(row.task_id, "alias_label_en", e.target.value)}
                            className="h-8 text-xs"
                          />
                        </TableCell>
                        <TableCell>
                          {inv ? (
                            <Badge variant={inv.governed ? "default" : "secondary"} className="text-[10px]">
                              {inv.governed ? t("admin.modelAliases.badge.governed") : t("admin.modelAliases.badge.inline")}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px]">—</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant={dirty ? "default" : "outline"} disabled={!dirty || savingId === row.task_id} onClick={() => saveRow(row)}>
                            {savingId === row.task_id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ModelAliasesPanel;