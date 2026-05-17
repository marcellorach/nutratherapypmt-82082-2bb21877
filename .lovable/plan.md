## Plan: Home cards CTA clarity + Footer rework

### a) Home cards: highlight "Control Panel", mark others as "in development"
File: `src/pages/Index.tsx` (authenticated 3-card section)
- **Control Panel** card: keep "Open Admin / Abrir Admin" button enabled, make it visually prominent (primary/default variant instead of outline), keep the red "visite aqui!" arrow callout (translated to bilingual: "visit here!" / "visite aqui!").
- **Veterinarian Portal** card: replace the button with a disabled button labeled "In development / Em desenvolvimento" + a small muted badge "Coming soon / Em breve". Card opacity slightly reduced.
- **Owner Portal** card: same treatment — disabled "In development" button + "Coming soon" badge.
- Add new i18n keys in `src/locales/{pt,en}/translation.json`:
  - `home.inDevelopment` = "Em desenvolvimento" / "In development"
  - `home.comingSoon` = "Em breve" / "Coming soon"
  - `home.visitHere` = "visite aqui!" / "visit here!"
- Bump `I18N_VERSION` in `src/i18n.ts`.

### b) Footer copyright update
Files: `src/components/layout/Footer.tsx` and `src/components/administrador/layout/AdminFooter.tsx`
- Replace current copyright line with a corrected bilingual version:
  - EN: `Senex AI © 2025–2026 — developed by PetMoreTime. All rights reserved by PetMoreTime.`
  - PT: `Senex AI © 2025–2026 — desenvolvido pela PetMoreTime. Todos os direitos reservados à PetMoreTime.`
- Use translation keys (`footer.copyrightFull` or update existing `footer.copyright`).

### c) Tagline under "PetMoreTime"
Where: under the "PetMoreTime" wordmark area (header logo block in `src/components/layout/Header.tsx`).
Note: the visible header logo shows "Senex AI", and "PetMoreTime" appears as a separate brand mark elsewhere (uploaded screenshot shows PetMoreTime logo with tagline "E..." cut off). I'll interpret this as: add the tagline **"Veterinary Geroscience"** (corrected English — "geroscience" is the proper term, not "geocience") under the PetMoreTime brand reference.
- Add as a small italic line under "a PetMoreTime platform" wherever PetMoreTime is shown (footer "Powered by" / copyright area, and the header subtitle block).
- New i18n key: `branding.petMoreTimeTagline` = "Veterinary Geroscience" (same in PT, as it's the brand tagline in English — confirm if you want it translated to "Geriatria Veterinária" in PT).

### d) Split the middle phrase into two lines, aligned with "PetMoreTime" logo
The "middle phrase" = `header.platformSubtitleLine1` = "Extending Lives & Preventing Degenerative Disease" (currently single line, centered under Senex AI).
- Split into two lines:
  - Line 1: "Extending Lives"
  - Line 2: "& Preventing Degenerative Disease"
- Left-align with the PetMoreTime/Senex AI logo (`text-left` instead of `text-center` in the header subtitle block).
- Update keys:
  - `header.platformSubtitleLine1a` = "Extending Lives" / "Prolongando Vidas"
  - `header.platformSubtitleLine1b` = "& Preventing Degenerative Disease" / "& Prevenindo Doenças Degenerativas"

### Clarifying question
For (c): the PetMoreTime tagline — should it stay in English ("Veterinary Geroscience") in both locales, or be translated to PT ("Geriatria Veterinária" or "Geroscience Veterinária")? I'll default to keeping it in English in both, since it functions as a brand tagline.

### Documentation updates
- CHANGELOG.md: add entries under `[Unreleased]` (UI clarity for home cards, footer rebrand, header tagline split).
- Run `npm run sync:changelog` after the edit.
