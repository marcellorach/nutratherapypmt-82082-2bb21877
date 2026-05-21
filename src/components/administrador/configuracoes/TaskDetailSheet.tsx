import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle2, History, Play, Save, Sparkles, Wand2 } from "lucide-react";
import type { AITaskDefinition, AIModelId } from "@/config/ai-tasks";
import {
  useAIPromptVersions,
  useActivatePromptVersion,
  useCreatePromptVersion,
  useTaskTestHistory,
  useTaskTestRun,
  type AIPromptVersionRow,
} from "@/hooks/useAIPromptVersions";

/** Naive highlighter: marks tokens known to be model-specific. */
const HIGHLIGHT_PATTERNS: Array<{ re: RegExp; cls: string; reason: string }> = [
  { re: /<thinking>[\s\S]*?<\/thinking>/g, cls: "bg-amber-100 dark:bg-amber-900/40", reason: "<thinking> bloco (GPT reasoning)" },
  { re: /reasoning[_\s-]?effort/gi, cls: "bg-emerald-100 dark:bg-emerald-900/40", reason: "reasoning_effort (OpenAI)" },
  { re: /context[_\s-]?caching/gi, cls: "bg-sky-100 dark:bg-sky-900/40", reason: "context_caching (Gemini)" },
  { re: /(?:^|\n)===[^\n]*===/g, cls: "bg-purple-100 dark:bg-purple-900/40", reason: "Section delimiter ===" },
  { re: /\{\{\s*\w+\s*\}\}/g, cls: "bg-rose-100 dark:bg-rose-900/40", reason: "Template variable {{var}}" },
];

function HighlightedPreview({ text }: { text: string }) {
  if (!text) {
    return <p className="text-xs text-muted-foreground italic">Sem prompt definido.</p>;
  }
  type Seg = { start: number; end: number; cls: string };
  const segs: Seg[] = [];
  HIGHLIGHT_PATTERNS.forEach(({ re, cls }) => {
    const r = new RegExp(re.source, re.flags);
    let m: RegExpExecArray | null;
    while ((m = r.exec(text)) !== null) {
      segs.push({ start: m.index, end: m.index + m[0].length, cls });
      if (m.index === r.lastIndex) r.lastIndex++;
    }
  });
  segs.sort((a, b) => a.start - b.start);
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  segs.forEach((s, i) => {
    if (s.start < cursor) return;
    if (s.start > cursor) parts.push(<span key={`p${i}-pre`}>{text.slice(cursor, s.start)}</span>);
    parts.push(
      <mark key={`p${i}-hi`} className={`${s.cls} rounded px-0.5`}>
        {text.slice(s.start, s.end)}
      </mark>,
    );
    cursor = s.end;
  });
  if (cursor < text.length) parts.push(<span key="tail">{text.slice(cursor)}</span>);
  return (
    <pre className="text-[11px] whitespace-pre-wrap font-mono leading-relaxed bg-muted/30 rounded p-3 max-h-[260px] overflow-auto">
      {parts}
    </pre>
  );
}

function modelBadge(model: string): string {
  if (model.startsWith("openai/")) return "border-emerald-300 text-emerald-700 dark:text-emerald-300 dark:border-emerald-900";
  if (model.includes("gemini-3")) return "border-sky-300 text-sky-700 dark:text-sky-300 dark:border-sky-900";
  return "border-slate-300 text-slate-700 dark:text-slate-300";
}

interface Props {
  task: AITaskDefinition | null;
  onClose: () => void;
}

