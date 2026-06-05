import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { lastChangelogDate } from "@/data/projectChangelog.generated";
import { SENEX_VERSION } from "@/config/senex-version";
import { I18N_VERSION } from "@/i18n";
import { useTranslation } from "react-i18next";
import AuditVersionComparison from "./AuditVersionComparison";
import ComplianceHistoryChart from "./ComplianceHistoryChart";
import { openAuditForPrint, fetchAuditHtml } from "./audit-pdf-generator";
import { renderCoverageScopePt, COVERAGE_VERSION } from "@/data/audit-coverage";
import VersionBadge from "@/components/system/VersionBadge";
import {
  FileText,
  Download,
  ExternalLink,
  Pencil,
  Plus,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  RefreshCw,
  Settings as SettingsIcon,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

// I18N_VERSION precisa bater com src/i18n.ts no momento da geração de uma auditoria.
const CURRENT_I18N_VERSION = I18N_VERSION;

interface TechnicalAudit {
  id: string;
  version: string;
  audit_date: string;
  system_version: string;
  system_changelog_date: string | null;
  scope: string;
  scope_history: Array<{ scope: string; edited_at: string; edited_by?: string }>;
  html_path: string | null;
  html_path_en?: string | null;
  pdf_path: string | null;
  docx_path: string | null;
  summary: Record<string, unknown> & {
    strengths?: number | { count?: number };
    gaps?: number | { count?: number };
    risks?: number | { count?: number };
    pages?: number;
    infographics?: number;
    status?: string;
    stage?: string;
    stage_label?: string;
    progress?: number;
    blocks_done?: number;
    blocks_total?: number;
    warnings?: string[];
    coverage_missing?: string[];
    error?: string;
  };
  superseded_by: string | null;
  created_at: string;
  updated_at: string;
}

interface AuditRequest {
  id: string;
  scope: string;
  system_version: string;
  system_date: string;
  status: string;
  fulfilled_audit_id: string | null;
  requested_at: string;
  auto_triggered?: boolean;
}

// Default scope agora vem do checklist canônico (src/data/audit-coverage.ts) —
// garante que toda nova auditoria parte cobrindo TODAS as áreas do sistema
// (AI Scientist, Fundamentos Arquiteturais, Meta-KG, etc.) e o usuário pode
// adicionar ênfases sem remover itens obrigatórios.
const DEFAULT_NEW_SCOPE = renderCoverageScopePt();

export default function TechnicalAuditsTab() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [audits, setAudits] = useState<TechnicalAudit[]>([]);
  const [requests, setRequests] = useState<AuditRequest[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSuperseded, setShowSuperseded] = useState(false);
  const [threshold, setThreshold] = useState<number>(6);
  const [watching, setWatching] = useState<boolean>(false);
  const [viewerHtml, setViewerHtml] = useState<string | null>(null);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const [viewerLang, setViewerLang] = useState<"pt" | "en">("pt");

  // dialog state
  const [newScope, setNewScope] = useState(DEFAULT_NEW_SCOPE);
  const [newOpen, setNewOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [editTarget, setEditTarget] = useState<TechnicalAudit | null>(null);
  const [editScope, setEditScope] = useState("");

  // Background generation progress (polled from edge function `progress` action)
  const [progress, setProgress] = useState<null | {
    audit_id: string;
    status: string;
    stage: string | null;
    stage_label: string | null;
    progress: number | null;
    error: string | null;
    blocks_done?: number | null;
    blocks_total?: number | null;
    warnings?: string[] | null;
    coverage_missing?: string[] | null;
    log?: Array<{ ts: string; level: "info" | "warn" | "error"; phase: string; message: string; block_id?: string; duration_ms?: number; attempt?: number }> | null;
    last_heartbeat?: string | null;
    resume_count?: number | null;
  }>(null);
  const [logOpen, setLogOpen] = useState(true);
  const [nowTick, setNowTick] = useState(Date.now());
  useEffect(() => {
    if (!progress || progress.status !== "processing") return;
    const i = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(i);
  }, [progress?.status]);

  const load = async () => {
    setLoading(true);
    const [a, r, s] = await Promise.all([
      supabase.from("technical_audits").select("*").order("audit_date", { ascending: false }),
      supabase.from("audit_requests").select("*").order("requested_at", { ascending: false }),
      supabase.from("audit_settings").select("change_threshold").eq("id", true).maybeSingle(),
    ]);
    if (a.data) {
      setAudits(a.data as unknown as TechnicalAudit[]);
      const actives = (a.data as unknown as TechnicalAudit[]).filter((x) => !x.superseded_by);
      const sorted = [...actives].sort((x, y) => {
        const px = (x.version || "0.0.0").split(".").map((n) => parseInt(n, 10) || 0);
        const py = (y.version || "0.0.0").split(".").map((n) => parseInt(n, 10) || 0);
        for (let i = 0; i < Math.max(px.length, py.length); i++) {
          const dx = px[i] ?? 0;
          const dy = py[i] ?? 0;
          if (dx !== dy) return dy - dx;
        }
        return (y.audit_date || "").localeCompare(x.audit_date || "");
      });
      const firstActive = sorted[0];
      if (!selectedId && firstActive) setSelectedId(firstActive.id);
      // Reatar polling em auditorias ainda processando (ex.: usuário recarregou a aba).
      const inflight = (a.data as unknown as TechnicalAudit[]).find(
        (x) => x.summary?.status === "processing",
      );
      if (inflight && !progress) {
        setProgress({
          audit_id: inflight.id,
          status: "processing",
          stage: inflight.summary?.stage ?? null,
          stage_label: inflight.summary?.stage_label ?? null,
          progress: inflight.summary?.progress ?? 0,
          error: null,
          blocks_done: inflight.summary?.blocks_done ?? null,
          blocks_total: inflight.summary?.blocks_total ?? null,
        });
      }
    }
    if (r.data) setRequests(r.data as unknown as AuditRequest[]);
    if (s.data?.change_threshold) setThreshold(s.data.change_threshold as number);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // Re-run MIME fix every load so that newly created audits also get their
    // content-type corrected in storage (previous one-shot localStorage flag
    // skipped audits created after the first run).
    if (typeof window !== "undefined") {
      supabase.functions
        .invoke("generate-audit", { body: { action: "fix_mime" } })
        .catch(() => { /* silent */ });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = useMemo(
    () => audits.find((a) => a.id === selectedId) ?? null,
    [audits, selectedId],
  );

  // Always render the audit HTML via srcDoc — independent of the storage
  // object's Content-Type header. Fixes the "raw HTML displayed as text" bug.
  useEffect(() => {
    let cancelled = false;
    setViewerHtml(null);
    setViewerError(null);
    const path = viewerLang === "en" && selected?.html_path_en ? selected.html_path_en : selected?.html_path;
    if (!path) return;
    setViewerLoading(true);
    fetchAuditHtml(path)
      .then((html) => { if (!cancelled) setViewerHtml(html); })
      .catch((e) => { if (!cancelled) setViewerError(e instanceof Error ? e.message : String(e)); })
      .finally(() => { if (!cancelled) setViewerLoading(false); });
    return () => { cancelled = true; };
  }, [selected?.id, selected?.html_path, selected?.html_path_en, viewerLang]);

  const nextVersion = useMemo(() => {
    // Política: a auditoria SEMPRE herda exatamente a versão Senex atual
    // (fonte única = marker `<!-- senex: x.y.z -->` em CHANGELOG.md).
    // Sem auto-bump. Para rodar nova auditoria, dev precisa bumpar o marker
    // e rodar `npm run sync:changelog` — isso mantém header/footer/auditoria/
    // compliance/organograma sempre alinhados.
    return `v${SENEX_VERSION}`;
  }, [audits]);

  // Auditoria desta versão já existe? Se sim, bloqueamos o botão e instruímos
  // o usuário a bumpar a versão Senex antes de gerar uma nova.
  const alreadyAuditedThisVersion = useMemo(
    () => audits.some((a) => a.version === SENEX_VERSION || a.version === `v${SENEX_VERSION}`),
    [audits],
  );

  const handleRequestNew = async () => {
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-audit", {
        body: {
          version: nextVersion,
          scope: newScope,
          system_version: `Senex v${SENEX_VERSION} · i18n ${CURRENT_I18N_VERSION}`,
          system_changelog_date: lastChangelogDate || new Date().toISOString().slice(0, 10),
          // Carimbo de ambiente: backend usa para declarar preview vs publicado
          // (banco compartilhado; diferenciador é o /drift-report.json servido).
          app_origin: typeof window !== "undefined" ? window.location.origin : "",
        },
      });
      if (error) throw error;
      const newId = (data as any)?.audit?.id ?? null;
      const newAudit = (data as any)?.audit ?? null;
      const isProcessing = (data as any)?.status === "processing";
      toast({
        title: t("audits.toast.requestSuccessTitle", { version: nextVersion }),
        description: isProcessing
          ? "Geração iniciada em segundo plano. O progresso aparece logo abaixo."
          : t("audits.toast.requestSuccessDesc"),
      });
      setNewOpen(false);
      await load();
      if (newId) setSelectedId(newId);
      if (isProcessing && newId) {
        setProgress({ audit_id: newId, status: "processing", stage: "queued", stage_label: "Na fila", progress: 2, error: null });
      }
    } catch (e) {
      toast({
        title: t("audits.toast.requestError"),
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Poll the progress endpoint while a background job is running.
  useEffect(() => {
    if (!progress || progress.status !== "processing") return;
    let cancelled = false;
    const id = progress.audit_id;
    let lastTs = "";
    const tick = async () => {
      try {
        const { data } = await supabase.functions.invoke("generate-audit", {
          body: { action: "progress", audit_id: id, since_ts: lastTs || undefined },
        });
        if (cancelled || !data) return;
        const next = data as any;
        const incoming = Array.isArray(next.log) ? next.log : [];
        if (incoming.length > 0) {
          const lastEntry = incoming[incoming.length - 1];
          if (lastEntry?.ts) lastTs = lastEntry.ts;
        }
        setProgress((prev) => {
          if (!prev || prev.audit_id !== id) return prev;
          const prevLog = Array.isArray(prev.log) ? prev.log : [];
          const mergedLog = lastTs && prevLog.length > 0 ? [...prevLog, ...incoming] : (incoming.length > 0 ? incoming : prevLog);
          return { ...prev, ...next, log: mergedLog };
        });
        if (next.status === "ready" || next.status === "ready_with_warnings" || next.status === "failed") {
          await load();
          if (next.status === "failed") {
            toast({
              title: "Falha na geração da auditoria",
              description: next.error ?? "Erro desconhecido",
              variant: "destructive",
            });
          } else if (next.status === "ready_with_warnings") {
            toast({
              title: `Auditoria ${id.toUpperCase()} pronta com lacunas`,
              description: `${(next.coverage_missing?.length ?? 0)} item(ns) do checklist não foram emitidos. Re-execute para preencher.`,
            });
          } else {
            toast({ title: `Auditoria ${id.toUpperCase()} pronta` });
          }
          // Keep ready banner visible briefly, then clear.
          setTimeout(() => { if (!cancelled) setProgress(null); }, 4000);
        }
      } catch {
        /* swallow — next tick will retry */
      }
    };
    const interval = setInterval(tick, 2000);
    tick();
    return () => { cancelled = true; clearInterval(interval); };
  }, [progress?.audit_id, progress?.status]);

  const handleSaveScope = async () => {
    if (!editTarget) return;
    const history = [
      ...(editTarget.scope_history || []),
      { scope: editTarget.scope, edited_at: new Date().toISOString() },
    ];
    const { error } = await supabase
      .from("technical_audits")
      .update({ scope: editScope, scope_history: history })
      .eq("id", editTarget.id);
    if (error) {
      toast({ title: t("audits.toast.saveError"), description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: t("audits.toast.scopeUpdated") });
    setEditTarget(null);
    load();
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");

  const activeAudits = useMemo(() => audits.filter((a) => !a.superseded_by), [audits]);
  const supersededAudits = useMemo(() => audits.filter((a) => a.superseded_by), [audits]);
  // Ordena por versão semântica desc (mais recente à esquerda), com fallback
  // por audit_date desc quando a versão não é parseável.
  const compareVersionDesc = (a: TechnicalAudit, b: TechnicalAudit) => {
    const pa = (a.version || "0.0.0").split(".").map((n) => parseInt(n, 10) || 0);
    const pb = (b.version || "0.0.0").split(".").map((n) => parseInt(n, 10) || 0);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const da = pa[i] ?? 0;
      const db = pb[i] ?? 0;
      if (da !== db) return db - da;
    }
    return (b.audit_date || "").localeCompare(a.audit_date || "");
  };
  const visibleAudits = useMemo(
    () => [...(showSuperseded ? audits : activeAudits)].sort(compareVersionDesc),
    [audits, activeAudits, showSuperseded],
  );

  const runWatchdog = async () => {
    setWatching(true);
    try {
      const { data, error } = await supabase.functions.invoke("audit-change-watchdog");
      if (error) throw error;
      const d = data as { count?: number; shouldTrigger?: boolean; created?: boolean };
      toast({
        title: d?.created
          ? "Nova solicitação de auditoria criada"
          : d?.shouldTrigger
            ? `${d.count} mudanças detectadas — já existe solicitação pendente`
            : `Somente ${d?.count ?? 0} mudanças desde a última auditoria (limite ${threshold})`,
      });
      load();
    } catch (e) {
      toast({
        title: "Falha ao verificar mudanças",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setWatching(false);
    }
  };

  const saveThreshold = async (value: number) => {
    setThreshold(value);
    await supabase.from("audit_settings").update({ change_threshold: value }).eq("id", true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            {t("audits.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            {t("audits.subtitle")}
          </p>
          <p className="text-[11px] text-muted-foreground mt-2 italic">
            {t("audits.ownership")}
          </p>
          <div className="mt-3">
            <VersionBadge />
          </div>
        </div>

        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" disabled={alreadyAuditedThisVersion} title={alreadyAuditedThisVersion
              ? `v${SENEX_VERSION} já foi auditada. Bumpe o marker "<!-- senex: x.y.z -->" em CHANGELOG.md e rode npm run sync:changelog para liberar uma nova auditoria.`
              : undefined}>
              <Plus className="h-4 w-4" />
              {alreadyAuditedThisVersion
                ? `${nextVersion} já auditada — bumpe SENEX_VERSION`
                : t("audits.newButton", { version: nextVersion })}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {t("audits.newDialog.title")}
              </DialogTitle>
              <DialogDescription>
                {t("audits.newDialog.description")}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <label className="text-xs text-muted-foreground">{t("audits.newDialog.auditVersion")}</label>
                <Input value={nextVersion} disabled />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">{t("audits.newDialog.systemVersion")}</label>
                <Input value={CURRENT_I18N_VERSION} disabled />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground">{t("audits.newDialog.lastChangelog")}</label>
                <Input value={lastChangelogDate || "—"} disabled />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">{t("audits.newDialog.scope")}</label>
              <p className="text-[10px] text-muted-foreground mb-1">
                Checklist canônico v{COVERAGE_VERSION} — todos os itens abaixo serão exigidos no relatório. Você pode acrescentar ênfases no final, mas não reduza o checklist.
              </p>
              <Textarea
                value={newScope}
                onChange={(e) => setNewScope(e.target.value)}
                rows={18}
                className="font-mono text-xs mt-1"
              />
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setNewOpen(false)}>{t("audits.newDialog.cancel")}</Button>
              <Button onClick={handleRequestNew} disabled={submitting || !newScope.trim()}>
                {submitting ? t("audits.newDialog.submitting") : t("audits.newDialog.submit")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Banner de fila removido: a geração agora é instantânea. */}

      {progress && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="py-3 space-y-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <RefreshCw className={`h-4 w-4 ${progress.status === "processing" ? "animate-spin text-primary" : progress.status === "failed" ? "text-destructive" : progress.status === "ready_with_warnings" ? "text-amber-600" : "text-success"}`} />
                <span className="font-medium truncate">
                  {progress.audit_id.toUpperCase()} —{" "}
                  {progress.status === "ready"
                    ? "Pronto"
                    : progress.status === "ready_with_warnings"
                      ? "Pronto com lacunas"
                    : progress.status === "failed"
                      ? "Falhou"
                      : (progress.stage_label ?? "Processando")}
                </span>
                {progress.status === "processing" && progress.blocks_total ? (
                  <Badge variant="outline" className="text-[10px] ml-1">
                    {progress.blocks_done ?? 0}/{progress.blocks_total} blocos
                  </Badge>
                ) : null}
              </div>
              <span className="text-xs text-muted-foreground tabular-nums">
                {Math.round(progress.progress ?? 0)}%
              </span>
            </div>
            <Progress value={progress.progress ?? 0} className="h-2" />
            {progress.error && (
              <p className="text-xs text-destructive">{progress.error}</p>
            )}
            {progress.status === "ready_with_warnings" && progress.coverage_missing && progress.coverage_missing.length > 0 && (
              <p className="text-xs text-amber-700">
                Lacunas no checklist: <span className="font-mono">{progress.coverage_missing.slice(0, 6).join(", ")}{progress.coverage_missing.length > 6 ? "…" : ""}</span>
              </p>
            )}
            {/* Heartbeat + watchdog status */}
            {progress.status === "processing" && (() => {
              const hb = progress.last_heartbeat ? new Date(progress.last_heartbeat).getTime() : 0;
              const ageMs = hb ? nowTick - hb : 0;
              const ageSec = Math.max(0, Math.round(ageMs / 1000));
              const tone = !hb ? "text-muted-foreground" : ageSec > 90 ? "text-destructive" : ageSec > 30 ? "text-amber-700" : "text-muted-foreground";
              return (
                <div className="flex items-center gap-2 text-[11px]">
                  <span className={tone}>
                    Última atividade: {hb ? `há ${ageSec}s` : "—"}
                    {(progress.resume_count ?? 0) > 0 ? ` · retomadas: ${progress.resume_count}` : ""}
                  </span>
                  {ageSec > 90 && (
                    <Badge variant="destructive" className="text-[9px]">watchdog acionará em breve</Badge>
                  )}
                </div>
              );
            })()}
            {/* Live log panel */}
            {progress.log && progress.log.length > 0 && (
              <div className="mt-1">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setLogOpen((v) => !v)}
                    className="text-[11px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                  >
                    {logOpen ? "▾" : "▸"} Log da geração ({progress.log.length} entradas)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const lines = (progress.log || []).map((e) => `[${e.ts}] ${e.level.toUpperCase()} ${e.phase}: ${e.message}`);
                      const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `auditoria-${progress.audit_id}-log.txt`;
                      a.click();
                      setTimeout(() => URL.revokeObjectURL(url), 30000);
                    }}
                    className="text-[11px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                  >
                    ⬇ Baixar log completo (.txt)
                  </button>
                </div>
                {logOpen && (
                  <ScrollArea className="mt-1 h-48 rounded border bg-background/60 p-2">
                    <ul className="space-y-1 font-mono text-[10.5px] leading-snug">
                      {[...progress.log].reverse().map((e, i) => {
                        const ts = new Date(e.ts);
                        const ago = Math.max(0, Math.round((nowTick - ts.getTime()) / 1000));
                        const color = e.level === "error" ? "text-destructive" : e.level === "warn" ? "text-amber-700" : "text-foreground";
                        return (
                          <li key={`${e.ts}-${i}`} className="flex gap-2">
                            <span className="text-muted-foreground shrink-0 w-16">há {ago}s</span>
                            <span className="shrink-0 w-16 uppercase text-muted-foreground">{e.phase}</span>
                            <span className={`${color} break-words`}>{e.message}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </ScrollArea>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 1. Gráfico de evolução — largura total */}
      {!loading && audits.length >= 1 && (
        <ComplianceHistoryChart audits={audits} />
      )}

      {/* 2. Comparação entre versões — largura total */}
      {!loading && activeAudits.length >= 2 && (
        <AuditVersionComparison audits={activeAudits} />
      )}

      {/* 3. Última auditoria — largura total, com lista horizontal acima */}
      <div className="space-y-3">
        {!loading && visibleAudits.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {visibleAudits.map((a) => {
              const isSelected = a.id === selectedId;
              const isSuperseded = !!a.superseded_by;
              return (
                <Card
                  key={a.id}
                  className={`cursor-pointer transition-all shrink-0 w-[280px] ${
                    isSelected ? "border-primary shadow-md" : "hover:border-muted-foreground/30"
                  } ${isSuperseded ? "opacity-60" : ""}`}
                  onClick={() => setSelectedId(a.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        {a.id.toUpperCase()}
                      </CardTitle>
                      <Badge variant="outline" className="text-[10px]">{a.audit_date}</Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">
                      <span className="font-mono">{a.system_version}</span>
                    </p>
                    {isSuperseded && (
                      <Badge variant="secondary" className="text-[9px] mt-1 w-fit">
                        Substituída por {a.superseded_by?.toUpperCase()}
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2 pb-3">
                    <div className="flex flex-wrap gap-1 text-[10px]">
                      {typeof a.summary?.strengths === "number" && (
                        <Badge variant="secondary" className="gap-1 text-[10px] py-0">
                          <CheckCircle2 className="h-2.5 w-2.5" />{a.summary.strengths as number}
                        </Badge>
                      )}
                      {typeof a.summary?.gaps === "number" && (
                        <Badge variant="secondary" className="gap-1 text-[10px] py-0">
                          <AlertTriangle className="h-2.5 w-2.5" />{a.summary.gaps as number}
                        </Badge>
                      )}
                      {typeof a.summary?.risks === "number" && (
                        <Badge variant="destructive" className="gap-1 text-[10px] py-0">{a.summary.risks as number}</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {a.html_path && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-[10px] gap-1"
                          onClick={(e) => { e.stopPropagation(); window.open(a.html_path!, "_blank"); }}
                        >
                          <ExternalLink className="h-2.5 w-2.5" /> HTML
                        </Button>
                      )}
                      {a.html_path && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-[10px] gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            openAuditForPrint(a).catch((err) =>
                              toast({
                                title: "Não foi possível abrir o PDF",
                                description: err instanceof Error ? err.message : String(err),
                                variant: "destructive",
                              }),
                            );
                          }}
                          title="Abre o relatório e dispara o diálogo Salvar como PDF do navegador"
                        >
                          <Download className="h-2.5 w-2.5" /> PDF
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-[10px] gap-1 ml-auto"
                        onClick={(e) => { e.stopPropagation(); setEditTarget(a); setEditScope(a.scope); }}
                      >
                        <Pencil className="h-2.5 w-2.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Viewer largura total */}
        <Card className="min-h-[600px]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-base">
                {selected ? `${selected.id.toUpperCase()} — ${selected.audit_date}` : t("audits.viewer.select")}
              </CardTitle>
              {selected?.html_path && (
                <div className="flex flex-wrap items-center gap-2">
                  {selected?.html_path_en && (
                    <div className="inline-flex rounded-md border bg-background p-0.5 text-xs">
                      <button
                        type="button"
                        onClick={() => setViewerLang("pt")}
                        className={`px-2 py-1 rounded ${viewerLang === "pt" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        PT
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewerLang("en")}
                        className={`px-2 py-1 rounded ${viewerLang === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        EN
                      </button>
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => window.open((viewerLang === "en" && selected.html_path_en) ? selected.html_path_en : selected.html_path!, "_blank")}
                  >
                    <ExternalLink className="h-3 w-3" /> {t("audits.viewer.openNewTab")}
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1" asChild>
                    <a
                      href={selected.html_path}
                      download={`auditoria-${selected.id}.html`}
                    >
                      <Download className="h-3 w-3" /> HTML
                    </a>
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    className="gap-1"
                    onClick={() =>
                      openAuditForPrint(selected).catch((err) =>
                        toast({
                          title: "Não foi possível abrir o PDF",
                          description: err instanceof Error ? err.message : String(err),
                          variant: "destructive",
                        }),
                      )
                    }
                    title="Abre o relatório e dispara o diálogo Salvar como PDF do navegador"
                  >
                    <Download className="h-3 w-3" /> PDF
                  </Button>
                </div>
              )}
            </div>
            {selected && (
              <ScrollArea className="max-h-32 mt-2">
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{selected.scope}</p>
              </ScrollArea>
            )}
          </CardHeader>
          <CardContent>
            {selected?.html_path ? (
              viewerLoading ? (
                <div className="flex items-center justify-center h-[75vh] text-sm text-muted-foreground gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" /> Carregando relatório…
                </div>
              ) : viewerError ? (
                <div className="flex flex-col items-center justify-center h-[75vh] text-sm text-destructive gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Falha ao carregar: {viewerError}</span>
                </div>
              ) : viewerHtml ? (
                <iframe
                  srcDoc={viewerHtml}
                  title={`Auditoria ${selected.id}`}
                  className="w-full h-[75vh] border rounded-md bg-white"
                  sandbox="allow-same-origin allow-popups"
                />
              ) : null
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">
                {t("audits.viewer.noHtml")}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Painel auditoria automática + supersedidas */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-start">
          {!loading && (
            <Card className="border-muted">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs flex items-center gap-2 text-muted-foreground">
                  <SettingsIcon className="h-3.5 w-3.5" />
                  Auditoria automática
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <label className="text-muted-foreground">Limite:</label>
                  <Input
                    type="number"
                    min={2}
                    max={20}
                    value={threshold}
                    onChange={(e) => saveThreshold(Math.max(2, Math.min(20, Number(e.target.value) || 6)))}
                    className="h-7 w-16 text-xs"
                  />
                  <span className="text-muted-foreground">mudanças críticas</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1 text-xs ml-auto"
                    onClick={runWatchdog}
                    disabled={watching}
                  >
                    <RefreshCw className={`h-3 w-3 ${watching ? "animate-spin" : ""}`} />
                    {watching ? "Verificando…" : "Verificar agora"}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground leading-snug">
                  Conta entradas Added/Changed/Fixed em <code>curation · kg · clinical-pipeline · infra · base-knowledge</code> desde a última auditoria ativa.
                </p>
              </CardContent>
            </Card>
          )}

          {!loading && supersededAudits.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="h-9 text-xs gap-1 text-muted-foreground"
              onClick={() => setShowSuperseded((v) => !v)}
            >
              {showSuperseded ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {showSuperseded ? "Ocultar" : "Mostrar"} {supersededAudits.length} substituída(s)
            </Button>
          )}
        </div>

        {loading && <p className="text-sm text-muted-foreground">{t("audits.loading")}</p>}
        {!loading && audits.length === 0 && (
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground text-center">
              {t("audits.empty")}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit scope dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("audits.editScope.title", { id: editTarget?.id.toUpperCase() ?? "" })}</DialogTitle>
            <DialogDescription>{t("audits.editScope.description")}</DialogDescription>
          </DialogHeader>
          <Textarea
            value={editScope}
            onChange={(e) => setEditScope(e.target.value)}
            rows={14}
            className="font-mono text-xs"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditTarget(null)}>{t("audits.common.cancel")}</Button>
            <Button onClick={handleSaveScope}>{t("audits.common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}