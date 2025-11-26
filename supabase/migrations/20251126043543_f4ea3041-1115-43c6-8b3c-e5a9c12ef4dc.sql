-- Add synced_at column to track when triplets were synced to Neo4j
ALTER TABLE triplet_extractions 
ADD COLUMN IF NOT EXISTS synced_at timestamp with time zone;