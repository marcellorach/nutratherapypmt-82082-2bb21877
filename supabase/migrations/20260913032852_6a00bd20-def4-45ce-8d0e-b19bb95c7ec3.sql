-- Trigger functions need no direct EXECUTE grants
REVOKE EXECUTE ON FUNCTION public.auto_fulfill_audit_requests() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_ai_system_prompt_change() FROM anon, authenticated;

-- Privileged/admin routines must not be callable without signing in
REVOKE EXECUTE ON FUNCTION public.activate_ai_prompt_version(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.approve_access_request(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.count_pending_access_requests() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_cohort_stats(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_conditions_with_treatability_v2() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_relations_graph_data(integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_translation_version() FROM anon;
REVOKE EXECUTE ON FUNCTION public.search_relations_by_term(text[], integer) FROM anon;