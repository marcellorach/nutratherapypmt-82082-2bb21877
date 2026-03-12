

## Plan: Enrich Owner Portal — Filter Pets + Rich Proposal + AI Chat + Treatment Timeline + Periodic Exams

### Overview

Two changes: (a) Only show pets that have proposals in the tutor portal; (b) Massively enrich the `TreatmentProposalCard` and save richer data from `handleApproveStack`.

### 1. Filter Pets to Only Those with Proposals

In `TutorPage.tsx`:
- After loading all pets, query `treatment_proposals` to get distinct `pet_id`s that have proposals
- Filter the pets list to only those with at least one proposal
- Auto-select the first pet that has proposals

### 2. Save Richer Data in `handleApproveStack`

In `PetProfilePage.tsx`, expand the `proposalData` to include:
- `biological_pathways`: snapshot of `kgPathways` (compound → mechanism → effect → outcome chains)
- `key_triplets`: top 10 most relevant triplets from `kgTriplets` with subject/predicate/object/confidence
- `treatment_timeline`: generated 12-month expected milestones (month 1: adaptation, month 2-3: early effects, month 4-6: measurable improvement, month 7-12: maintenance & optimization)
- `periodic_exams`: stack of recommended periodic exams based on conditions (e.g., inflammatory markers at 3mo, liver/kidney panel at 6mo, full reassessment at 12mo)
- `predispositions`: breed risk data
- `lab_alerts`: any current lab abnormalities

Update the DB column — these all go into existing JSONB fields (`scientific_summary` can hold all of this).

### 3. Enrich `TreatmentProposalCard` with New Sections

Rewrite `TreatmentProposalCard.tsx` to be a much richer, multi-section proposal:

1. **Header** (keep, improve gradient)
2. **Geroscience Explanation** (keep, slightly richer text)
3. **Conditions** (keep badges, add severity indicator)
4. **Biological Pathways** — visual chain: Compound → Mechanism → Effect → Outcome (simplified version of BiologicalPathway for tutors, no L0/L2 jargon — use plain language like "How it works")
5. **Scientific Evidence** (keep triplet/study stats, add top 3 key relationships as readable sentences: "Quercetin TREATS Osteoarthritis — 4 studies, 87% confidence")
6. **Compounds** (keep, add brief mechanism per compound)
7. **Expected Treatment Timeline** — 12-month visual timeline with milestones (month markers with expected effects)
8. **Periodic Exam Schedule** — table/list of recommended exams at 3, 6, 9, 12 months
9. **Vet Approval** (keep)
10. **AI Q&A Chat** — collapsible section with a chat powered by the existing `chat` edge function, system prompt contextualized with this pet's proposal data (conditions, compounds, pathways). The "I Have Questions" button opens this chat.
11. **Living Program** (keep)
12. **Pricing** (keep)
13. **Accept / Chat buttons** (keep, wire "I Have Questions" to toggle chat)

### 4. New Component: `ProposalAIChat`

Create `src/components/tutor/ProposalAIChat.tsx`:
- Simple chat UI (reuse pattern from `CompoundSpecificChat`)
- System prompt includes: pet name/breed/age, conditions, compounds with dosages, pathways summary, rationale
- Uses `supabase.functions.invoke('chat', ...)` 
- Renders markdown responses
- Bilingual (responds in user's language)

### 5. i18n Keys

Add ~30 new translation keys for:
- Biological pathway section titles
- Timeline milestone descriptions (month 1, 3, 6, 12)
- Periodic exam schedule labels
- AI chat placeholder/suggestions
- All in PT and EN

### Files

- **Edit**: `src/pages/tutor/TutorPage.tsx` (filter pets by proposals)
- **Edit**: `src/pages/veterinario/PetProfilePage.tsx` (richer proposalData with pathways, triplets, timeline, exams)
- **Rewrite**: `src/components/tutor/TreatmentProposalCard.tsx` (all new sections)
- **Create**: `src/components/tutor/ProposalAIChat.tsx` (AI chat for tutor questions)
- **Edit**: `src/locales/pt/translation.json` and `src/locales/en/translation.json`

