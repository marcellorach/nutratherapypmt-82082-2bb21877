// =============================================================================
// VetGraphRAG - Neo4j Schema Configuration
// Hierarchical Model: 5 Layers (L0-L4) with 20+ Semantic Relationships
// =============================================================================

// -----------------------------------------------------------------------------
// PHASE 1: DROP EXISTING CONSTRAINTS (if migrating from old schema)
// -----------------------------------------------------------------------------
// Run these only if you need to reset the schema:
// DROP CONSTRAINT nutraceutical_id IF EXISTS;
// DROP CONSTRAINT condition_id IF EXISTS;
// DROP CONSTRAINT study_id IF EXISTS;

// -----------------------------------------------------------------------------
// PHASE 2: NODE CONSTRAINTS (Uniqueness)
// -----------------------------------------------------------------------------

// Layer 0 - Compounds
CREATE CONSTRAINT nutraceutical_id IF NOT EXISTS 
FOR (n:Nutraceutical) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT drug_id IF NOT EXISTS 
FOR (n:Drug) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT chemical_compound_id IF NOT EXISTS 
FOR (n:ChemicalCompound) REQUIRE n.id IS UNIQUE;

// Layer 1 - Molecular Targets
CREATE CONSTRAINT pathway_id IF NOT EXISTS 
FOR (n:Pathway) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT receptor_id IF NOT EXISTS 
FOR (n:Receptor) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT enzyme_id IF NOT EXISTS 
FOR (n:Enzyme) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT gene_protein_id IF NOT EXISTS 
FOR (n:GeneProtein) REQUIRE n.id IS UNIQUE;

// Layer 2 - Mechanisms
CREATE CONSTRAINT mechanism_id IF NOT EXISTS 
FOR (n:Mechanism) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT signaling_cascade_id IF NOT EXISTS 
FOR (n:SignalingCascade) REQUIRE n.id IS UNIQUE;

// Layer 3 - Effects
CREATE CONSTRAINT biological_effect_id IF NOT EXISTS 
FOR (n:BiologicalEffect) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT side_effect_id IF NOT EXISTS 
FOR (n:SideEffect) REQUIRE n.id IS UNIQUE;

// Layer 4 - Clinical Outcomes
CREATE CONSTRAINT clinical_outcome_id IF NOT EXISTS 
FOR (n:ClinicalOutcome) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT condition_id IF NOT EXISTS 
FOR (n:Condition) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT disease_id IF NOT EXISTS 
FOR (n:Disease) REQUIRE n.id IS UNIQUE;

// Context Nodes
CREATE CONSTRAINT breed_id IF NOT EXISTS 
FOR (n:Breed) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT species_id IF NOT EXISTS 
FOR (n:Species) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT age_group_id IF NOT EXISTS 
FOR (n:AgeGroup) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT study_id IF NOT EXISTS 
FOR (n:Study) REQUIRE n.id IS UNIQUE;

// -----------------------------------------------------------------------------
// PHASE 3: NODE PROPERTY INDEXES (Performance)
// -----------------------------------------------------------------------------

// Name indexes for text search
CREATE INDEX nutraceutical_name IF NOT EXISTS FOR (n:Nutraceutical) ON (n.name);
CREATE INDEX pathway_name IF NOT EXISTS FOR (n:Pathway) ON (n.name);
CREATE INDEX mechanism_name IF NOT EXISTS FOR (n:Mechanism) ON (n.name);
CREATE INDEX biological_effect_name IF NOT EXISTS FOR (n:BiologicalEffect) ON (n.name);
CREATE INDEX condition_name IF NOT EXISTS FOR (n:Condition) ON (n.name);
CREATE INDEX breed_name IF NOT EXISTS FOR (n:Breed) ON (n.name);
CREATE INDEX species_name IF NOT EXISTS FOR (n:Species) ON (n.name);
CREATE INDEX study_title IF NOT EXISTS FOR (n:Study) ON (n.title);

