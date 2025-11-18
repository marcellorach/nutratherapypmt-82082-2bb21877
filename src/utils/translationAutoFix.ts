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
 * Corrige missing keys automaticamente (client-side)
 */
export async function autoFixMissingKeys(): Promise<FixResult> {
  console.log('🔧 Starting client-side auto-fix for missing keys...');
  
  // 1. Carrega relatório de audit
  const reportResponse = await fetch('/translation-audit-report.json');
  if (!reportResponse.ok) {
    throw new Error('Failed to load audit report');
  }
  const report: AuditReport = await reportResponse.json();
  
  // 2. Carrega arquivos de tradução atuais
  const [ptResponse, enResponse] = await Promise.all([
    fetch('/locales/pt/translation.json'),
    fetch('/locales/en/translation.json')
  ]);
  
  if (!ptResponse.ok || !enResponse.ok) {
    throw new Error('Failed to load translation files');
  }
  
  const ptTranslations: TranslationObject = await ptResponse.json();
  const enTranslations: TranslationObject = await enResponse.json();
  
  // 3. Cria cópias para modificação
  const updatedPT = JSON.parse(JSON.stringify(ptTranslations));
  const updatedEN = JSON.parse(JSON.stringify(enTranslations));
  
  // 4. Processa missing keys
  const missingKeyIssues = report.issues.filter(issue => issue.type === 'missing-key');
  console.log(`Found ${missingKeyIssues.length} missing keys to fix`);
  
  let fixed = 0;
  let skipped = 0;
  const fixedKeys: string[] = [];
  
  // Extrai chaves únicas (remove duplicatas)
  const uniqueKeys = [...new Set(missingKeyIssues.map(issue => issue.text))];
  
  for (const key of uniqueKeys) {
    // Verifica se já existe em ambos os locales
    if (keyExists(updatedPT, key) && keyExists(updatedEN, key)) {
      console.log(`⏭️  Skipped (already exists): ${key}`);
      skipped++;
      continue;
    }
    
    // Gera tradução automática
    const translation = generateTranslation(key);
    
    // Adiciona nos dois locales
    if (!keyExists(updatedPT, key)) {
      addTranslationKey(updatedPT, key, translation.pt);
    }
    if (!keyExists(updatedEN, key)) {
      addTranslationKey(updatedEN, key, translation.en);
    }
    
    console.log(`✅ Fixed: ${key}`);
    console.log(`   EN: "${translation.en}" | PT: "${translation.pt}"`);
    
    fixed++;
    fixedKeys.push(key);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ Client-side auto-fix complete!`);
  console.log(`   Fixed: ${fixed} keys`);
  console.log(`   Skipped: ${skipped} keys (already exist)`);
  console.log('='.repeat(60));
  
  return { 
    fixed, 
    skipped, 
    keys: fixedKeys,
    updatedPT,
    updatedEN
  };
}

/**
 * Faz download dos arquivos de tradução atualizados
 */
export function downloadTranslationFiles(updatedPT: TranslationObject, updatedEN: TranslationObject): void {
  // Download PT
  const ptBlob = new Blob([JSON.stringify(updatedPT, null, 2)], { type: 'application/json' });
  const ptUrl = URL.createObjectURL(ptBlob);
  const ptLink = document.createElement('a');
  ptLink.href = ptUrl;
  ptLink.download = 'translation-pt.json';
  document.body.appendChild(ptLink);
  ptLink.click();
  document.body.removeChild(ptLink);
  URL.revokeObjectURL(ptUrl);
  
  // Download EN
  const enBlob = new Blob([JSON.stringify(updatedEN, null, 2)], { type: 'application/json' });
  const enUrl = URL.createObjectURL(enBlob);
  const enLink = document.createElement('a');
  enLink.href = enUrl;
  enLink.download = 'translation-en.json';
  document.body.appendChild(enLink);
  enLink.click();
  document.body.removeChild(enLink);
  URL.revokeObjectURL(enUrl);
  
  console.log('📥 Translation files downloaded successfully!');
  console.log('Please replace:');
  console.log('  - src/locales/pt/translation.json');
  console.log('  - src/locales/en/translation.json');
}
