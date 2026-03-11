/**
 * File Hash Utilities
 * Calculates SHA-256 hash of files using Web Crypto API for duplicate detection
 */

export async function calculateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export interface DuplicateCheckResult {
  type: 'exact' | 'similar' | 'none';
  existingStudy?: {
    id: string;
    title: string;
    study_id: string;
    kanban_status: string;
    original_filename: string;
  };
  similarity?: number;
}