// Layer indexes for hierarchical queries
CREATE INDEX nutraceutical_layer IF NOT EXISTS FOR (n:Nutraceutical) ON (n.layer);
CREATE INDEX pathway_layer IF NOT EXISTS FOR (n:Pathway) ON (n.layer);
CREATE INDEX mechanism_layer IF NOT EXISTS FOR (n:Mechanism) ON (n.layer);
CREATE INDEX biological_effect_layer IF NOT EXISTS FOR (n:BiologicalEffect) ON (n.layer);
CREATE INDEX condition_layer IF NOT EXISTS FOR (n:Condition) ON (n.layer);

// Category/Type indexes
CREATE INDEX pathway_type IF NOT EXISTS FOR (n:Pathway) ON (n.pathway_type);
CREATE INDEX mechanism_type IF NOT EXISTS FOR (n:Mechanism) ON (n.mechanism_type);
CREATE INDEX effect_type IF NOT EXISTS FOR (n:BiologicalEffect) ON (n.effect_type);
CREATE INDEX condition_category IF NOT EXISTS FOR (n:Condition) ON (n.category);

// External ID indexes (for data integration)
CREATE INDEX pathway_kegg IF NOT EXISTS FOR (n:Pathway) ON (n.kegg_id);
CREATE INDEX pathway_reactome IF NOT EXISTS FOR (n:Pathway) ON (n.reactome_id);
CREATE INDEX pathway_go IF NOT EXISTS FOR (n:Pathway) ON (n.go_term);
CREATE INDEX study_doi IF NOT EXISTS FOR (n:Study) ON (n.doi);

// -----------------------------------------------------------------------------
// PHASE 4: RELATIONSHIP INDEXES (Query Performance)
// -----------------------------------------------------------------------------

// Efficacy-based queries (find most effective treatments)
CREATE INDEX rel_efficacy IF NOT EXISTS FOR ()-[r:TREATS]-() ON (r.efficacy_score);
CREATE INDEX rel_evidence IF NOT EXISTS FOR ()-[r:TREATS]-() ON (r.evidence_level);

// Confidence-based queries
CREATE INDEX rel_confidence IF NOT EXISTS FOR ()-[r:INHIBITS]-() ON (r.confidence);
CREATE INDEX rel_activates_confidence IF NOT EXISTS FOR ()-[r:ACTIVATES]-() ON (r.confidence);

// Synergy queries
CREATE INDEX rel_synergy IF NOT EXISTS FOR ()-[r:SYNERGIZES_WITH]-() ON (r.synergy_score);

// Species-specific queries
CREATE INDEX rel_species IF NOT EXISTS FOR ()-[r:TREATS]-() ON (r.species_validated);

// Curated data queries
CREATE INDEX rel_curated IF NOT EXISTS FOR ()-[r:TREATS]-() ON (r.curated);

// -----------------------------------------------------------------------------
// PHASE 5: FULLTEXT INDEXES (Advanced Search)
// -----------------------------------------------------------------------------

// Fulltext search across all compound names
CREATE FULLTEXT INDEX compound_fulltext IF NOT EXISTS 
FOR (n:Nutraceutical|Drug|ChemicalCompound) ON EACH [n.name, n.synonyms];

// Fulltext search across targets
CREATE FULLTEXT INDEX target_fulltext IF NOT EXISTS 
FOR (n:Pathway|Receptor|Enzyme|GeneProtein) ON EACH [n.name, n.description];

// Fulltext search across mechanisms
CREATE FULLTEXT INDEX mechanism_fulltext IF NOT EXISTS 
FOR (n:Mechanism|SignalingCascade) ON EACH [n.name, n.description];

// Fulltext search across effects
CREATE FULLTEXT INDEX effect_fulltext IF NOT EXISTS 
FOR (n:BiologicalEffect|SideEffect) ON EACH [n.name, n.description];

// Fulltext search across conditions
CREATE FULLTEXT INDEX condition_fulltext IF NOT EXISTS 
FOR (n:Condition|Disease|ClinicalOutcome) ON EACH [n.name, n.description];

