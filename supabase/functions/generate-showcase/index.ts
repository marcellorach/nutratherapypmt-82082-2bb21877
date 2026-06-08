// deno-lint-ignore-file no-explicit-any
// Showcase generator — uses the SAME factual spine as generate-audit (counts,
// kg_storage, clinical_data_provenance) but writes a curated 6-section
// partner-facing document. Never invents a number, never claims a Senex
// promise of insurance-loss reduction. Capabilities = present tense;
// outcomes/result = prospective conditional. Anchored on the same honesty
// guards (R/D/S split, no "RWD", GRRA/U-Retrieval/TransE = inspiration only).
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-audit-internal",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const FLASH_MODEL = "google/gemini-3-flash-preview";
const PRO_MODEL = "google/gemini-3.1-pro-preview";
const MINI_MODEL = "openai/gpt-5-mini";

const FLASH_TIMEOUT_MS = 90_000;
const PRO_TIMEOUT_MS = 180_000;
const MINI_TIMEOUT_MS = 120_000;

type Lang = "pt" | "en";

// ============================================================================
// Snapshot (subset of generate-audit's readAuditContext — only the keys the
// showcase actually uses, kept locally so this function stays self-contained).
// ============================================================================
async function readShowcaseSnapshot(service: ReturnType<typeof createClient>) {
  const snapshot: Record<string, any> = {};
  const tableNames = [
    "processed_studies", "triplet_extractions",
    "hierarchical_edges", "breeds", "breed_predispositions",
    "nutraceuticals", "health_conditions",
    "core_rules", "meta_studies",
  ];
  const counts: Record<string, number | null> = {};
  await Promise.all(tableNames.map(async (t) => {
    try {
      const { count } = await service.from(t).select("*", { count: "exact", head: true });
      counts[t] = count ?? 0;
    } catch {
      counts[t] = null;
    }
  }));
  snapshot.counts = counts;

  try {
    const { data: relRows } = await service.from("hierarchical_edges").select("relationship");
    const byRel: Record<string, number> = {};
    for (const r of (relRows ?? []) as any[]) {
      const k = r.relationship ?? "unknown";
      byRel[k] = (byRel[k] ?? 0) + 1;
    }
    const top = Object.entries(byRel).sort((a, b) => b[1] - a[1]).slice(0, 12)
      .map(([relationship, count]) => ({ relationship, count }));
    const { count: approved } = await service.from("triplet_extractions")
      .select("*", { count: "exact", head: true }).eq("curation_status", "approved");
    const { count: synced } = await service.from("triplet_extractions")
      .select("*", { count: "exact", head: true })
      .eq("curation_status", "approved").eq("synced_to_neo4j", true);
    snapshot.kg_storage = {
      note: "`hierarchical_edges` é o storage real do KG (Supabase). `medical_knowledge_graph` é legado (0 linhas).",
      hierarchical_edges_top_relationships: top,
      triplet_extractions_approved: approved ?? 0,
      triplet_extractions_synced_to_neo4j: synced ?? 0,
    };
  } catch (e) {
    snapshot.kg_storage = { error: (e as any)?.message ?? String(e) };
  }

  try {
    const { data: petRows } = await service.from("pet_profiles").select("id,is_demo,is_synthetic");
    const synthIds = new Set<string>(), demoIds = new Set<string>(), realIds = new Set<string>();
    for (const p of (petRows ?? []) as any[]) {
      if (p.is_synthetic) synthIds.add(p.id);
      else if (p.is_demo) demoIds.add(p.id);
      else realIds.add(p.id);
    }
    const split = async (t: string) => {
      const { data } = await service.from(t).select("pet_id");
      const out = { real: 0, demo: 0, synthetic_cohort: 0, unknown: 0 };
      for (const r of (data ?? []) as any[]) {
        if (synthIds.has(r.pet_id)) out.synthetic_cohort++;
        else if (demoIds.has(r.pet_id)) out.demo++;
        else if (realIds.has(r.pet_id)) out.real++;
        else out.unknown++;
      }
      return out;
    };
    snapshot.clinical_data_provenance = {
      note: "FONTE ÚNICA das contagens clínicas. synthetic_cohort NÃO é Real-World Data — gerado por generate-synthetic-cohort.",
      pet_profiles: { real: realIds.size, demo: demoIds.size, synthetic_cohort: synthIds.size },
      pet_exams: await split("pet_exams"),
      pet_consultations: await split("pet_consultations"),
      pet_medications: await split("pet_medications"),
      pet_conditions: await split("pet_conditions"),
    };
  } catch (e) {
    snapshot.clinical_data_provenance = { error: (e as any)?.message ?? String(e) };
  }

  return snapshot;
}

