/**
 * Versão semântica do app Senex AI usada para auditoria de integridade
 * (selo "Última verificação" na página de System Prompts e tabela
 * `ai_system_prompts_integrity_check`).
 *
 * Incrementar a cada release significativo. Lida pelo front e enviada à
 * edge function `verify-system-prompts` quando o usuário (ou o boot do app)
 * dispara a verificação contínua.
 */
export const APP_VERSION = '1.1.0';