// Fulltext search across studies
CREATE FULLTEXT INDEX study_fulltext IF NOT EXISTS 
FOR (n:Study) ON EACH [n.title, n.abstract];

// -----------------------------------------------------------------------------
// PHASE 6: EXAMPLE NODE CREATION (Schema Reference)
// -----------------------------------------------------------------------------

// Example: Layer 0 - Nutraceutical Node
// CREATE (n:Nutraceutical {
//   id: 'nutra_curcumin_001',
//   name: 'Curcumin',
//   name_en: 'Curcumin',
//   layer: 'layer_0_compound',
//   entity_type: 'nutraceutical',
//   chemical_compound: 'Diferuloylmethane',
//   source: 'Curcuma longa',
//   dosage: '15-20 mg/kg/day',
//   bioavailability: 0.01,
//   half_life_hours: 6,
//   created_at: datetime(),
//   updated_at: datetime()
// })

// Example: Layer 1 - Pathway Node
// CREATE (p:Pathway {
//   id: 'pathway_nfkb_001',
//   name: 'NF-κB Signaling Pathway',
//   name_en: 'NF-κB Signaling Pathway',
//   layer: 'layer_1_target',
//   entity_type: 'pathway',
//   pathway_type: 'inflammatory',
//   kegg_id: 'hsa04064',
//   reactome_id: 'R-HSA-9020702',
//   go_term: 'GO:0038061',
//   category: 'immune_response',
//   species_relevance: ['canine', 'feline', 'human'],
//   created_at: datetime(),
//   updated_at: datetime()
// })

// Example: Layer 2 - Mechanism Node
// CREATE (m:Mechanism {
//   id: 'mech_cox2_inhib_001',
//   name: 'COX-2 Inhibition',
//   name_en: 'COX-2 Inhibition',
//   layer: 'layer_2_mechanism',
//   entity_type: 'mechanism',
//   mechanism_type: 'enzyme_inhibition',
//   action_type: 'inhibition',
//   molecular_target: 'Cyclooxygenase-2',
//   reversibility: 'reversible',
//   created_at: datetime(),
//   updated_at: datetime()
// })

// Example: Layer 3 - Biological Effect Node
// CREATE (e:BiologicalEffect {
//   id: 'effect_antiinflam_001',
//   name: 'Anti-inflammatory Effect',
//   name_en: 'Anti-inflammatory Effect',
//   layer: 'layer_3_effect',
//   entity_type: 'biological_effect',
//   effect_type: 'therapeutic',
//   effect_category: 'anti_inflammatory',
//   onset_time: '2-4 weeks',
//   duration: 'chronic',
//   created_at: datetime(),
//   updated_at: datetime()
// })

// Example: Layer 4 - Condition Node
// CREATE (c:Condition {
//   id: 'cond_osteoarthritis_001',
//   name: 'Osteoarthritis',
//   name_en: 'Osteoarthritis',
//   layer: 'layer_4_outcome',
//   entity_type: 'condition',
//   category: 'musculoskeletal',
//   severity_level: 'moderate',
//   icd_code: 'M19.9',
//   created_at: datetime(),
//   updated_at: datetime()
// })

// -----------------------------------------------------------------------------
// PHASE 7: EXAMPLE RELATIONSHIP CREATION (Schema Reference)
// -----------------------------------------------------------------------------

// Example: INHIBITS (L0 → L1) with full properties
// MATCH (n:Nutraceutical {id: 'nutra_curcumin_001'})
// MATCH (p:Pathway {id: 'pathway_nfkb_001'})
// CREATE (n)-[r:INHIBITS {
//   confidence: 0.92,
//   intensity: 0.75,
//   ic50: '10 μM',
//   ki: '5 μM',
//   dose_range: {min: 10, max: 30, unit: 'mg/kg'},
//   evidence_level: 'high',
//   evidence_count: 15,
//   species_validated: ['canine', 'feline'],
//   study_ids: ['study_001', 'study_002'],
//   curated: true,
//   curated_by: 'vet_001',
//   curated_at: datetime(),
//   created_at: datetime()
// }]->(p)

