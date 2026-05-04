
-- Tags estruturadas nos estudos
ALTER TABLE public.processed_studies
  ADD COLUMN IF NOT EXISTS tags jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS tags_source text DEFAULT 'pending' CHECK (tags_source IN ('pending','ai_extracted','manual','reviewed')),
  ADD COLUMN IF NOT EXISTS tags_reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS tags_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS prestige_tier smallint CHECK (prestige_tier BETWEEN 1 AND 5);

CREATE INDEX IF NOT EXISTS idx_processed_studies_tags ON public.processed_studies USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_processed_studies_prestige ON public.processed_studies (prestige_tier);
CREATE INDEX IF NOT EXISTS idx_processed_studies_tags_source ON public.processed_studies (tags_source);

-- Lookup de prestígio por journal
CREATE TABLE IF NOT EXISTS public.journal_prestige_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_name text NOT NULL,
  journal_name_normalized text NOT NULL UNIQUE,
  tier smallint NOT NULL CHECK (tier BETWEEN 1 AND 5),
  quartile text CHECK (quartile IN ('Q1','Q2','Q3','Q4')),
  impact_factor numeric,
  source text NOT NULL DEFAULT 'manual',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_journal_prestige_normalized ON public.journal_prestige_tiers (journal_name_normalized);

ALTER TABLE public.journal_prestige_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view journal tiers"
  ON public.journal_prestige_tiers FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins manage journal tiers"
  ON public.journal_prestige_tiers FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE TRIGGER update_journal_prestige_tiers_updated_at
  BEFORE UPDATE ON public.journal_prestige_tiers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed de ~40 journals top relevantes (vet + longevidade + medicina geral)
INSERT INTO public.journal_prestige_tiers (journal_name, journal_name_normalized, tier, quartile, source) VALUES
  ('Nature', 'nature', 5, 'Q1', 'seed'),
  ('Science', 'science', 5, 'Q1', 'seed'),
  ('Cell', 'cell', 5, 'Q1', 'seed'),
  ('The Lancet', 'lancet', 5, 'Q1', 'seed'),
  ('New England Journal of Medicine', 'newenglandjournalofmedicine', 5, 'Q1', 'seed'),
  ('Nature Aging', 'natureaging', 5, 'Q1', 'seed'),
  ('Nature Medicine', 'naturemedicine', 5, 'Q1', 'seed'),
  ('Cell Metabolism', 'cellmetabolism', 5, 'Q1', 'seed'),
  ('Cochrane Database of Systematic Reviews', 'cochranedatabaseofsystematicreviews', 5, 'Q1', 'seed'),
  ('Aging Cell', 'agingcell', 4, 'Q1', 'seed'),
  ('GeroScience', 'geroscience', 4, 'Q1', 'seed'),
  ('Journal of Veterinary Internal Medicine', 'journalofveterinaryinternalmedicine', 4, 'Q1', 'seed'),
  ('Veterinary Journal', 'veterinaryjournal', 4, 'Q1', 'seed'),
  ('Frontiers in Veterinary Science', 'frontiersinveterinaryscience', 4, 'Q1', 'seed'),
  ('PLOS ONE', 'plosone', 3, 'Q2', 'seed'),
  ('Scientific Reports', 'scientificreports', 3, 'Q1', 'seed'),
  ('Journal of the American Veterinary Medical Association', 'journaloftheamericanveterinarymedicalassociation', 4, 'Q1', 'seed'),
  ('JAVMA', 'javma', 4, 'Q1', 'seed'),
  ('Veterinary Record', 'veterinaryrecord', 3, 'Q2', 'seed'),
  ('Animals', 'animals', 3, 'Q1', 'seed'),
  ('BMC Veterinary Research', 'bmcveterinaryresearch', 3, 'Q1', 'seed'),
  ('Journal of Small Animal Practice', 'journalofsmallanimalpractice', 3, 'Q2', 'seed'),
  ('American Journal of Veterinary Research', 'americanjournalofveterinaryresearch', 3, 'Q2', 'seed'),
  ('Research in Veterinary Science', 'researchinveterinaryscience', 3, 'Q2', 'seed'),
  ('Veterinary Clinics of North America', 'veterinaryclinicsofnorthamerica', 3, 'Q2', 'seed'),
  ('Topics in Companion Animal Medicine', 'topicsincompanionanimalmedicine', 3, 'Q2', 'seed'),
  ('Journal of Veterinary Pharmacology and Therapeutics', 'journalofveterinarypharmacologyandtherapeutics', 3, 'Q2', 'seed'),
  ('Journal of Animal Science', 'journalofanimalscience', 3, 'Q1', 'seed'),
  ('Nutrients', 'nutrients', 3, 'Q1', 'seed'),
  ('Antioxidants', 'antioxidants', 3, 'Q1', 'seed'),
  ('International Journal of Molecular Sciences', 'internationaljournalofmolecularsciences', 3, 'Q1', 'seed'),
  ('Biomedicines', 'biomedicines', 3, 'Q1', 'seed'),
  ('Aging', 'aging', 3, 'Q2', 'seed'),
  ('Rejuvenation Research', 'rejuvenationresearch', 3, 'Q2', 'seed'),
  ('Mechanisms of Ageing and Development', 'mechanismsofageinganddevelopment', 3, 'Q2', 'seed'),
  ('Journal of Gerontology', 'journalofgerontology', 4, 'Q1', 'seed'),
  ('Free Radical Biology and Medicine', 'freeradicalbiologyandmedicine', 4, 'Q1', 'seed'),
  ('Biorxiv', 'biorxiv', 1, NULL, 'seed'),
  ('Medrxiv', 'medrxiv', 1, NULL, 'seed'),
  ('Preprints', 'preprints', 1, NULL, 'seed')
ON CONFLICT (journal_name_normalized) DO NOTHING;