// ============================================================================
// Prompts
// ============================================================================
const HONESTY_RULES_PT = `REGRAS DE HONESTIDADE (inegociáveis — aplique antes de qualquer coisa):
1) Toda contagem clínica vem de \`clinical_data_provenance\` e DEVE ser escrita inline como "N total (R real / D demo / S sintético)". NUNCA use "RWD", "dados do mundo real" ou "base de pacientes reais". O sintético é uma força (pipeline validado de ponta a ponta), não um problema escondido.
2) Capacidades operacionais (vet embarcado, recomendador ≤8 compostos, KG curado, motores do twin) → PRESENTE. RESULTADOS de negócio (redução de sinistralidade, descoberta longitudinal, refutação de eficácia, calibração com dado real) → PROSPECTIVO/CONDICIONAL: "desenhado para", "passa a estar ao alcance quando", "o piloto quantifica". NUNCA prometa % de redução de sinistralidade. Se houver número de sinistralidade, só benchmark de literatura atribuído (e nesta rodada NÃO há esse benchmark — não invente).
3) GRRA, U-Retrieval (top-down/bottom-up), TransE, DWPC, GNN, MEDEA agentic = INSPIRAÇÃO científica e roadmap; marque "(inspiração; não implementado)" quando citar. JAMAIS atribua ao Senex.
4) Digital Twin = DOIS motores ativos: (a) progressão condição × nutracêutico = SIGMOIDE calibrada em condition_response_curves; (b) envelhecimento biológico = GOMPERTZ por size category (small/medium/large/giant — Dog Aging Project/Kraus 2013). Não dizer que Gompertz "não existe" nem confundir os dois.
5) Evidência negativa (RC-001/002) é DIFERENCIAL real: triplet_extractions.evidence_polarity bloqueia recomendação quando 'negative'; exclusão de trial ≠ contraindicação (lacuna de evidência). Citar explicitamente em §5.
6) PROIBIDO inventar número que não esteja no snapshot. Se um fato narrativo precisar de número e o snapshot não tiver, use linguagem qualitativa ("ampla", "milhares") ou marque "n/d" — nunca chute.`;

const BASE_SYSTEM_PT = `Você está escrevendo um documento SHOWCASE da Senex AI (operada pela PetMoreTime) para uma parceira estratégica do setor pet (rede ampla de veterinários + seguro saúde pet). Tom: confiante, claro, voltado a negócio — copo meio cheio, mas verdadeiro; nada de auditoria acadêmica, nada de floreio. Escreva em HTML semântico denso, em PORTUGUÊS, sem <html>/<head>/<body>/<style>.

Marca = "Senex AI". Motor/dona = "PetMoreTime". NUNCA mencione Lovable nem ferramentas de dev.

${HONESTY_RULES_PT}

ESTRUTURA FIXA (6 SEÇÕES, NESTA ORDEM — NÃO INVERTA, NÃO ADICIONE, NÃO REMOVA):
1. Visão & problema — gerociência canina como oportunidade.
2. ROI: vet embarcado + recomendador preventivo (capacidades no presente; redução de sinistralidade é o desenho, quantificada pelo piloto).
3. O fosso: coorte longitudinal PetLove (anos por pet) + a plataforma como capacidade defensável.
4. A visão maior: descoberta longitudinal, refutação de eficácia, ciência translacional canina — TUDO condicional/futuro.
5. Credibilidade arquitetural: linhagem (Hetionet/Zitnik/MedGraphRAG), SNOMED-CT/UMLS, predicados normalizados, EVIDÊNCIA NEGATIVA RC-001/002, Digital Twin de dois motores, gate HITL + roadmap de fronteira (verificação independente, DWPC/metapath — marcar como roadmap).
6. Parceria/pedido: o piloto — front clínico embarcado + acesso à coorte longitudinal; o que cada lado traz.

VISUAIS: pelo menos 1 SVG inline por seção (gráfico de barras, donut, diagrama de fluxo/camadas, timeline, KPI grid). Paleta restrita: #0f172a (deep), #1d4ed8 (accent), #16a34a (ok), #b45309 (warn), #dc2626 (gap), #4b5563 (muted), #e5e7eb (soft). Cada visual com <p class="caption">… (fonte: snapshot)</p>. Os números vêm SEMPRE do snapshot factual — se faltar, marque "n/d" e explique.`;