const TaskDetailSheet: React.FC<Props> = ({ task, onClose }) => {
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith("en");
  const open = !!task;

  const taskId = task?.id ?? "";
  const { data: versions, isLoading: loadingVersions } = useAIPromptVersions(taskId || undefined);
  const { data: history } = useTaskTestHistory(taskId);

  const createVersion = useCreatePromptVersion();
  const activateVersion = useActivatePromptVersion();
  const testRun = useTaskTestRun();

  const [selectedModel, setSelectedModel] = useState<AIModelId | null>(null);
  const [systemDraft, setSystemDraft] = useState<string>("");
  const [userDraft, setUserDraft] = useState<string>("");
  const [activateAfterSave, setActivateAfterSave] = useState(true);
  const [optimizationNotes, setOptimizationNotes] = useState("");

  const [testInput, setTestInput] = useState("");
  const [testModelB, setTestModelB] = useState<AIModelId | "">("");
  const [resultA, setResultA] = useState<{ output: string; latency: number; tokensIn: number; tokensOut: number; cost: number; error?: string } | null>(null);
  const [resultB, setResultB] = useState<{ output: string; latency: number; tokensIn: number; tokensOut: number; cost: number; error?: string } | null>(null);
  const [running, setRunning] = useState(false);

  const effectiveModel: AIModelId = (selectedModel ?? task?.recommended_model ?? "google/gemini-3-flash-preview") as AIModelId;

  const activeForModel = useMemo(
    () => (versions ?? []).find((v) => v.is_active && (v.model_id === effectiveModel || v.model_id === null)),
    [versions, effectiveModel],
  );

  // Pre-fill drafts when model changes / sheet opens
  React.useEffect(() => {
    if (!task) return;
    setSelectedModel(task.recommended_model);
    setResultA(null);
    setResultB(null);
  }, [task]);

  React.useEffect(() => {
    if (activeForModel) {
      setSystemDraft(activeForModel.system_prompt ?? "");
      setUserDraft(activeForModel.user_prompt ?? "");
      setOptimizationNotes(activeForModel.optimization_notes ?? "");
    } else {
      setSystemDraft("");
      setUserDraft("");
      setOptimizationNotes("");
    }
  }, [activeForModel?.id]);

  if (!task) return null;

  const handleSave = async () => {
    try {
      await createVersion.mutateAsync({
        task_id: task.id,
        model_id: effectiveModel,
        system_prompt: systemDraft,
        user_prompt: userDraft,
        optimization_notes: optimizationNotes || null,
        optimized_for_model: true,
        activate: activateAfterSave,
      });
      toast({ title: isEn ? "Version saved" : "Versão salva", description: activateAfterSave ? (isEn ? "Set as active." : "Definida como ativa.") : undefined });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro", description: e?.message ?? String(e) });
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await activateVersion.mutateAsync(id);
      toast({ title: isEn ? "Version activated" : "Versão ativada" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro", description: e?.message ?? String(e) });
    }
  };

  const runOne = async (model: AIModelId) => {
    return testRun.mutateAsync({
      task_id: task.id,
      model_id: model,
      input: testInput,
      system_prompt: systemDraft || undefined,
      user_prompt: userDraft || undefined,
      reasoning_effort: task.routing.reasoning_effort,
      temperature: task.routing.temperature,
    });
  };

  const handleRun = async () => {
    if (!testInput.trim()) return;
    setRunning(true);
    setResultA(null);
    setResultB(null);
    try {
      const promises: Promise<unknown>[] = [
        runOne(effectiveModel)
          .then((r) => setResultA({ output: r.output, latency: r.latency_ms, tokensIn: r.tokens_in, tokensOut: r.tokens_out, cost: r.cost_estimate }))
          .catch((e) => setResultA({ output: "", latency: 0, tokensIn: 0, tokensOut: 0, cost: 0, error: e?.message ?? String(e) })),
      ];
      if (testModelB && testModelB !== effectiveModel) {
        promises.push(
          runOne(testModelB as AIModelId)
            .then((r) => setResultB({ output: r.output, latency: r.latency_ms, tokensIn: r.tokens_in, tokensOut: r.tokens_out, cost: r.cost_estimate }))
            .catch((e) => setResultB({ output: "", latency: 0, tokensIn: 0, tokensOut: 0, cost: 0, error: e?.message ?? String(e) })),
        );
      }
      await Promise.all(promises);
    } finally {
      setRunning(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            {isEn ? task.label_en : task.label_pt}
          </SheetTitle>
          <SheetDescription className="text-xs">
            <code className="font-mono">{task.id}</code> ·{" "}
            {isEn ? "Recommended" : "Recomendado"}:{" "}
            <Badge variant="outline" className={modelBadge(task.recommended_model)}>
              {task.recommended_model}
            </Badge>
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="prompt" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="prompt">{isEn ? "Prompt" : "Prompt"}</TabsTrigger>
            <TabsTrigger value="model">{isEn ? "Model" : "Modelo"}</TabsTrigger>
            <TabsTrigger value="test">{isEn ? "Test" : "Testar"}</TabsTrigger>
            <TabsTrigger value="history">
              <History className="h-3 w-3 mr-1" /> {isEn ? "History" : "Histórico"}
            </TabsTrigger>
          </TabsList>

          {/* PROMPT TAB */}
          <TabsContent value="prompt" className="space-y-3 mt-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{isEn ? "Editing for" : "Editando para"}:</span>
              <Badge variant="outline" className={modelBadge(effectiveModel)}>
                {effectiveModel}
              </Badge>
              {!activeForModel && (
                <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-300">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {isEn ? "no version yet" : "sem versão"}
                </Badge>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">System prompt</label>
              <Textarea
                value={systemDraft}
                onChange={(e) => setSystemDraft(e.target.value)}
                rows={6}
                className="font-mono text-xs"
                placeholder={isEn ? "System instructions…" : "Instruções de sistema…"}
              />
              <HighlightedPreview text={systemDraft} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">
                User prompt template <span className="text-muted-foreground">({"{{input}}"} {isEn ? "is replaced at test time" : "é substituído ao testar"})</span>
              </label>
              <Textarea
                value={userDraft}
                onChange={(e) => setUserDraft(e.target.value)}
                rows={5}
                className="font-mono text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">{isEn ? "Optimization notes" : "Notas de otimização"}</label>
              <Input
                value={optimizationNotes}
                onChange={(e) => setOptimizationNotes(e.target.value)}
                placeholder={isEn ? "Why this prompt is tuned for this model" : "Por que este prompt foi ajustado para este modelo"}
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={activateAfterSave}
                  onChange={(e) => setActivateAfterSave(e.target.checked)}
                />
                {isEn ? "Activate after saving" : "Ativar ao salvar"}
              </label>
              <Button size="sm" onClick={handleSave} disabled={createVersion.isPending || !systemDraft.trim()}>
                <Save className="h-3 w-3 mr-1" />
                {createVersion.isPending ? (isEn ? "Saving…" : "Salvando…") : (isEn ? "Save new version" : "Salvar nova versão")}
              </Button>
            </div>

            {/* Version history for this model */}
            <Card className="mt-3">
              <CardHeader className="py-3">
                <CardTitle className="text-xs">{isEn ? "Versions for this task" : "Versões desta tarefa"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-xs max-h-[180px] overflow-auto">
                {loadingVersions ? (
                  <Skeleton className="h-12 w-full" />
                ) : (versions ?? []).length === 0 ? (
                  <p className="text-muted-foreground italic">{isEn ? "No versions yet." : "Sem versões."}</p>
                ) : (
                  (versions ?? []).map((v: AIPromptVersionRow) => (
                    <div key={v.id} className="flex items-center justify-between border rounded px-2 py-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono">v{v.version}</span>
                        <Badge variant="outline" className="text-[10px]">{v.model_id ?? "any"}</Badge>
                        {v.is_active && (
                          <Badge className="text-[10px] bg-emerald-600">
                            <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> active
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(v.created_at).toLocaleDateString()}
                        </span>
                        {!v.is_active && (
                          <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => handleActivate(v.id)}>
                            {isEn ? "Activate" : "Ativar"}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* MODEL TAB */}
          <TabsContent value="model" className="space-y-3 mt-4">
            <p className="text-xs text-muted-foreground">
              {isEn
                ? "Pick the active model for editing/testing. Changing here updates the editor's target model — persistence happens when you save a new version."
                : "Escolha o modelo ativo para edição/teste. Alterar aqui muda o alvo do editor — a persistência acontece ao salvar nova versão."}
            </p>
            <div className="grid sm:grid-cols-2 gap-2">
              {task.candidate_models.map((m) => {
                const isActive = effectiveModel === m;
                const isReco = task.recommended_model === m;
                return (
                  <Card key={m} className={`cursor-pointer ${isActive ? "border-primary ring-1 ring-primary/40" : ""}`} onClick={() => setSelectedModel(m)}>
                    <CardContent className="p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className={`text-[10px] ${modelBadge(m)}`}>{m}</Badge>
                        {isReco && <Badge className="text-[9px] bg-amber-500">recommended</Badge>}
                      </div>
                      <div className="text-[10px] text-muted-foreground space-x-2">
                        {m.startsWith("openai/") && <span>extended reasoning</span>}
                        {m.includes("gemini-3-pro") && <span>2M ctx · PDF native</span>}
                        {m.includes("gemini-2.5-pro") && <span>2M ctx · cache</span>}
                        {m.includes("flash") && <span>low latency</span>}
                      </div>
                      {isActive && <p className="text-[10px] text-primary">{isEn ? "Editing this model" : "Editando este modelo"}</p>}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {isEn
                ? `Routing: temperature=${task.routing.temperature ?? "default"} · reasoning=${task.routing.reasoning_effort ?? "none"} · caching=${task.routing.context_caching ? "yes" : "no"}.`
                : `Roteamento: temperature=${task.routing.temperature ?? "default"} · reasoning=${task.routing.reasoning_effort ?? "nenhum"} · caching=${task.routing.context_caching ? "sim" : "não"}.`}
            </p>
          </TabsContent>

          {/* TEST TAB */}
          <TabsContent value="test" className="space-y-3 mt-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold">{isEn ? "Test input" : "Entrada de teste"}</label>
              <Textarea
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                rows={4}
                placeholder={isEn ? "Will replace {{input}} in the user prompt." : "Substitui {{input}} no user prompt."}
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="text-[10px] text-muted-foreground">A (active)</label>
                <div className="text-xs">
                  <Badge variant="outline" className={modelBadge(effectiveModel)}>{effectiveModel}</Badge>
                </div>
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-muted-foreground">B (compare)</label>
                <Select value={testModelB || "__none__"} onValueChange={(v) => setTestModelB(v === "__none__" ? "" : (v as AIModelId))}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder={isEn ? "Pick a 2nd model (optional)" : "Escolher 2º modelo (opcional)"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">—</SelectItem>
                    {task.candidate_models.filter((m) => m !== effectiveModel).map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button size="sm" onClick={handleRun} disabled={running || !testInput.trim()}>
                <Play className="h-3 w-3 mr-1" />
                {running ? (isEn ? "Running…" : "Executando…") : (isEn ? "Run" : "Executar")}
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <ResultPane label="A" model={effectiveModel} data={resultA} loading={running && !resultA} isEn={!!isEn} />
              {testModelB && (
                <ResultPane label="B" model={testModelB as string} data={resultB} loading={running && !resultB} isEn={!!isEn} />
              )}
            </div>
          </TabsContent>

          {/* HISTORY TAB */}
          <TabsContent value="history" className="mt-4">
            <ScrollArea className="max-h-[520px] pr-2">
              {!history || history.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">{isEn ? "No runs yet." : "Sem execuções ainda."}</p>
              ) : (
                <ul className="space-y-2">
                  {history.map((r) => (
                    <li key={r.id} className="border rounded p-2 text-xs">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <Badge variant="outline" className={`text-[10px] ${modelBadge(r.model_id)}`}>{r.model_id}</Badge>
                        <span className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {r.latency_ms ?? "?"} ms · in {r.tokens_in ?? 0} · out {r.tokens_out ?? 0} · ${(r.cost_estimate ?? 0).toFixed(5)}
                      </div>
                      {r.error ? (
                        <p className="text-[11px] text-destructive mt-1">{r.error}</p>
                      ) : (
                        <p className="text-[11px] mt-1 line-clamp-3 whitespace-pre-wrap">{r.output_text}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

const ResultPane: React.FC<{
  label: string;
  model: string;
  loading: boolean;
  isEn: boolean;
  data: { output: string; latency: number; tokensIn: number; tokensOut: number; cost: number; error?: string } | null;
}> = ({ label, model, loading, data, isEn }) => (
  <Card>
    <CardHeader className="py-2">
      <CardTitle className="text-xs flex items-center justify-between">
        <span>{label}</span>
        <Badge variant="outline" className={`text-[10px] ${modelBadge(model)}`}>{model}</Badge>
      </CardTitle>
    </CardHeader>
    <CardContent className="text-xs space-y-1">
      {loading ? (
        <Skeleton className="h-24 w-full" />
      ) : !data ? (
        <p className="text-muted-foreground italic">{isEn ? "Run to see output." : "Execute para ver."}</p>
      ) : data.error ? (
        <p className="text-destructive text-[11px]">{data.error}</p>
      ) : (
        <>
          <div className="text-[10px] text-muted-foreground">
            {data.latency} ms · in {data.tokensIn} · out {data.tokensOut} · ${data.cost.toFixed(5)}
          </div>
          <pre className="whitespace-pre-wrap font-sans text-[11px] max-h-[260px] overflow-auto">{data.output}</pre>
        </>
      )}
    </CardContent>
  </Card>
);

export default TaskDetailSheet;