// Temporary access control: only these emails can use the platform.
// TODO: replace with proper role-based authorization.
export const ALLOWED_EMAILS: string[] = [
  'marcello@lifespan.com.br',
  'mrachlyn@gmail.com',
  'ritazuanaze@petmoretime.com.br',
  'mkaeberlein@gmail.com',
];

export const TEMP_SHARED_PASSWORD = 'macacoverde';

export const isEmailAllowed = (email: string | null | undefined): boolean => {
  if (!email) return false;
  return ALLOWED_EMAILS.includes(email.trim().toLowerCase());
};
