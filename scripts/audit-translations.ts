#!/usr/bin/env tsx

/**
 * Translation Audit Script
 * 
 * Scans all .tsx/.ts files to detect:
 * 1. Hardcoded texts (not using t())
 * 2. t() calls with non-existent keys
 * 3. Missing translations (keys in one locale but not the other)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface AuditIssue {
  type: 'hardcoded' | 'missing-key' | 'incomplete-translation';
  file: string;
  line: number;
  text: string;
  severity: 'high' | 'medium' | 'low';
}

interface AuditReport {
  timestamp: string;
  summary: {
    totalFiles: number;
    totalIssues: number;
    hardcodedTexts: number;
    missingKeys: number;
    incompleteTranslations: number;
  };
  issues: AuditIssue[];
}

const EXCLUDED_DIRS = ['node_modules', 'dist', 'build', '.git', 'scripts', 'supabase'];
const EXCLUDED_FILES = ['vite-env.d.ts', 'types.ts', 'client.ts'];

// Load translation files
const ptTranslations = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../src/locales/pt/translation.json'), 'utf-8')
);
const enTranslations = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../src/locales/en/translation.json'), 'utf-8')
);

function getAllKeys(obj: any, prefix = ''): string[] {
  let keys: string[] = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys = keys.concat(getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

const ptKeys = new Set(getAllKeys(ptTranslations));
const enKeys = new Set(getAllKeys(enTranslations));

function scanDirectory(dir: string, issues: AuditIssue[]): number {
  let fileCount = 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!EXCLUDED_DIRS.includes(entry.name)) {
        fileCount += scanDirectory(fullPath, issues);
      }
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      if (!EXCLUDED_FILES.includes(entry.name)) {
        scanFile(fullPath, issues);
        fileCount++;
      }
    }
  }

  return fileCount;
}

function scanFile(filePath: string, issues: AuditIssue[]) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const relativePath = path.relative(path.join(__dirname, '..'), filePath);

  // Skip files that don't use useTranslation
  if (!content.includes('useTranslation') && !content.includes('import i18next')) {
    return;
  }

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    // Detect t() calls with potential missing keys
    const tCallRegex = /t\(['"`]([^'"`]+)['"`]\)/g;
    let match;
    while ((match = tCallRegex.exec(line)) !== null) {
      const key = match[1];
      if (!ptKeys.has(key) || !enKeys.has(key)) {
        issues.push({
          type: 'missing-key',
          file: relativePath,
          line: lineNumber,
          text: key,
          severity: 'high'
        });
      }
    }

    // Detect hardcoded texts in JSX (simple heuristic)
    // This is a basic check - can be improved
    if (line.includes('>') && line.includes('<') && !line.includes('t(')) {
      const jsxTextRegex = />([A-Z][a-zA-Z\s]{3,})</g;
      let textMatch;
      while ((textMatch = jsxTextRegex.exec(line)) !== null) {
        const text = textMatch[1].trim();
        // Ignore common JSX patterns
        if (text.length > 3 && 
            !text.includes('{') && 
            !text.includes('Component') &&
            !text.includes('Props') &&
            !text.match(/^[A-Z][a-z]+$/)) {
          issues.push({
            type: 'hardcoded',
            file: relativePath,
            line: lineNumber,
            text: text,
            severity: 'medium'
          });
        }
      }
    }
  });
}

function findIncompleteTranslations(): AuditIssue[] {
  const issues: AuditIssue[] = [];
  
  // Keys in PT but not in EN
  ptKeys.forEach(key => {
    if (!enKeys.has(key)) {
      issues.push({
        type: 'incomplete-translation',
        file: 'src/locales/en/translation.json',
        line: 0,
        text: `Missing EN translation for: ${key}`,
        severity: 'high'
      });
    }
  });

  // Keys in EN but not in PT
  enKeys.forEach(key => {
    if (!ptKeys.has(key)) {
      issues.push({
        type: 'incomplete-translation',
        file: 'src/locales/pt/translation.json',
        line: 0,
        text: `Missing PT translation for: ${key}`,
        severity: 'high'
      });
    }
  });

  return issues;
}

function generateReport(): AuditReport {
  console.log('🔍 Starting translation audit...\n');

  const issues: AuditIssue[] = [];
  const srcPath = path.join(__dirname, '../src');
  
  const totalFiles = scanDirectory(srcPath, issues);
  const incompleteIssues = findIncompleteTranslations();
  issues.push(...incompleteIssues);

  const report: AuditReport = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles,
      totalIssues: issues.length,
      hardcodedTexts: issues.filter(i => i.type === 'hardcoded').length,
      missingKeys: issues.filter(i => i.type === 'missing-key').length,
      incompleteTranslations: issues.filter(i => i.type === 'incomplete-translation').length
    },
    issues: issues.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    })
  };

  return report;
}

function printReport(report: AuditReport) {
  console.log('📊 AUDIT SUMMARY');
  console.log('================');
  console.log(`Total files scanned: ${report.summary.totalFiles}`);
  console.log(`Total issues found: ${report.summary.totalIssues}`);
  console.log(`  - Hardcoded texts: ${report.summary.hardcodedTexts}`);
  console.log(`  - Missing keys: ${report.summary.missingKeys}`);
  console.log(`  - Incomplete translations: ${report.summary.incompleteTranslations}`);
  console.log('');

  if (report.summary.totalIssues === 0) {
    console.log('✅ No issues found! All translations are in order.');
    return;
  }

  console.log('🔴 ISSUES FOUND:');
  console.log('================\n');

  const grouped = {
    'missing-key': report.issues.filter(i => i.type === 'missing-key'),
    'hardcoded': report.issues.filter(i => i.type === 'hardcoded'),
    'incomplete-translation': report.issues.filter(i => i.type === 'incomplete-translation')
  };

  if (grouped['missing-key'].length > 0) {
    console.log('❌ Missing Translation Keys:');
    grouped['missing-key'].slice(0, 10).forEach(issue => {
      console.log(`  ${issue.file}:${issue.line} - "${issue.text}"`);
    });
    if (grouped['missing-key'].length > 10) {
      console.log(`  ... and ${grouped['missing-key'].length - 10} more`);
    }
    console.log('');
  }

  if (grouped['hardcoded'].length > 0) {
    console.log('⚠️  Hardcoded Texts:');
    grouped['hardcoded'].slice(0, 10).forEach(issue => {
      console.log(`  ${issue.file}:${issue.line} - "${issue.text}"`);
    });
    if (grouped['hardcoded'].length > 10) {
      console.log(`  ... and ${grouped['hardcoded'].length - 10} more`);
    }
    console.log('');
  }

  if (grouped['incomplete-translation'].length > 0) {
    console.log('🌍 Incomplete Translations:');
    grouped['incomplete-translation'].forEach(issue => {
      console.log(`  ${issue.text}`);
    });
    console.log('');
  }
}

// Main execution
const report = generateReport();
printReport(report);

// Save report to file
const reportPath = path.join(__dirname, '../translation-audit-report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`\n📝 Full report saved to: ${reportPath}`);

process.exit(report.summary.totalIssues > 0 ? 1 : 0);
