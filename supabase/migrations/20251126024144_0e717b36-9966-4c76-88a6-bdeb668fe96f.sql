-- Criar tabela de espécies (Canine, Feline)
CREATE TABLE IF NOT EXISTS public.species (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  description TEXT,
  description_en TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de grupos de raças
CREATE TABLE IF NOT EXISTS public.breed_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  species_id UUID NOT NULL REFERENCES public.species(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description TEXT,
  description_en TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(species_id, name)
);

-- Criar tabela de raças
CREATE TABLE IF NOT EXISTS public.breeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  breed_group_id UUID NOT NULL REFERENCES public.breed_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description TEXT,
  description_en TEXT,
  average_weight_kg NUMERIC,
  average_lifespan_years NUMERIC,
  size_category TEXT CHECK (size_category IN ('toy', 'small', 'medium', 'large', 'giant')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(breed_group_id, name)
);

-- Criar tabela de predisposições raciais
CREATE TABLE IF NOT EXISTS public.breed_predispositions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  breed_id UUID NOT NULL REFERENCES public.breeds(id) ON DELETE CASCADE,
  condition_id UUID NOT NULL REFERENCES public.health_conditions(id) ON DELETE CASCADE,
  risk_factor NUMERIC NOT NULL CHECK (risk_factor >= 1.0 AND risk_factor <= 10.0),
  evidence_grade TEXT NOT NULL CHECK (evidence_grade IN ('high', 'moderate', 'low', 'very_low')),
  notes TEXT,
  supporting_study_ids UUID[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(breed_id, condition_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_breeds_breed_group ON public.breeds(breed_group_id);
CREATE INDEX IF NOT EXISTS idx_breed_groups_species ON public.breed_groups(species_id);
CREATE INDEX IF NOT EXISTS idx_breed_predispositions_breed ON public.breed_predispositions(breed_id);
CREATE INDEX IF NOT EXISTS idx_breed_predispositions_condition ON public.breed_predispositions(condition_id);
CREATE INDEX IF NOT EXISTS idx_breed_predispositions_risk_factor ON public.breed_predispositions(risk_factor DESC);

-- Enable RLS
ALTER TABLE public.species ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breed_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breed_predispositions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Authenticated users can view, admins can manage
CREATE POLICY "Anyone authenticated can view species"
  ON public.species FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage species"
  ON public.species FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Anyone authenticated can view breed groups"
  ON public.breed_groups FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage breed groups"
  ON public.breed_groups FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Anyone authenticated can view breeds"
  ON public.breeds FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage breeds"
  ON public.breeds FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Anyone authenticated can view breed predispositions"
  ON public.breed_predispositions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage breed predispositions"
  ON public.breed_predispositions FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Seed data: Species
INSERT INTO public.species (name, name_en, description, description_en) VALUES
('Canino', 'Canine', 'Espécie canina (cães)', 'Canine species (dogs)'),
('Felino', 'Feline', 'Espécie felina (gatos)', 'Feline species (cats)')
ON CONFLICT (name) DO NOTHING;

-- Seed data: Breed Groups para Caninos
WITH canine_species AS (SELECT id FROM public.species WHERE name = 'Canino' LIMIT 1)
INSERT INTO public.breed_groups (species_id, name, name_en, description, description_en)
SELECT 
  canine_species.id,
  unnest(ARRAY['Braquicefálico', 'Gigante', 'Pequeno', 'Retriever', 'Pastor', 'Terrier', 'Toy', 'Esportivo', 'Trabalhador']),
  unnest(ARRAY['Brachycephalic', 'Giant', 'Small', 'Retriever', 'Shepherd', 'Terrier', 'Toy', 'Sporting', 'Working']),
  unnest(ARRAY['Raças com focinho achatado', 'Raças de grande porte', 'Raças pequenas', 'Raças retrievers', 'Raças pastoras', 'Raças terrier', 'Raças toy', 'Raças esportivas', 'Raças de trabalho']),
  unnest(ARRAY['Flat-faced breeds', 'Large breed dogs', 'Small breed dogs', 'Retriever breeds', 'Herding breeds', 'Terrier breeds', 'Toy breeds', 'Sporting breeds', 'Working breeds'])
FROM canine_species
ON CONFLICT (species_id, name) DO NOTHING;

-- Seed data: Breed Groups para Felinos
WITH feline_species AS (SELECT id FROM public.species WHERE name = 'Felino' LIMIT 1)
INSERT INTO public.breed_groups (species_id, name, name_en, description, description_en)
SELECT 
  feline_species.id,
  unnest(ARRAY['Oriental', 'Persa', 'Doméstico de Pelo Curto', 'Doméstico de Pelo Longo', 'Grande Porte']),
  unnest(ARRAY['Oriental', 'Persian', 'Domestic Shorthair', 'Domestic Longhair', 'Large Breed']),
  unnest(ARRAY['Raças orientais', 'Raças persas e exóticas', 'Gatos domésticos de pelo curto', 'Gatos domésticos de pelo longo', 'Raças grandes']),
  unnest(ARRAY['Oriental breeds', 'Persian and exotic breeds', 'Domestic shorthair cats', 'Domestic longhair cats', 'Large breed cats'])
FROM feline_species
ON CONFLICT (species_id, name) DO NOTHING;

-- Seed data: Raças Caninas Comuns (corrigido)
WITH breed_group_data AS (
  SELECT bg.id, bg.name FROM public.breed_groups bg
  JOIN public.species s ON bg.species_id = s.id
  WHERE s.name = 'Canino'
)
INSERT INTO public.breeds (breed_group_id, name, name_en, description, description_en, average_weight_kg, average_lifespan_years, size_category)
SELECT 
  bgd.id,
  breeds_data.name,
  breeds_data.name_en,
  breeds_data.description,
  breeds_data.description_en,
  breeds_data.average_weight_kg,
  breeds_data.average_lifespan_years,
  breeds_data.size_category
FROM breed_group_data bgd
JOIN (VALUES
  ('Retriever', 'Golden Retriever', 'Golden Retriever', 'Raça amigável e inteligente', 'Friendly and intelligent breed', 30, 12, 'large'),
  ('Retriever', 'Labrador Retriever', 'Labrador Retriever', 'Raça popular e versátil', 'Popular and versatile breed', 32, 12, 'large'),
  ('Pastor', 'Pastor Alemão', 'German Shepherd', 'Raça leal e versátil', 'Loyal and versatile breed', 35, 11, 'large'),
  ('Braquicefálico', 'Bulldog Francês', 'French Bulldog', 'Raça compacta e braquicefálica', 'Compact brachycephalic breed', 12, 11, 'small'),
  ('Braquicefálico', 'Bulldog Inglês', 'English Bulldog', 'Raça robusta e braquicefálica', 'Robust brachycephalic breed', 25, 9, 'medium'),
  ('Braquicefálico', 'Pug', 'Pug', 'Raça pequena e braquicefálica', 'Small brachycephalic breed', 7, 13, 'small'),
  ('Pequeno', 'Beagle', 'Beagle', 'Raça de caça de pequeno porte', 'Small hunting breed', 12, 13, 'small'),
  ('Gigante', 'São Bernardo', 'Saint Bernard', 'Raça gigante e amigável', 'Giant friendly breed', 70, 9, 'giant'),
  ('Gigante', 'Dogue Alemão', 'Great Dane', 'Raça gigante elegante', 'Giant elegant breed', 65, 8, 'giant'),
  ('Terrier', 'Yorkshire Terrier', 'Yorkshire Terrier', 'Raça toy terrier', 'Toy terrier breed', 3, 14, 'toy'),
  ('Esportivo', 'Cocker Spaniel', 'Cocker Spaniel', 'Raça esportiva de médio porte', 'Medium sporting breed', 14, 12, 'medium'),
  ('Trabalhador', 'Rottweiler', 'Rottweiler', 'Raça de guarda robusta', 'Robust guard breed', 50, 10, 'large'),
  ('Pastor', 'Border Collie', 'Border Collie', 'Raça inteligente de pastoreio', 'Intelligent herding breed', 18, 13, 'medium')
) AS breeds_data(group_name, name, name_en, description, description_en, average_weight_kg, average_lifespan_years, size_category)
ON bgd.name = breeds_data.group_name
ON CONFLICT (breed_group_id, name) DO NOTHING;

-- Seed data: Raças Felinas Comuns (corrigido)
WITH breed_group_data AS (
  SELECT bg.id, bg.name FROM public.breed_groups bg
  JOIN public.species s ON bg.species_id = s.id
  WHERE s.name = 'Felino'
)
INSERT INTO public.breeds (breed_group_id, name, name_en, description, description_en, average_weight_kg, average_lifespan_years, size_category)
SELECT 
  bgd.id,
  breeds_data.name,
  breeds_data.name_en,
  breeds_data.description,
  breeds_data.description_en,
  breeds_data.average_weight_kg,
  breeds_data.average_lifespan_years,
  breeds_data.size_category
FROM breed_group_data bgd
JOIN (VALUES
  ('Persa', 'Persa', 'Persian', 'Raça de pelo longo e face achatada', 'Long-haired flat-faced breed', 4.5, 14, 'medium'),
  ('Persa', 'Exótico', 'Exotic Shorthair', 'Versão de pelo curto do Persa', 'Short-haired version of Persian', 4.2, 13, 'medium'),
  ('Oriental', 'Siamês', 'Siamese', 'Raça vocal e sociável', 'Vocal and sociable breed', 3.8, 15, 'medium'),
  ('Oriental', 'Oriental de Pelo Curto', 'Oriental Shorthair', 'Raça elegante e ativa', 'Elegant and active breed', 4.0, 14, 'medium'),
  ('Doméstico de Pelo Curto', 'Doméstico de Pelo Curto', 'Domestic Shorthair', 'Gato doméstico comum', 'Common domestic cat', 4.5, 15, 'medium'),
  ('Grande Porte', 'Maine Coon', 'Maine Coon', 'Raça grande e robusta', 'Large robust breed', 6.5, 14, 'large'),
  ('Grande Porte', 'Ragdoll', 'Ragdoll', 'Raça grande e dócil', 'Large docile breed', 6.0, 13, 'large')
) AS breeds_data(group_name, name, name_en, description, description_en, average_weight_kg, average_lifespan_years, size_category)
ON bgd.name = breeds_data.group_name
ON CONFLICT (breed_group_id, name) DO NOTHING;