-- Classificar os outcomes restantes por família

-- Envelhecimento & Longevidade
UPDATE nutraceutical_outcomes 
SET family_id = '436b5183-3686-42b7-94f2-6afe8ff42c78'
WHERE name IN (
  'OS - estress oxidativo',
  'Senescência Celular',
  'Disfunção autofágica',
  'Geroproteção celular',
  'inflammaging'
);