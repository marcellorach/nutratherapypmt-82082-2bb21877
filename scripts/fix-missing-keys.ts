import * as fs from 'fs';
import * as path from 'path';
import { generateTranslation } from './translation-dictionary';

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

/**
 * Lê o relatório de auditoria
 */
function loadAuditReport(): AuditReport {
  const reportPath = path.join(process.cwd(), 'public', 'translation-audit-report.json');
  const content = fs.readFileSync(reportPath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Lê arquivo de tradução JSON
 */
function loadTranslationFile(locale: string): Record<string, any> {
  const filePath = path.join(process.cwd(), 'src', 'locales', locale, 'translation.json');
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Salva arquivo de tradução JSON
 */
function saveTranslationFile(locale: string, data: Record<string, any>): void {
  const filePath = path.join(process.cwd(), 'src', 'locales', locale, 'translation.json');
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

/**
 * Adiciona uma chave de tradução no objeto, criando estrutura hierárquica
 */
function addTranslationKey(obj: Record<string, any>, key: string, value: string): void {
  const parts = key.split('.');
  let current = obj;
  
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
function keyExists(obj: Record<string, any>, key: string): boolean {
  const parts = key.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (!current[part]) {
      return false;
    }
    current = current[part];
  }
  
  return true;
}

/**
 * Incrementa a versão do i18n
 */
function incrementI18nVersion(): void {
  const i18nPath = path.join(process.cwd(), 'src', 'i18n.ts');
  let content = fs.readFileSync(i18nPath, 'utf-8');
  
  // Encontra a linha com currentVersion e incrementa
  const versionRegex = /const currentVersion = '(\d+)\.(\d+)\.(\d+)'/;
  const match = content.match(versionRegex);
  
  if (match) {
    const [, major, minor, patch] = match;
    const newPatch = parseInt(patch) + 1;
    const newVersion = `${major}.${minor}.${newPatch}`;
    content = content.replace(versionRegex, `const currentVersion = '${newVersion}'`);
    fs.writeFileSync(i18nPath, content, 'utf-8');
    console.log(`✅ i18n version incremented to ${newVersion}`);
  }
}

/**
 * Corrige missing keys automaticamente
 */
function fixMissingKeys(): { fixed: number; skipped: number; keys: string[] } {
  console.log('🔧 Starting auto-fix for missing keys...\n');
  
  // Carrega relatório
  const report = loadAuditReport();
  const missingKeyIssues = report.issues.filter(issue => issue.type === 'missing-key');
  
  console.log(`Found ${missingKeyIssues.length} missing keys to fix\n`);
  
  // Carrega arquivos de tradução
  const ptTranslations = loadTranslationFile('pt');
  const enTranslations = loadTranslationFile('en');
  
  let fixed = 0;
  let skipped = 0;
  const fixedKeys: string[] = [];
  
  // Extrai chaves únicas (remove duplicatas)
  const uniqueKeys = [...new Set(missingKeyIssues.map(issue => issue.text))];
  
  for (const key of uniqueKeys) {
    // Verifica se já existe em ambos os locales
    if (keyExists(ptTranslations, key) && keyExists(enTranslations, key)) {
      console.log(`⏭️  Skipped (already exists): ${key}`);
      skipped++;
      continue;
    }
    
    // Gera tradução automática
    const translation = generateTranslation(key);
    
    // Adiciona nos dois locales
    if (!keyExists(ptTranslations, key)) {
      addTranslationKey(ptTranslations, key, translation.pt);
    }
    if (!keyExists(enTranslations, key)) {
      addTranslationKey(enTranslations, key, translation.en);
    }
    
    console.log(`✅ Fixed: ${key}`);
    console.log(`   EN: "${translation.en}" | PT: "${translation.pt}"\n`);
    
    fixed++;
    fixedKeys.push(key);
  }
  
  // Salva arquivos atualizados
  saveTranslationFile('pt', ptTranslations);
  saveTranslationFile('en', enTranslations);
  
  // Incrementa versão do i18n
  incrementI18nVersion();
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ Auto-fix complete!`);
  console.log(`   Fixed: ${fixed} keys`);
  console.log(`   Skipped: ${skipped} keys (already exist)`);
  console.log('='.repeat(60) + '\n');
  
  return { fixed, skipped, keys: fixedKeys };
}

// Executa se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const result = fixMissingKeys();
    
    // Retorna JSON para consumo da Edge Function
    console.log('\n📊 RESULT_JSON:', JSON.stringify(result));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing missing keys:', error);
    process.exit(1);
  }
}

export { fixMissingKeys };