const SECTIONS: Array<{
  id: string;
  title_pt: string;
  title_en: string;
  /** "narrative" = no snapshot numbers expected; "data" = uses snapshot. */
  kind: "narrative" | "data";
  /** chain key — "pro" = Pro→Flash (no mini); "flash" = Flash→Pro→mini */
  chain: "pro" | "flash";
  user_pt: string;
  user_en: string;
}> = [
  {
    id: "vision",
    title_pt: "Visão & o problema",
    title_en: "Vision & the problem",
    kind: "narrative",
    chain: "pro",
    user_pt: `Renderize a SEÇÃO 1 — "Visão & o problema".
Esta seção é QUALITATIVA: NÃO cite número do snapshot (nada de contagens de KG, estudos, pets). Se algum número aparecer, é bug.
Conteúdo: por que gerociência canina agora; por que o cão é o modelo translacional; o vácuo de oferta clínica preventiva; a oportunidade comercial para uma rede ampla de vets.
Envolva em <section id="vision"><h2>Visão & o problema</h2>…</section>. ~250–350 palavras. Inclua 1 visual conceitual (diagrama de camadas ou KPI grid sem números — só rótulos como "envelhecimento → janela terapêutica → carga clínica").`,
    user_en: `Render SECTION 1 — "Vision & the problem".
Qualitative section: do NOT cite any snapshot number. If a number appears, it's a bug.
Cover: why canine geroscience now; the dog as translational model; the supply gap in preventive clinical care; the commercial opportunity for a broad vet network.
Wrap in <section id="vision"><h2>Vision & the problem</h2>…</section>. ~250–350 words. Include 1 conceptual visual (no numbers — only labels).`,
  },
  {
    id: "roi",
    title_pt: "ROI: vet embarcado + recomendador preventivo",
    title_en: "ROI: embedded vet front + preventive recommender",
    kind: "data",
    chain: "flash",
    user_pt: `Renderize a SEÇÃO 2 — "ROI: vet embarcado + recomendador preventivo".
CAPACIDADES no PRESENTE (já operacionais): (a) front clínico white-label embedded no sistema da parceira para milhares de vets, com vet-no-loop; (b) recomendador preventivo de gerociência (nutracêuticos + drogas) com TETO DE 8 compostos sinérgicos e tiering de confiança.
RESULTADO de sinistralidade em PROSPECTIVO/CONDICIONAL: "desenhado para reduzir sinistralidade via detecção precoce + prevenção"; "o piloto quantifica o delta". NUNCA prometa um %.
Use \`counts.nutraceuticals\`, \`counts.health_conditions\`, \`counts.breeds\`, \`counts.breed_predispositions\` para dimensionar o catálogo disponível ao recomendador. Cite-os inline.
Envolva em <section id="roi"><h2>ROI: vet embarcado + recomendador preventivo</h2>…</section>. ~300–450 palavras. Visual obrigatório: KPI grid (3-4 cards) com os números reais do snapshot + 1 diagrama de fluxo conceitual da lógica de redução de sinistralidade (sem inventar %).`,
    user_en: `Render SECTION 2 — "ROI: embedded vet front + preventive recommender".
CAPABILITIES in PRESENT TENSE: (a) white-label clinical front embedded in the partner's system serving thousands of vets, vet-in-the-loop; (b) preventive geroscience recommender (nutraceuticals + drugs) capped at 8 synergistic compounds with confidence tiering.
INSURANCE-LOSS REDUCTION in PROSPECTIVE/CONDITIONAL tense ("designed to", "the pilot quantifies"). NEVER promise a %.
Use \`counts.nutraceuticals\`, \`counts.health_conditions\`, \`counts.breeds\`, \`counts.breed_predispositions\` to size the recommender's catalog. Cite inline.
Wrap in <section id="roi"><h2>ROI: embedded vet front + preventive recommender</h2>…</section>. ~300–450 words. Required visual: a KPI grid (3-4 cards) with real snapshot numbers + 1 conceptual flow diagram of the loss-reduction logic (no invented %).`,
  },
  {
    id: "moat",
    title_pt: "O fosso: coorte longitudinal + plataforma",
    title_en: "The moat: longitudinal cohort + platform",
    kind: "data",
    chain: "flash",
    user_pt: `Renderize a SEÇÃO 3 — "O fosso".
Posicione duas peças:
(A) HOJE: a plataforma rodou de ponta a ponta sobre coorte SINTÉTICA calibrada — escreva o split exato de \`clinical_data_provenance\` como "N total (R real / D demo / S sintético)" para pet_profiles, pet_exams, pet_consultations, pet_medications e pet_conditions. Apresente como força ("pipeline validado de ponta a ponta, pronto para o dado real"), não como falha.
(B) FOSSO FUTURO: a coorte LONGITUDINAL da parceira (anos de histórico por pet) é o ingrediente raro que descoberta de progressão e refutação de eficácia exigem — fala desse ingrediente como condicional/futuro.
Inclua também \`counts.processed_studies\` para mostrar a base científica já digerida.
Envolva em <section id="moat"><h2>O fosso: coorte longitudinal + plataforma</h2>…</section>. ~350–500 palavras. Visual obrigatório: tabela com o split R/D/S por tabela + 1 timeline horizontal HOJE → ROADMAP.`,
    user_en: `Render SECTION 3 — "The moat".
Position two pieces:
(A) TODAY: the platform ran end-to-end on a CALIBRATED SYNTHETIC cohort — write the exact split from \`clinical_data_provenance\` as "N total (R real / D demo / S synthetic)" for each table. Frame as a strength ("end-to-end validated pipeline, ready for real data").
(B) FUTURE MOAT: the partner's LONGITUDINAL cohort (years per pet) is the rare ingredient that progression discovery and efficacy refutation require — conditional/future tense.
Also cite \`counts.processed_studies\`.
Wrap in <section id="moat"><h2>The moat: longitudinal cohort + platform</h2>…</section>. ~350–500 words. Required visual: table with the R/D/S split + 1 horizontal TODAY → ROADMAP timeline.`,
  },
  {
    id: "bigger-vision",
    title_pt: "A visão maior",
    title_en: "The bigger vision",
    kind: "narrative",
    chain: "pro",
    user_pt: `Renderize a SEÇÃO 4 — "A visão maior".
QUALITATIVA. NÃO cite número do snapshot. Tudo no CONDICIONAL/FUTURO ("passa a estar ao alcance quando", "o dado longitudinal sobe", "a camada de verificação entra"): descoberta de sinais longitudinais reais, ciência translacional canino→humano, confirmação/REFUTAÇÃO de eficácia de tratamento, geração de hipóteses inéditas com potencial de IP — fazer história em gerociência canina.
Tom: ambicioso mas honesto. O parceiro precisa ver que existe um teto alto, sem que isso vire promessa para hoje.
Envolva em <section id="bigger-vision"><h2>A visão maior</h2>…</section>. ~300–400 palavras. Visual: diagrama conceitual (camadas ou fluxo) sem números.`,
    user_en: `Render SECTION 4 — "The bigger vision".
Qualitative. No snapshot numbers. Everything in CONDITIONAL/FUTURE tense: real longitudinal signals discovery, canine→human translational science, treatment efficacy confirmation/REFUTATION, novel IP-bearing hypotheses — making history in canine geroscience.
Tone: ambitious but honest. No promises for today.
Wrap in <section id="bigger-vision"><h2>The bigger vision</h2>…</section>. ~300–400 words. Visual: conceptual diagram (layers or flow), no numbers.`,
  },
  {
    id: "architecture",
    title_pt: "Credibilidade arquitetural — por que é real",
    title_en: "Architectural credibility — why this is real",
    kind: "data",
    chain: "flash",
    user_pt: `Renderize a SEÇÃO 5 — "Credibilidade arquitetural".
Afirme com confiança os PRINCÍPIOS e a LINHAGEM REAIS:
- Knowledge graph clínico real em \`hierarchical_edges\` — use \`kg_storage.hierarchical_edges_top_relationships\` para mostrar o breakdown por predicado (TREATS/PREVENTS/HAS_MECHANISM/etc) num gráfico de barras horizontais. Cite \`triplet_extractions_approved\` e \`triplet_extractions_synced_to_neo4j\` num funil curto.
- Linhagem científica: Hetionet (Himmelstein 2017), PrimeKG (Chandak 2023), MedGraphRAG, Zitnik Lab — declare como inspiração arquitetural assumida, não como código copiado.
- Ancoragem ontológica: SNOMED-CT VetSCT + UMLS + MeSH/ChEBI/OMIA, predicados normalizados via dicionário.
- **EVIDÊNCIA NEGATIVA (RC-001/002) — diferencial real**: explique \`triplet_extractions.evidence_polarity\` (negative bloqueia recomendação) e a regra "exclusão de trial ≠ contraindicação" (RC-001). Diga por que isso coloca a Senex à frente da média de KGs biomédicos publicados (que normalmente só guardam positive).
- Digital Twin de DOIS motores ativos: SIGMOIDE para progressão condição × nutracêutico + GOMPERTZ por size category (small/medium/large/giant — Dog Aging Project/Kraus 2013) — ilustre num diagrama lado-a-lado.
- Gate de curadoria HITL (auto-approve ≥50%, humano caso contrário). Use \`counts.triplet_extractions\` para dimensionar.
- ROADMAP de fronteira 2025-26 (verificação independente / Reviewer agente, DWPC/metapath scoring estrutural, link prediction) — marque "(roadmap; não implementado)".
- Conte raças com predisposição via \`counts.breeds\` e \`counts.breed_predispositions\`; estudos digeridos via \`counts.processed_studies\`; regras governadas via \`counts.core_rules\` e \`counts.meta_studies\`.
Envolva em <section id="architecture"><h2>Credibilidade arquitetural — por que é real</h2>…</section>. ~500–700 palavras. Visuais: 1 gráfico de barras (predicados do KG) + 1 diagrama dos dois motores do twin + 1 KPI grid com as contagens reais.`,
    user_en: `Render SECTION 5 — "Architectural credibility".
Assert real PRINCIPLES and LINEAGE confidently:
- Real clinical KG in \`hierarchical_edges\` — use \`kg_storage.hierarchical_edges_top_relationships\` for a horizontal bar chart of predicates. Cite \`triplet_extractions_approved\` and \`triplet_extractions_synced_to_neo4j\` as a short funnel.
- Scientific lineage: Hetionet (Himmelstein 2017), PrimeKG (Chandak 2023), MedGraphRAG, Zitnik Lab — assumed architectural inspiration.
- Ontology anchoring: SNOMED-CT VetSCT + UMLS + MeSH/ChEBI/OMIA, dictionary-normalized predicates.
- **NEGATIVE EVIDENCE (RC-001/002) — real differentiator**: explain \`triplet_extractions.evidence_polarity\` (negative blocks recommendation) and the "trial exclusion ≠ contraindication" rule (RC-001). Most published biomedical KGs only store positive edges — Senex stores polarity.
- Two-engine Digital Twin: SIGMOID for condition × nutraceutical progression + GOMPERTZ per size category — side-by-side diagram.
- HITL curation gate (auto-approve ≥50%, human otherwise). Size via \`counts.triplet_extractions\`.
- Frontier ROADMAP 2025-26 (independent verifier/Reviewer agent, DWPC/metapath structural scoring, link prediction) — flag "(roadmap; not implemented)".
- Cite breeds/predispositions/studies/rules counts from snapshot.
Wrap in <section id="architecture"><h2>Architectural credibility — why this is real</h2>…</section>. ~500–700 words. Visuals: 1 bar chart (KG predicates) + 1 two-engine diagram + 1 KPI grid with real counts.`,
  },
  {
    id: "partnership",
    title_pt: "A parceria — o piloto",
    title_en: "The partnership — the pilot",
    kind: "narrative",
    chain: "pro",
    user_pt: `Renderize a SEÇÃO 6 — "A parceria — o piloto".
QUALITATIVA. NÃO invente número de rede de vets, pets cobertos, prêmio etc. — nesta rodada não há esse input.
Cobertura: o pedido é o PILOTO — (a) deploy do front clínico embarcado no sistema da parceira (white-label, vet-no-loop); (b) acesso supervisionado à coorte longitudinal para alimentar descoberta + calibração. O que cada lado traz: Senex traz plataforma validada, motor de recomendação + twin, ontologia ancorada, evidência negativa, governança HITL; a parceira traz rede ativa de vets + coorte longitudinal + relacionamento com o tutor + dado de sinistralidade.
Tom: pé no chão, "uma porta", sem grandiosidade.
Envolva em <section id="partnership"><h2>A parceria — o piloto</h2>…</section>. ~300–400 palavras. Visual: matriz simples "Senex traz × Parceira traz" (HTML+SVG) ou diagrama de fluxo do piloto.`,
    user_en: `Render SECTION 6 — "The partnership — the pilot".
Qualitative. No invented network/coverage/premium numbers — none provided this round.
Cover the ask: PILOT — (a) deploy of embedded white-label clinical front in the partner's system; (b) supervised access to the longitudinal cohort. What each side brings.
Tone: grounded, no grandiosity.
Wrap in <section id="partnership"><h2>The partnership — the pilot</h2>…</section>. ~300–400 words. Visual: simple "Senex brings × Partner brings" matrix or pilot flow diagram.`,
  },
];

