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
import { useTranslation } from "react-i18next";
import AuditVersionComparison from "./AuditVersionComparison";
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
  Bot,
  Eye,
  EyeOff,
  RefreshCw,
  Settings as SettingsIcon,
} from "lucide-react";

// I18N_VERSION precisa bater com src/i18n.ts no momento da geração de uma auditoria.
const CURRENT_I18N_VERSION = "1.63.0";

interface TechnicalAudit {
  id: string;
  version: string;
  audit_date: string;
  system_version: string;
  system_changelog_date: string | null;
  scope: string;
  scope_history: Array<{ scope: string; edited_at: string; edited_by?: string }>;
  html_path: string | null;
  pdf_path: string | null;
  docx_path: string | null;
  summary: Record<string, unknown> & {
    strengths?: number | { count?: number };
    gaps?: number | { count?: number };
    risks?: number | { count?: number };
    pages?: number;
    infographics?: number;
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

const DEFAULT_NEW_SCOPE = `Cobertura desejada da próxima auditoria:

• Pipeline de curadoria de 7 estágios (PDF → triplets → KG → recomendação)
• Modelo de 5 camadas do Knowledge Graph (Compostos · Mecanismos · Pathways · Condições · Outcomes)
• Políticas RLS de todas as tabelas críticas e função has_role
• Conformidade regulatória FDA / EMA / AVMA (requisitos vs evidências vs gaps)
• Sistema bilingue PT/EN — paridade de chaves, dados estáticos e DB
• Motor de recomendação híbrida (limite de 8 compostos sinérgicos)
• Digital Twin & projeções de longevidade (Gompertz por raça)
• Pipeline de gap-fill PubMed + Gemini
• Integração SNOMED-CT VetSCT e UMLS
• Auditoria de tradução e cache-busting i18n
• Infográficos de fluxo do sistema

Adicione ou remova itens conforme o foco desta auditoria.`;

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

  // dialog state
  const [newScope, setNewScope] = useState(DEFAULT_NEW_SCOPE);
  const [newOpen, setNewOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [editTarget, setEditTarget] = useState<TechnicalAudit | null>(null);
  const [editScope, setEditScope] = useState("");

  const load = async () => {
    setLoading(true);
    const [a, r, s] = await Promise.all([
      supabase.from("technical_audits").select("*").order("audit_date", { ascending: false }),
      supabase.from("audit_requests").select("*").order("requested_at", { ascending: false }),
      supabase.from("audit_settings").select("change_threshold").eq("id", true).maybeSingle(),
    ]);
    if (a.data) {
      setAudits(a.data as unknown as TechnicalAudit[]);
      const firstActive = (a.data as Array<{ id: string; superseded_by: string | null }>)
        .find((x) => !x.superseded_by);
      if (!selectedId && firstActive) setSelectedId(firstActive.id);
    }
    if (r.data) setRequests(r.data as unknown as AuditRequest[]);
    if (s.data?.change_threshold) setThreshold(s.data.change_threshold as number);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = useMemo(
    () => audits.find((a) => a.id === selectedId) ?? null,
    [audits, selectedId],
  );

  const nextVersion = useMemo(() => {
    return `v${SENEX_VERSION}`;
  }, [audits]);

  const handleRequestNew = async () => {
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("audit_requests").insert({
      scope: newScope,
      system_version: `i18n ${CURRENT_I18N_VERSION}`,
      system_date: lastChangelogDate || new Date().toISOString().slice(0, 10),
      status: "pending",
      requested_by: user?.id ?? null,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: t("audits.toast.requestError"), description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: t("audits.toast.requestSuccessTitle", { version: nextVersion }),
      description: t("audits.toast.requestSuccessDesc"),
    });
    setNewOpen(false);
    load();
  };

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
  const visibleAudits = showSuperseded ? audits : activeAudits;

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
        </div>

        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {t("audits.newButton", { version: nextVersion })}
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
              <Textarea
                value={newScope}
                onChange={(e) => setNewScope(e.target.value)}
                rows={14}
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

      {pendingRequests.length > 0 && (
        <Card className="border-amber-300 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="py-3 flex items-center gap-3 text-sm flex-wrap">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-muted-foreground">{t("audits.pendingBanner", { count: pendingRequests.length })}</span>
            {pendingRequests.some((r) => r.auto_triggered) && (
              <Badge variant="outline" className="gap-1 text-[10px]">
                <Bot className="h-3 w-3" />
                auto-disparada
              </Badge>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        {/* Lista */}
        <div className="space-y-3">
          {!loading && activeAudits.length >= 2 && (
            <AuditVersionComparison audits={activeAudits} />
          )}

          {/* Painel de configuração do watchdog */}
          {!loading && (
            <Card className="border-muted">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs flex items-center gap-2 text-muted-foreground">
                  <SettingsIcon className="h-3.5 w-3.5" />
                  Auditoria automática
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
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
                </div>
                <p className="text-[10px] text-muted-foreground leading-snug">
                  Conta entradas Added/Changed/Fixed em <code>curation · kg · clinical-pipeline · infra · base-knowledge</code> desde a última auditoria ativa.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-7 gap-1 text-xs"
                  onClick={runWatchdog}
                  disabled={watching}
                >
                  <RefreshCw className={`h-3 w-3 ${watching ? "animate-spin" : ""}`} />
                  {watching ? "Verificando…" : "Verificar agora"}
                </Button>
              </CardContent>
            </Card>
          )}

          {loading && (
            <p className="text-sm text-muted-foreground">{t("audits.loading")}</p>
          )}
          {visibleAudits.map((a) => {
            const isSelected = a.id === selectedId;
            const isSuperseded = !!a.superseded_by;
            return (
              <Card
                key={a.id}
                className={`cursor-pointer transition-all ${
                  isSelected ? "border-primary shadow-md" : "hover:border-muted-foreground/30"
                } ${isSuperseded ? "opacity-60" : ""}`}
                onClick={() => setSelectedId(a.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      {t("audits.auditCard.title", { id: a.id.toUpperCase() })}
                    </CardTitle>
                    <Badge variant="outline">{a.audit_date}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("audits.system")}: <span className="font-mono">{a.system_version}</span>
                    {a.system_changelog_date && ` · ${a.system_changelog_date}`}
                  </p>
                  {isSuperseded && (
                    <Badge variant="secondary" className="text-[10px] mt-1 w-fit">
                      Substituída por {a.superseded_by?.toUpperCase()}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    {typeof a.summary?.strengths === "number" && (
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />{t("audits.auditCard.strengths", { count: a.summary.strengths })}
                      </Badge>
                    )}
                    {typeof a.summary?.gaps === "number" && (
                      <Badge variant="secondary" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />{t("audits.auditCard.gaps", { count: a.summary.gaps })}
                      </Badge>
                    )}
                    {typeof a.summary?.risks === "number" && (
                      <Badge variant="destructive" className="gap-1">
                        {t("audits.auditCard.risks", { count: a.summary.risks })}
                      </Badge>
                    )}
                    {typeof a.summary?.pages === "number" && (
                      <Badge variant="outline">{t("audits.auditCard.pages", { count: a.summary.pages })}</Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {a.html_path && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(a.html_path!, "_blank");
                        }}
                      >
                        <ExternalLink className="h-3 w-3" /> HTML
                      </Button>
                    )}
                    {a.pdf_path && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs gap-1"
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
                        <a href={a.pdf_path} download>
                          <Download className="h-3 w-3" /> PDF
                        </a>
                      </Button>
                    )}
                    {a.docx_path && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs gap-1"
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
                        <a href={a.docx_path} download>
                          <Download className="h-3 w-3" /> DOCX
                        </a>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs gap-1 ml-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditTarget(a);
                        setEditScope(a.scope);
                      }}
                    >
                      <Pencil className="h-3 w-3" /> {t("audits.scopeButton")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {!loading && audits.length === 0 && (
            <Card>
              <CardContent className="py-6 text-sm text-muted-foreground text-center">
                {t("audits.empty")}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Visualizador */}
        <Card className="min-h-[600px]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-base">
                {selected ? `${selected.id.toUpperCase()} — ${selected.audit_date}` : t("audits.viewer.select")}
              </CardTitle>
              {selected?.html_path && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={() => window.open(selected.html_path!, "_blank")}
                >
                  <ExternalLink className="h-3 w-3" /> {t("audits.viewer.openNewTab")}
                </Button>
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
              <iframe
                src={selected.html_path}
                title={`Auditoria ${selected.id}`}
                className="w-full h-[70vh] border rounded-md bg-white"
              />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">
                {t("audits.viewer.noHtml")}
              </p>
            )}
          </CardContent>
        </Card>
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