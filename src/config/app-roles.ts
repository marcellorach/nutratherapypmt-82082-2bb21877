/**
 * Lista canônica de papéis da plataforma.
 *
 * Fonte única em código. O banco tem duas cópias desta mesma lista:
 *  - a constraint `public.user_roles_role_check`
 *  - os gatilhos `validate_user_role()` / `validate_role_name()`
 *
 * `src/config/app-roles.test.ts` falha se qualquer uma delas divergir daqui.
 */
export const APP_ROLES = [
  'admin',
  'scientist',
  'vet_coordinator',
  'veterinarian',
  'tutor',
  'user',
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const isAppRole = (value: string): value is AppRole =>
  (APP_ROLES as readonly string[]).includes(value);