// Example: TRIGGERS (L1 → L2)
// MATCH (p:Pathway {id: 'pathway_nfkb_001'})
// MATCH (m:Mechanism {id: 'mech_cox2_inhib_001'})
// CREATE (p)-[r:TRIGGERS {
//   confidence: 0.88,
//   cascade_order: 1,
//   time_to_effect: '1-2 hours',
//   species_validated: ['canine'],
//   created_at: datetime()
// }]->(m)

// Example: PRODUCES (L2 → L3)
// MATCH (m:Mechanism {id: 'mech_cox2_inhib_001'})
// MATCH (e:BiologicalEffect {id: 'effect_antiinflam_001'})
// CREATE (m)-[r:PRODUCES {
//   confidence: 0.95,
//   magnitude: 0.70,
//   onset_hours: 48,
//   duration_weeks: 4,
//   dose_dependent: true,
//   created_at: datetime()
// }]->(e)

// Example: TREATS (L3 → L4) with full therapeutic properties
// MATCH (e:BiologicalEffect {id: 'effect_antiinflam_001'})
// MATCH (c:Condition {id: 'cond_osteoarthritis_001'})
// CREATE (e)-[r:TREATS {
//   efficacy_score: 0.78,
//   evidence_level: 'high',
//   confidence: 0.90,
//   study_count: 12,
//   nnt: 4,
//   response_rate: 0.65,
//   time_to_response_weeks: 4,
//   species_validated: ['canine', 'feline'],
//   dose_range: {min: 15, max: 25, unit: 'mg/kg/day'},
//   contraindications: ['renal_disease', 'pregnancy'],
//   first_evidence_year: 2015,
//   curated: true,
//   created_at: datetime()
// }]->(c)

// Example: SYNERGIZES_WITH (L0 ↔ L0)
// MATCH (n1:Nutraceutical {name: 'Curcumin'})
// MATCH (n2:Nutraceutical {name: 'Piperine'})
// CREATE (n1)-[r:SYNERGIZES_WITH {
//   synergy_score: 0.85,
//   mechanism: 'bioavailability_enhancement',
//   enhancement_factor: 20,
//   optimal_ratio: '20:1',
//   species_validated: ['canine'],
//   study_ids: ['study_003'],
//   notes: 'Piperine increases curcumin bioavailability by inhibiting glucuronidation',
//   created_at: datetime()
// }]->(n2)

// Example: ANTAGONIZES (L0 ↔ L0)
// MATCH (n1:Nutraceutical {name: 'Curcumin'})
// MATCH (n2:Nutraceutical {name: 'Iron Supplements'})
// CREATE (n1)-[r:ANTAGONIZES {
//   antagonism_score: 0.60,
//   mechanism: 'iron_chelation',
//   clinical_significance: 'moderate',
//   recommendation: 'Separate administration by 4 hours',
//   study_ids: ['study_004'],
//   created_at: datetime()
// }]->(n2)

// Example: PREDISPOSED_IN (L4 → Context)
// MATCH (c:Condition {id: 'cond_osteoarthritis_001'})
// MATCH (b:Breed {name: 'German Shepherd'})
// CREATE (c)-[r:PREDISPOSED_IN {
//   risk_factor: 2.5,
//   prevalence: 0.20,
//   onset_age_years: 7,
//   evidence_grade: 'A',
//   study_ids: ['study_005'],
//   created_at: datetime()
// }]->(b)

// Example: CITED_IN (Any → Study)
// MATCH (e:BiologicalEffect {id: 'effect_antiinflam_001'})
// MATCH (s:Study {id: 'study_001'})
// CREATE (e)-[r:CITED_IN {
//   relevance_score: 0.95,
//   citation_context: 'primary_finding',
//   page_numbers: [5, 8, 12],
//   created_at: datetime()
// }]->(s)

// -----------------------------------------------------------------------------
// PHASE 8: HIERARCHICAL TRAVERSAL QUERIES (Reference)
// -----------------------------------------------------------------------------

