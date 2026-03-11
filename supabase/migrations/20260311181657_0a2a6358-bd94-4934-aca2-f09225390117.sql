INSERT INTO public.ai_configurations (config_key, config_value, description, is_active)
VALUES 
  ('prompt_relations_auditor_system', '"Voce e o Auditor Conversacional sobre Relacoes e Conexoes de um sistema de nutraceuticos veterinarios. Seu papel e analisar criticamente as relacoes entre nutraceuticos, condicoes de saude, predisposicoes de racas e evidencias cientificas armazenadas no banco de dados."', 'System prompt for the Relations Auditor conversational chat (used by relations-auditor edge function)', true),
  ('ai_model_relations_auditor', '"google/gemini-3.1-pro-preview"', 'AI model used by the Relations Auditor chat', true)
ON CONFLICT (config_key) DO NOTHING;