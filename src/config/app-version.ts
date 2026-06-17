/**
 * Versão semântica do app Senex AI (MAJOR.MINOR.PATCH).
 * Usada no selo de auditoria de integridade dos system prompts e enviada
 * à edge function `verify-system-prompts`.
 *
 * `PROMPTS_REVISION` é um quarto dígito incrementado SOMENTE quando o
 * manifest de prompts muda (novas chaves, conteúdo, metadados) sem que o
 * sistema mude de versão. Reseta para 0 quando APP_VERSION é incrementado.
 * Selo final exibido: "Sistema 7.2.4 · Prompts rev. 1".
 */
export const APP_VERSION = '7.2.4';
export const PROMPTS_REVISION = 2;
export const APP_VERSION_FULL = `${APP_VERSION}.${PROMPTS_REVISION}`;