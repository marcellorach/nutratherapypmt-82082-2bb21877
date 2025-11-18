-- Add unique constraint to config_key in ai_configurations table
ALTER TABLE public.ai_configurations
ADD CONSTRAINT ai_configurations_config_key_unique UNIQUE (config_key);