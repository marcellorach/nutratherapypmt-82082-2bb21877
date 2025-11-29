-- Add AI model configuration entries
INSERT INTO ai_configurations (config_key, config_value, description, is_active) VALUES
  ('ai_model_extraction', '"gemini-3-pro-preview"', 'Model for PDF extraction tasks', true),
  ('ai_model_triplets', '"gemini-3-pro-preview"', 'Model for triplet generation', true),
  ('ai_model_chat', '"gemini-3-pro-preview"', 'Model for document chat', true),
  ('ai_model_translate', '"gemini-3-pro-preview"', 'Model for translation tasks', true),
  ('ai_model_embeddings', '"text-embedding-004"', 'Model for vector embeddings', true)
ON CONFLICT (config_key) DO UPDATE SET 
  config_value = EXCLUDED.config_value,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  updated_at = now();