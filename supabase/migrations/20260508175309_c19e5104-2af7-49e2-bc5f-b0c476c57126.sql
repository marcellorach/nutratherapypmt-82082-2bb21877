WITH orphans AS (
  SELECT DISTINCT s.pet_id
  FROM pet_clinical_analysis_snapshots s
  LEFT JOIN pet_profiles p ON p.id = s.pet_id
  WHERE p.id IS NULL AND s.status = 'complete'
),
numbered AS (
  SELECT pet_id, ROW_NUMBER() OVER (ORDER BY pet_id) AS rn FROM orphans
),
samples AS (
  SELECT * FROM (VALUES
    ('Bento','Labrador Retriever',8.5,32.0,'male',true,'Patrícia Almeida','patricia.almeida@example.com'),
    ('Mel','Golden Retriever',6.0,28.5,'female',true,'Roberto Silva','roberto.silva@example.com'),
    ('Toby','Beagle',4.0,12.5,'male',false,'Helena Castro','helena.castro@example.com'),
    ('Nina','Border Collie',7.5,18.0,'female',true,'Diego Fernandes','diego.fernandes@example.com'),
    ('Pipoca','Shih Tzu',9.0,6.5,'female',true,'Beatriz Ramos','beatriz.ramos@example.com'),
    ('Theo','Pastor Alemão',5.5,35.0,'male',false,'Gustavo Lima','gustavo.lima@example.com'),
    ('Amora','Poodle Toy',10.0,4.5,'female',true,'Renata Souza','renata.souza@example.com'),
    ('Caco','Bulldog Francês',3.5,11.0,'male',true,'Felipe Moreira','felipe.moreira@example.com'),
    ('Maya','Husky Siberiano',6.5,22.0,'female',true,'Camila Borges','camila.borges@example.com'),
    ('Bidu','Yorkshire Terrier',11.0,3.5,'male',true,'Eduardo Pinto','eduardo.pinto@example.com'),
    ('Cacau','Dachshund',7.0,8.0,'female',true,'Isabela Martins','isabela.martins@example.com'),
    ('Floki','Pinscher',4.5,5.0,'male',true,'Tiago Nunes','tiago.nunes@example.com'),
    ('Lola','Cocker Spaniel',8.0,14.0,'female',true,'Vanessa Cardoso','vanessa.cardoso@example.com'),
    ('Zeus','Rottweiler',5.0,42.0,'male',false,'Marcos Teixeira','marcos.teixeira@example.com')
  ) AS s(name, breed, age_years, weight_kg, sex, neutered, owner_name, owner_email)
),
samples_numbered AS (
  SELECT s.*, ROW_NUMBER() OVER () AS rn FROM samples s
)
INSERT INTO pet_profiles (id, name, species, breed, age_years, weight_kg, sex, neutered, owner_name, owner_email, is_demo)
SELECT n.pet_id, sn.name, 'canine', sn.breed, sn.age_years, sn.weight_kg, sn.sex, sn.neutered, sn.owner_name, sn.owner_email, true
FROM numbered n
JOIN samples_numbered sn ON sn.rn = n.rn
ON CONFLICT (id) DO NOTHING;