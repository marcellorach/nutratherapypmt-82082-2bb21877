/**
 * Client-side Translation Auto-Fix Utility
 * Runs entirely in the browser without needing Edge Functions
 */

import { termDictionary, formatKeySegment } from './translationDictionary';

interface AuditIssue {
  type: 'missing-key' | 'hardcoded' | 'incomplete-translation';
  file: string;
  line: number;
  text: string;
  severity: 'error' | 'warning';
}

interface AuditReport {
  timestamp: string;
  summary: {
    totalFiles: number;
    totalIssues: number;
    missingKeys: number;
    hardcodedTexts: number;
    incompleteTranslations: number;
  };
  issues: AuditIssue[];
}

interface TranslationObject {
  [key: string]: string | TranslationObject;
}

interface FixResult {
  fixed: number;
  skipped: number;
  keys: string[];
  updatedPT: TranslationObject;
  updatedEN: TranslationObject;
}

/**
 * Gera tradução automática para uma chave
 */
function generateTranslation(key: string): { en: string; pt: string } {
  const segments = key.split('.');
  const lastSegment = segments[segments.length - 1];
  
  // Verifica se existe no dicionário
  if (termDictionary[lastSegment]) {
    return termDictionary[lastSegment];
  }
  
  // Fallback: formata o último segmento
  const formatted = formatKeySegment(lastSegment);
  
  return {
    en: formatted,
    pt: formatted, // Mantém em inglês para revisão manual posterior
  };
}

/**
 * Adiciona uma chave de tradução no objeto, criando estrutura hierárquica
 */
function addTranslationKey(obj: TranslationObject, key: string, value: string): void {
  const parts = key.split('.');
  let current: any = obj;
  
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!current[part] || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part];
  }
  
  const lastPart = parts[parts.length - 1];
  // Só adiciona se não existir
  if (!current[lastPart]) {
    current[lastPart] = value;
  }
}

/**
 * Verifica se uma chave já existe no objeto
 */
function keyExists(obj: TranslationObject, key: string): boolean {
  const parts = key.split('.');
  let current: any = obj;
  
  for (const part of parts) {
    if (!current[part]) {
      return false;
    }
    current = current[part];
  }
  
  return true;
}

/**
 * Corrige missing keys automaticamente inserindo no banco de dados Supabase
 */
export async function autoFixMissingKeys(): Promise<FixResult> {
  console.log('🔧 Starting database-backed auto-fix for missing keys...');
  
  // Importa supabase dinamicamente para evitar problemas de SSR
  const { supabase } = await import('@/integrations/supabase/client');
  
  // 1. Carrega relatório de audit
  const reportResponse = await fetch('/translation-audit-report.json');
  if (!reportResponse.ok) {
    throw new Error('Failed to load audit report');
  }
  const report: AuditReport = await reportResponse.json();
  
  // 2. Carrega traduções existentes do banco
  const { data: existingTranslations } = await supabase
    .from('translations')
    .select('key, locale');
  
  const existingKeys = new Set(
    existingTranslations?.map(t => `${t.key}::${t.locale}`) || []
  );
  
  // 3. Processa missing keys
  const missingKeyIssues = report.issues.filter(issue => issue.type === 'missing-key');
  console.log(`Found ${missingKeyIssues.length} missing keys to fix`);
  
  let fixed = 0;
  let skipped = 0;
  const fixedKeys: string[] = [];
  
  // Extrai chaves únicas (remove duplicatas)
  const uniqueKeys = [...new Set(missingKeyIssues.map(issue => issue.text))];
  
  // Prepara batch de inserções
  const translationsToInsert: Array<{
    key: string;
    locale: string;
    value: string;
  }> = [];
  
  for (const key of uniqueKeys) {
    // Verifica se já existe no banco
    const existsInPT = existingKeys.has(`${key}::pt`);
    const existsInEN = existingKeys.has(`${key}::en`);
    
    if (existsInPT && existsInEN) {
      console.log(`⏭️  Skipped (already exists in DB): ${key}`);
      skipped++;
      continue;
    }
    
    // Gera tradução automática
    const translation = generateTranslation(key);
    
    // Adiciona à lista de inserções
    if (!existsInPT) {
      translationsToInsert.push({
        key,
        locale: 'pt',
        value: translation.pt
      });
    }
    if (!existsInEN) {
      translationsToInsert.push({
        key,
        locale: 'en',
        value: translation.en
      });
    }
    
    console.log(`✅ Prepared: ${key}`);
    console.log(`   EN: "${translation.en}" | PT: "${translation.pt}"`);
    
    fixed++;
    fixedKeys.push(key);
  }
  
  // 4. Insere todas as traduções no banco usando upsert
  if (translationsToInsert.length > 0) {
    console.log(`\n📤 Inserting ${translationsToInsert.length} translations into database...`);
    
    const { error: insertError } = await supabase
      .from('translations')
      .upsert(translationsToInsert, {
        onConflict: 'key,locale',
        ignoreDuplicates: false
      });
    
    if (insertError) {
      console.error('❌ Error inserting translations:', insertError);
      throw new Error(`Failed to insert translations: ${insertError.message}`);
    }
    
    console.log('✅ All translations inserted successfully!');
    
    // Incrementa versão para invalidar cache
    const { error: versionError } = await supabase
      .rpc('increment_translation_version');
    
    if (versionError) {
      console.warn('⚠️ Warning: Could not increment version:', versionError.message);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ Database auto-fix complete!`);
  console.log(`   Fixed: ${fixed} keys (${translationsToInsert.length} translations)`);
  console.log(`   Skipped: ${skipped} keys (already exist)`);
  console.log(`   🔄 Translations will update automatically via realtime`);
  console.log('='.repeat(60));
  
  return { 
    fixed, 
    skipped, 
    keys: fixedKeys,
    updatedPT: {}, // Não mais necessário
    updatedEN: {}  // Não mais necessário
  };
}

/**
 * DEPRECATED: Não mais necessário com sistema de banco de dados
 * As traduções são atualizadas automaticamente via Supabase Realtime
 */
export function downloadTranslationFiles(updatedPT: TranslationObject, updatedEN: TranslationObject): void {
  console.log('⚠️ downloadTranslationFiles está deprecated - traduções já estão no banco de dados');
}
