/**
 * Sanitiza nome de arquivo para uso no Supabase Storage
 * - Remove/substitui caracteres especiais
 * - Substitui espaços por underscores
 * - Mantém extensão original
 * - Limita tamanho do nome
 */
export function sanitizeFileName(fileName: string): string {
  // Separar nome da extensão
  const lastDotIndex = fileName.lastIndexOf('.');
  const name = lastDotIndex > 0 ? fileName.slice(0, lastDotIndex) : fileName;
  const extension = lastDotIndex > 0 ? fileName.slice(lastDotIndex) : '';
  
  // Sanitizar nome
  let sanitized = name
    .normalize('NFD') // Normalizar caracteres unicode
    .replace(/[\u0300-\u036f]/g, '') // Remover diacríticos
    .replace(/[—–−]/g, '-') // Substituir diferentes tipos de dashes por hífen
    .replace(/\s+/g, '_') // Substituir espaços por underscores
    .replace(/[^a-zA-Z0-9._-]/g, '') // Remover outros caracteres especiais
    .replace(/_+/g, '_') // Remover underscores duplicados
    .replace(/^_|_$/g, ''); // Remover underscores no início/fim
  
  // Limitar tamanho (max 200 chars + extensão)
  if (sanitized.length > 200) {
    sanitized = sanitized.slice(0, 200);
  }
  
  return sanitized + extension;
}

/**
 * Cria um nome de arquivo seguro com UUID + nome sanitizado
 */
export function createSafeStoragePath(uuid: string, fileName: string, folder: string = 'studies'): string {
  const sanitized = sanitizeFileName(fileName);
  return `${folder}/${uuid}_${sanitized}`;
}
