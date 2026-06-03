---
name: Synthetic cohort ≠ Real-World Data
description: Linhas geradas por generate_synthetic_cohort NUNCA podem ser apresentadas como RWD. Toda narrativa que cite contagens de pet_* exige split real/demo/synthetic_cohort.
type: constraint
---

**Regra:** Linhas em `pet_profiles`/`pet_exams`/`pet_consultations`/`pet_medications`/`pet_conditions` com `is_synthetic=true` foram geradas pelo prompt `generate_synthetic_cohort` (Gemini). São **calibradas em medicina real, mas NÃO observadas em pacientes vivos**. Hoje representam ~98% das linhas clínicas (verificar `docs/generated/DATA_PROVENANCE.md`).

**Proibido (qualquer superfície — UI, prompts, docs, deck, auto-auditoria):**
- "Real-World Data" / "RWD"
- "base de pacientes reais" / "real patient base"
- "ingestão massiva de dados clínicos" / "massive clinical ingestion"
- "histórico longitudinal real" / "real longitudinal history"
- Qualquer contagem (`1234 exames`, `1150 consultas`, etc.) sem o split real/demo/synthetic_cohort imediatamente ao lado.

**Permitido:** "cohort sintético calibrado em medicina real, não observado em pacientes" + split real/demo/synthetic.

**Circularidade (pointer):** o sintético foi gerado a partir de deltas escolhidos pela equipe → padrão "achado" nele pode ser eco da suposição plantada. Tratamento completo (controle de leakage prompt→achado, hold-out, comparação com cohort real) = Bloco 3, não iniciado. Ver `docs/ROADMAP.md` e `docs/STATE_REAL_VS_MOCK.md`.

**Aplicação automática:**
- `audit_base_system_{pt,en}` em `supabase/functions/_shared/system-prompts.ts` carrega esta regra (REGISTRO DE HONESTIDADE).
- `scripts/generate-data-provenance.mjs` mantém os números atualizados via query direta.
- `npm run docs:provenance` antes de qualquer narrativa que cite volumes clínicos.

**Why:** auto-auditoria estava chamando 1234 exames sintéticos de "Real-World Data" — overclaim grave para reguladores e investidores. A regra fecha a porta em todas as superfícies, não só no auditor.