// ============================================================================
// LLM call (mirrors generate-audit's callToolWithTimeout, kept local)
// ============================================================================
async function callToolWithTimeout(messages: any[], tool: any, model: string, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const supportsTemperature = !/^openai\/gpt-5/i.test(model);
    const payload: Record<string, unknown> = {
      model, messages, tools: [tool],
      tool_choice: { type: "function", function: { name: tool.function.name } },
    };
    if (supportsTemperature) payload.temperature = 0.3;
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`${model} → ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = await res.json();
    const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error(`${model} returned no tool_call`);
    return JSON.parse(args);
  } finally { clearTimeout(timer); }
}

function chainFor(chain: "pro" | "flash") {
  if (chain === "pro") {
    // Pro primary → Flash fallback (NO mini, per user request)
    return [
      { model: PRO_MODEL, timeoutMs: PRO_TIMEOUT_MS },
      { model: FLASH_MODEL, timeoutMs: FLASH_TIMEOUT_MS },
    ];
  }
  return [
    { model: FLASH_MODEL, timeoutMs: FLASH_TIMEOUT_MS },
    { model: PRO_MODEL, timeoutMs: PRO_TIMEOUT_MS },
    { model: MINI_MODEL, timeoutMs: MINI_TIMEOUT_MS },
  ];
}

async function generateSection(
  section: typeof SECTIONS[number],
  snapshot: Record<string, any>,
  lang: Lang,
): Promise<{ id: string; title: string; html: string; status: "ok" | "unavailable"; reason?: string }> {
  const tool = {
    type: "function",
    function: {
      name: "emit_section",
      description: "HTML fragment for one showcase section.",
      parameters: {
        type: "object",
        properties: { html: { type: "string" } },
        required: ["html"], additionalProperties: false,
      },
    },
  };
  const title = lang === "en" ? section.title_en : section.title_pt;
  const baseSystem = lang === "en" ? buildBaseSystemEn(snapshot, section) : buildBaseSystemPt(snapshot, section);
  const userMsg = lang === "en" ? section.user_en : section.user_pt;
  const attempts = chainFor(section.chain);
  let lastErr: any;
  for (let i = 0; i < attempts.length; i++) {
    const a = attempts[i];
    try {
      const out = await callToolWithTimeout(
        [{ role: "system", content: baseSystem }, { role: "user", content: userMsg }],
        tool, a.model, a.timeoutMs,
      );
      const html = String(out?.html ?? "").trim();
      if (html.length < 50) throw new Error("empty html");
      return { id: section.id, title, html, status: "ok" };
    } catch (e: any) { lastErr = e; }
  }
  const reason = lastErr?.message ?? String(lastErr);
  const langLabel = lang === "en"
    ? "section unavailable — generation failed"
    : "seção indisponível — falha de geração";
  return {
    id: section.id, title, status: "unavailable", reason,
    html: `<section id="${section.id}" class="block-gap" data-status="unavailable"><h2>${title} — ${langLabel}</h2><p>Falha após ${attempts.length} tentativas (${attempts.map(a => a.model).join(" → ")}). Motivo: ${reason}.</p></section>`,
  };
}

function buildBaseSystemPt(snapshot: Record<string, any>, section: typeof SECTIONS[number]) {
  // §1/4/6 são qualitativas — não enviamos snapshot para reduzir tentação.
  // §2/3/5 recebem o snapshot inteiro (é pequeno) para citar números reais.
  if (section.kind === "narrative") {
    return `${BASE_SYSTEM_PT}

NESTE BLOCO ESPECÍFICO ("${section.title_pt}"): NÃO há snapshot anexado de propósito — esta seção é qualitativa. Se você escrever qualquer número (contagem, %, n=…), o bloco será marcado como bug. Use linguagem qualitativa ("ampla", "milhares", "anos por pet"). Tempo verbal CONDICIONAL/FUTURO onde o conteúdo prospectar resultado.`;
  }
  return `${BASE_SYSTEM_PT}

SNAPSHOT FACTUAL (única fonte de número permitida nesta seção — qualquer número fora daqui é invenção e quebra a regra):
${JSON.stringify(snapshot, null, 2)}`;
}

const HONESTY_RULES_EN = `HONESTY RULES (non-negotiable):
1) Every clinical count comes from \`clinical_data_provenance\` and MUST be written inline as "N total (R real / D demo / S synthetic)". NEVER write "RWD", "real-world data" or "real patient base". Synthetic is a STRENGTH (end-to-end validated pipeline), not hidden weakness.
2) Operational capabilities (embedded vet front, ≤8-compound recommender, curated KG, twin engines) → PRESENT tense. Business OUTCOMES (insurance-loss reduction, longitudinal discovery, treatment refutation, real-data calibration) → PROSPECTIVE/CONDITIONAL: "designed to", "becomes within reach when", "the pilot quantifies". NEVER promise a % reduction. If insurance numbers appear, only attributed literature benchmarks (none this round — do NOT invent).
3) GRRA, U-Retrieval, TransE, DWPC, GNN, MEDEA agentic = scientific INSPIRATION and roadmap; tag "(inspiration; not implemented)" when named.
4) Digital Twin = TWO active engines: (a) SIGMOID for condition × nutraceutical progression; (b) GOMPERTZ per size category (Dog Aging Project/Kraus 2013). Do not say Gompertz "does not exist".
5) Negative evidence (RC-001/002) is a real differentiator: \`evidence_polarity\` blocks recommendation when 'negative'; trial exclusion ≠ contraindication. Cite explicitly in §5.
6) FORBIDDEN to invent any number not in the snapshot. If a fact needs a number absent from snapshot, use qualitative language or "n/a".`;