// Query 1: Full mechanism path from Nutraceutical to Condition
// MATCH path = (n:Nutraceutical)-[:INHIBITS|ACTIVATES|MODULATES*1..2]->
//              (p:Pathway|Receptor|Enzyme)-[:TRIGGERS|PARTICIPATES_IN*1..2]->
//              (m:Mechanism)-[:PRODUCES|LEADS_TO*1..2]->
//              (e:BiologicalEffect)-[:TREATS|PREVENTS|SUPPORTS]->
//              (c:Condition)
// WHERE n.name = 'Curcumin'
// RETURN path, 
//        [r IN relationships(path) | r.confidence] AS confidences,
//        reduce(s = 1.0, r IN relationships(path) | s * coalesce(r.confidence, 0.5)) AS path_confidence

// Query 2: Find synergistic combinations for a condition
// MATCH (n1:Nutraceutical)-[r1:TREATS]->(c:Condition {name: 'Osteoarthritis'})
// MATCH (n1)-[syn:SYNERGIZES_WITH]->(n2:Nutraceutical)-[r2:TREATS]->(c)
// WHERE syn.synergy_score > 0.7
// RETURN n1.name, n2.name, syn.synergy_score, syn.mechanism,
//        r1.efficacy_score AS efficacy_1, r2.efficacy_score AS efficacy_2

// Query 3: Multi-hop mechanism explanation
// MATCH (n:Nutraceutical {name: 'Curcumin'})-[r1]->(target)
// MATCH (target)-[r2]->(mechanism:Mechanism)
// MATCH (mechanism)-[r3]->(effect:BiologicalEffect)
// MATCH (effect)-[r4:TREATS]->(c:Condition)
// RETURN n.name AS nutraceutical,
//        type(r1) AS action,
//        target.name AS target,
//        mechanism.name AS mechanism,
//        effect.name AS effect,
//        c.name AS condition,
//        r4.efficacy_score AS efficacy

// Query 4: Find contraindications
// MATCH (n:Nutraceutical)-[r:WORSENS|CONTRAINDICATED_FOR|AGGRAVATES]->(c:Condition)
// WHERE n.name = 'Curcumin'
// RETURN c.name AS contraindicated_condition,
//        type(r) AS relationship,
//        r.severity AS severity,
//        r.mechanism AS reason

// Query 5: Breed-specific recommendations
// MATCH (b:Breed {name: 'German Shepherd'})<-[:PREDISPOSED_IN]-(c:Condition)
// MATCH (e:BiologicalEffect)-[r:TREATS]->(c)
// MATCH (m:Mechanism)-[:PRODUCES]->(e)
// MATCH (n:Nutraceutical)-[:INHIBITS|ACTIVATES|MODULATES]->(p)-[:TRIGGERS]->(m)
// WHERE r.efficacy_score > 0.7
// RETURN c.name AS condition,
//        n.name AS recommended_nutraceutical,
//        r.efficacy_score AS efficacy,
//        r.evidence_level AS evidence

// -----------------------------------------------------------------------------
// PHASE 9: DATA VALIDATION QUERIES
// -----------------------------------------------------------------------------

// Check orphan nodes (nodes without relationships)
// MATCH (n)
// WHERE NOT (n)--()
// RETURN labels(n), count(n)

// Check relationship distribution
// MATCH ()-[r]->()
// RETURN type(r) AS relationship_type, count(r) AS count
// ORDER BY count DESC

// Check layer distribution
// MATCH (n)
// WHERE n.layer IS NOT NULL
// RETURN n.layer AS layer, count(n) AS node_count
// ORDER BY layer

// Validate hierarchical integrity (no L4 → L0 direct edges)
// MATCH (a)-[r]->(b)
// WHERE a.layer = 'layer_4_outcome' AND b.layer = 'layer_0_compound'
// RETURN a.name, type(r), b.name

// -----------------------------------------------------------------------------
// END OF SCHEMA CONFIGURATION
// -----------------------------------------------------------------------------
