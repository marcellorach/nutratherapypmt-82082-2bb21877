-- Default PUBLIC EXECUTE grant is what keeps these callable by anon; revoke from PUBLIC and re-grant explicitly
REVOKE EXECUTE ON FUNCTION public.auto_fulfill_audit_requests() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_ai_system_prompt_change() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_user_role_change() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_role_permission_change() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_user_override_change() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.prevent_last_admin_removal() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validate_role_name() FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public.activate_ai_prompt_version(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.activate_ai_prompt_version(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.approve_access_request(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_access_request(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.count_pending_access_requests() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_pending_access_requests() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_cohort_stats(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_cohort_stats(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_conditions_with_treatability_v2() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_conditions_with_treatability_v2() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_relations_graph_data(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_relations_graph_data(integer) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.increment_translation_version() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_translation_version() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.search_relations_by_term(text[], integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_relations_by_term(text[], integer) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.has_permission(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text, text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.current_has_permission(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_has_permission(text, text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.my_effective_permissions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.my_effective_permissions() TO authenticated, service_role;