const BASE_SYSTEM_EN = `You are writing a SHOWCASE document for Senex AI (operated by PetMoreTime) addressed to a strategic pet-industry partner (broad vet network + pet health insurance). Tone: confident, clear, business-oriented — glass-half-full but truthful; no academic-audit voice, no flourish. Write in dense semantic HTML, in ENGLISH, no <html>/<head>/<body>/<style>.

Brand = "Senex AI". Engine/owner = "PetMoreTime". NEVER mention Lovable or dev tools.

${HONESTY_RULES_EN}

FIXED STRUCTURE (6 SECTIONS, IN THIS ORDER — do not reorder, add, or remove):
1. Vision & problem — canine geroscience as the opportunity.
2. ROI: embedded vet front + preventive recommender (capabilities present-tense; insurance-loss reduction is the DESIGN, the pilot quantifies).
3. The moat: longitudinal partner cohort (years per pet) + platform as defensible capability.
4. The bigger vision: longitudinal discovery, efficacy refutation, canine translational science — all conditional/future.
5. Architectural credibility: Hetionet/Zitnik/MedGraphRAG lineage, SNOMED-CT/UMLS, normalized predicates, NEGATIVE EVIDENCE RC-001/002, two-engine twin, HITL gate + frontier roadmap (independent verification, DWPC/metapath — flagged roadmap).
6. Partnership/ask: the pilot — embedded clinical front + supervised access to longitudinal cohort; what each side brings.

VISUALS: at least 1 inline SVG per section. Palette: #0f172a #1d4ed8 #16a34a #b45309 #dc2626 #4b5563 #e5e7eb. Each visual gets <p class="caption">… (source: snapshot)</p>. Numbers ALWAYS from the factual snapshot — if missing, mark "n/a" and explain.`;

