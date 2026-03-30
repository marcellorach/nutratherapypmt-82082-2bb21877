

# Add `is_demo` Flag to Pet Profiles

## Overview
Add a boolean `is_demo` column to `pet_profiles` so sample pets are clearly tagged as DEMO. Show a visual badge on cards, and add a "Hide/Show Demo" toggle + "Delete All Demo" button for easy cleanup when transitioning to real cases.

## Changes

### 1. Database Migration
```sql
ALTER TABLE public.pet_profiles ADD COLUMN is_demo BOOLEAN NOT NULL DEFAULT false;
```

### 2. `GenerateSamplePetsButton.tsx`
When inserting sample pets, set `is_demo: true`.

### 3. `PetProfileCard.tsx`
- Accept `is_demo` in the pet interface
- Show a "DEMO" badge (orange/amber) on the card when `is_demo === true`

### 4. `AdminPetManagementTab.tsx`
- Add a toggle button "Show Demo" / "Hide Demo" to filter demo pets in/out
- Change "Delete All" to "Delete All Demo" — only deletes pets where `is_demo = true`
- Keep individual delete working for any pet

### 5. `usePetProfile.ts`
- Include `is_demo` in the select query and type definition
- Add a `useDeleteDemoPets` mutation that deletes all `is_demo = true` pets

### 6. Tutor Portal (`TutorPage.tsx`)
- Exclude `is_demo` pets from the tutor view (real tutors shouldn't see demo data), OR show them with a DEMO tag — keeping them visible for now since we're in demo phase

### Files
- **Migration**: new SQL adding `is_demo` column
- **Edit**: `GenerateSamplePetsButton.tsx` — set `is_demo: true`
- **Edit**: `PetProfileCard.tsx` — show DEMO badge
- **Edit**: `AdminPetManagementTab.tsx` — toggle + delete demo button
- **Edit**: `src/hooks/usePetProfile.ts` — include `is_demo` field, add delete-demo mutation