function buildBaseSystemEn(snapshot: Record<string, any>, section: typeof SECTIONS[number]) {
  if (section.kind === "narrative") {
    return `${BASE_SYSTEM_EN}

THIS BLOCK ("${section.title_en}"): no snapshot attached on purpose — qualitative section. Any number you write counts as a bug. Use qualitative language. CONDITIONAL/FUTURE tense for prospective outcomes.`;
  }
  return `${BASE_SYSTEM_EN}

FACTUAL SNAPSHOT (only allowed source of numbers in this section):
${JSON.stringify(snapshot, null, 2)}`;
}

// ============================================================================
// HTML assembly
// ============================================================================
function showcaseStyle(): string {
  return `<style>
:root{--ink:#0f172a;--muted:#475569;--soft:#e2e8f0;--bg:#f8fafc;--accent:#1d4ed8;--ok:#16a34a;--warn:#b45309;--gap:#dc2626}
*{box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:var(--ink);line-height:1.65;max-width:1040px;margin:0 auto;padding:56px 36px;background:#fff}
header.cover{padding:32px 0 48px;border-bottom:1px solid var(--soft);margin-bottom:48px}
header.cover h1{font-size:2.4rem;font-weight:700;margin:0 0 6px;letter-spacing:-0.02em}
header.cover .kicker{font-size:0.78rem;text-transform:uppercase;letter-spacing:0.12em;color:var(--accent);font-weight:600;margin-bottom:8px}
header.cover p.meta{color:var(--muted);font-size:0.86rem;margin:8px 0 0}
nav.toc{background:var(--bg);border-radius:8px;padding:18px 22px;margin-bottom:40px}
nav.toc strong{font-size:0.78rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--muted)}
nav.toc ol{margin:8px 0 0;padding-left:20px;font-size:0.92rem}
nav.toc li{margin:4px 0}
nav.toc a{color:var(--ink);text-decoration:none}
nav.toc a:hover{color:var(--accent);text-decoration:underline}
section{margin:0 0 56px}
h2{font-size:1.6rem;font-weight:700;margin:0 0 18px;letter-spacing:-0.01em}
h3{font-size:1.1rem;font-weight:600;margin:24px 0 10px}
p{margin:0 0 14px}
p.caption,figcaption{color:var(--muted);font-size:0.8rem;margin:4px 0 18px;font-style:italic}
table{width:100%;border-collapse:collapse;margin:18px 0;font-size:0.9rem}
th,td{text-align:left;padding:9px 11px;border-bottom:1px solid var(--soft);vertical-align:top}
th{background:var(--bg);font-weight:600;font-size:0.82rem;text-transform:uppercase;letter-spacing:0.04em;color:var(--muted)}
ul,ol{margin:0 0 14px 22px}
code{background:var(--bg);padding:2px 6px;border-radius:4px;font-size:0.88em;color:var(--accent)}
svg{max-width:100%;height:auto;display:block;margin:14px 0}
figure{margin:18px 0}
.kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin:18px 0}
.kpi{border:1px solid var(--soft);border-radius:10px;padding:16px;background:var(--bg)}
.kpi-value{display:block;font-size:1.7rem;font-weight:700;color:var(--accent);line-height:1.1;letter-spacing:-0.02em}
.kpi-label{display:block;font-size:0.78rem;color:var(--muted);margin-top:6px;text-transform:uppercase;letter-spacing:0.04em}
.legend{display:flex;flex-wrap:wrap;gap:14px;font-size:0.8rem;color:var(--muted);margin:8px 0 16px}
.legend span{display:inline-flex;align-items:center;gap:6px}
.legend i{width:11px;height:11px;border-radius:2px;display:inline-block}
section.block-gap{background:#fff7ed;border-left:4px solid var(--warn);padding:18px;border-radius:6px}
footer.fineprint{margin-top:64px;padding-top:24px;border-top:1px solid var(--soft);font-size:0.78rem;color:var(--muted)}
</style>`;
}

function buildToc(sections: Array<{ id: string; title: string }>): string {
  const items = sections.map((s, i) => `<li><a href="#${s.id}">${i + 1}. ${s.title}</a></li>`).join("");
  return `<nav class="toc"><strong>Sumário</strong><ol>${items}</ol></nav>`;
}

function buildHtml(
  lang: Lang,
  version: string,
  generatedDate: string,
  rendered: Array<{ id: string; title: string; html: string }>,
): string {
  const isEn = lang === "en";
  const kicker = isEn ? "Showcase · Senex AI · PetMoreTime" : "Showcase · Senex AI · PetMoreTime";
  const title = isEn
    ? `Senex AI — partner showcase ${version}`
    : `Senex AI — showcase para parceiro ${version}`;
  const meta = isEn
    ? `Generated ${generatedDate} · numbers from live factual snapshot (counts, kg_storage, clinical_data_provenance). Synthetic-cohort labeling enforced; insurance-loss reduction stated as design intent, never as Senex promise.`
    : `Gerado em ${generatedDate} · números do snapshot factual vivo (counts, kg_storage, clinical_data_provenance). Coorte sintética rotulada; redução de sinistralidade é desenho, nunca promessa Senex.`;
  const fine = isEn
    ? "Senex AI is the product brand. Authorship, IP and operation: PetMoreTime (2025-present). Successor to internal codenames VetGraphRAG / VetMedGraph."
    : "Senex AI é a marca pública. Autoria, IP e operação: PetMoreTime (2025-presente). Sucessor dos codenames internos VetGraphRAG / VetMedGraph.";
  const toc = buildToc(rendered);
  const body = rendered.map(r => r.html).join("\n");
  return `<!doctype html><html lang="${isEn ? "en" : "pt-BR"}"><head><meta charset="utf-8"><title>${title}</title>${showcaseStyle()}</head><body><header class="cover"><div class="kicker">${kicker}</div><h1>${title}</h1><p class="meta">${meta}</p></header>${toc}${body}<footer class="fineprint">${fine}</footer></body></html>`;
}

// ============================================================================
// HTTP entry
// ============================================================================
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({} as any));
    const action = String(body?.action ?? "start");
    const authHeader = req.headers.get("Authorization") ?? "";
    const apiKeyHeader = req.headers.get("apikey") ?? "";
    const internalHeader = req.headers.get("x-audit-internal") ?? "";
    const isInternal = authHeader === `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      || apiKeyHeader === SUPABASE_SERVICE_ROLE_KEY
      || internalHeader === SUPABASE_SERVICE_ROLE_KEY;

    if (!isInternal) {
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Missing Authorization" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: userData } = await userClient.auth.getUser();
      if (!userData?.user) {
        return new Response(JSON.stringify({ error: "Unauthenticated" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data: roles } = await adminClient.from("user_roles")
        .select("role").eq("user_id", userData.user.id).eq("role", "admin").limit(1);
      if (!Array.isArray(roles) || roles.length === 0) {
        return new Response(JSON.stringify({ error: "Admin only" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (action === "progress") {
      const id = String(body?.audit_id ?? "").toLowerCase();
      if (!id) return new Response(JSON.stringify({ error: "audit_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
      const { data: row } = await service.from("technical_audits")
        .select("id, html_path, html_path_en, summary, updated_at")
        .eq("id", id).maybeSingle();
      const summary = (row?.summary ?? {}) as Record<string, any>;
      return new Response(JSON.stringify({
        audit_id: id,
        status: summary.status ?? (row ? "unknown" : "missing"),
        stage: summary.stage ?? null,
        stage_label: summary.stage_label ?? null,
        progress: typeof summary.progress === "number" ? summary.progress : null,
        html_path: row?.html_path ?? null,
        html_path_en: row?.html_path_en ?? null,
        warnings: summary.warnings ?? null,
        error: summary.error ?? null,
        updated_at: row?.updated_at ?? null,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // === start ===
    const baseVersion = String(body?.version ?? "").trim().replace(/^v/i, "");
    if (!baseVersion) {
      return new Response(JSON.stringify({ error: "version required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const systemVersion = String(body?.system_version ?? "").trim();
    const systemChangelogDate = body?.system_changelog_date ?? null;
    const numericVersion = `${baseVersion}-showcase`;
    const auditId = `v${numericVersion}`.toLowerCase();

    const initialSummary = {
      status: "processing", kind: "showcase", generator: "senex-ai",
      stage: "queued", stage_label: "Na fila", progress: 5,
      blocks_done: 0, blocks_total: SECTIONS.length,
      warnings: [] as string[],
    };
    const { data: auditRow, error: upsertErr } = await service.from("technical_audits").upsert({
      id: auditId,
      version: numericVersion,
      audit_date: new Date().toISOString().slice(0, 10),
      system_version: systemVersion,
      system_changelog_date: systemChangelogDate,
      scope: "Showcase · 6 seções curadas (visão, ROI, fosso, visão maior, credibilidade, parceria) sobre a mesma espinha de fatos da auditoria técnica.",
      scope_history: [],
      html_path: null, pdf_path: null, docx_path: null,
      summary: initialSummary,
      superseded_by: null,
      outline: null,
      progress_log: [],
      last_heartbeat: new Date().toISOString(),
      resume_count: 0,
    }).select("*").single();
    if (upsertErr) throw upsertErr;

    const job = (async () => {
      const setStage = async (stage: string, label: string, progress: number, extra: Record<string, any> = {}) => {
        const { data: cur } = await service.from("technical_audits").select("summary").eq("id", auditId).maybeSingle();
        const merged = { ...(cur?.summary as any ?? {}), ...extra, stage, stage_label: label, progress, status: "processing" };
        await service.from("technical_audits").update({ summary: merged, last_heartbeat: new Date().toISOString() }).eq("id", auditId);
      };
      try {
        await setStage("snapshot", "Lendo snapshot factual", 10);
        const snapshot = await readShowcaseSnapshot(service);

        await setStage("sections-pt", "Gerando 6 seções em PT (paralelo)", 20);
        const ptResults = await Promise.all(
          SECTIONS.map((s) => generateSection(s, snapshot, "pt")),
        );
        const ptWarnings = ptResults.filter((r) => r.status === "unavailable")
          .map((r) => `${r.id}: ${r.reason}`);

        await setStage("upload-pt", "Salvando HTML PT", 60, { blocks_done: ptResults.length });
        const generatedDate = new Date().toISOString().slice(0, 10);
        const htmlPt = buildHtml("pt", `v${baseVersion}`, generatedDate, ptResults);
        const pathPt = `showcase/${numericVersion}/showcase.html`;
        const upPt = await service.storage.from("audit-reports").upload(
          pathPt, new TextEncoder().encode(htmlPt),
          { upsert: true, contentType: "text/html; charset=utf-8" },
        );
        if (upPt.error) throw upPt.error;
        const { data: pubPt } = service.storage.from("audit-reports").getPublicUrl(pathPt);

        await setStage("sections-en", "Gerando 6 seções em EN (paralelo)", 70);
        const enResults = await Promise.all(
          SECTIONS.map((s) => generateSection(s, snapshot, "en")),
        );
        const enWarnings = enResults.filter((r) => r.status === "unavailable")
          .map((r) => `en-${r.id}: ${r.reason}`);

        await setStage("upload-en", "Salvando HTML EN", 90);
        const htmlEn = buildHtml("en", `v${baseVersion}`, generatedDate, enResults);
        const pathEn = `showcase/${numericVersion}/showcase-en.html`;
        const upEn = await service.storage.from("audit-reports").upload(
          pathEn, new TextEncoder().encode(htmlEn),
          { upsert: true, contentType: "text/html; charset=utf-8" },
        );
        let publicUrlEn: string | null = null;
        if (!upEn.error) {
          const { data: pubEn } = service.storage.from("audit-reports").getPublicUrl(pathEn);
          publicUrlEn = pubEn.publicUrl;
        } else {
          enWarnings.push(`EN upload failed: ${upEn.error.message}`);
        }

        const warnings = [...ptWarnings, ...enWarnings];
        const status = warnings.length > 0 ? "ready_with_warnings" : "ready";
        await service.from("technical_audits").update({
          html_path: pubPt.publicUrl,
          html_path_en: publicUrlEn,
          summary: {
            status, kind: "showcase", generator: "senex-ai",
            stage: status, stage_label: status === "ready" ? "Pronto (PT + EN)" : "Pronto com lacunas",
            progress: 100,
            blocks_done: SECTIONS.length, blocks_total: SECTIONS.length,
            warnings,
            sections: SECTIONS.map((s) => s.id),
          },
          last_heartbeat: new Date().toISOString(),
        }).eq("id", auditId);
      } catch (e: any) {
        await service.from("technical_audits").update({
          summary: {
            status: "failed", kind: "showcase", stage: "failed",
            stage_label: "Falhou", progress: 100,
            error: e?.message ?? String(e), generator: "senex-ai",
          },
        }).eq("id", auditId);
      }
    })();

    // @ts-ignore EdgeRuntime available in Supabase Edge runtime
    if (typeof EdgeRuntime !== "undefined" && (EdgeRuntime as any).waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(job);
    }

    return new Response(JSON.stringify({ ok: true, audit: auditRow, status: "processing" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});