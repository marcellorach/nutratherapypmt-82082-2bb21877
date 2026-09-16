import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { APP_ROLES } from '@/config/app-roles';
import { ASSIGNABLE_ROLES } from '@/components/administrador/access/PlatformUsersPanel';

const MIGRATIONS_DIR = path.resolve(process.cwd(), 'supabase/migrations');

const migrationFiles = () =>
  fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

/** Lê o conteúdo das migrações em ordem cronológica (mais antiga primeiro). */
const migrationContents = () =>
  migrationFiles().map((f) => fs.readFileSync(path.join(MIGRATIONS_DIR, f), 'utf8'));

const parseRoleList = (raw: string): string[] =>
  raw
    .split(',')
    .map((s) => s.trim().replace(/^'/, '').replace(/'(::text)?$/, '').trim())
    .filter(Boolean);

/** Última definição vigente da CHECK constraint de user_roles. */
function latestCheckConstraintRoles(): string[] | null {
  const re = /CONSTRAINT\s+user_roles_role_check\s+CHECK\s*\(\s*role\s+IN\s*\(([^)]*)\)/gi;
  let found: string[] | null = null;
  for (const sql of migrationContents()) {
    for (const m of sql.matchAll(re)) found = parseRoleList(m[1]);
  }
  return found;
}

/** Última definição vigente das funções de validação de papel. */
function latestTriggerRoles(): Record<string, string[]> {
  const fnRe =
    /FUNCTION\s+public\.(validate_user_role|validate_role_name)\s*\(\)[\s\S]*?\$\$([\s\S]*?)\$\$/gi;
  const listRe = /NEW\.role\s+NOT\s+IN\s*\(([^)]*)\)/i;
  const found: Record<string, string[]> = {};
  for (const sql of migrationContents()) {
    for (const m of sql.matchAll(fnRe)) {
      const list = m[2].match(listRe);
      if (list) found[m[1].toLowerCase()] = parseRoleList(list[1]);
    }
  }
  return found;
}

const sorted = (xs: readonly string[]) => [...xs].sort();

describe('lista canônica de papéis', () => {
  it('a tela de usuários oferece exatamente os papéis canônicos', () => {
    expect(sorted(ASSIGNABLE_ROLES)).toEqual(sorted(APP_ROLES));
  });

  it('a CHECK constraint user_roles_role_check bate com a lista canônica', () => {
    const roles = latestCheckConstraintRoles();
    expect(roles, 'nenhuma migração define user_roles_role_check').not.toBeNull();
    expect(sorted(roles!)).toEqual(sorted(APP_ROLES));
  });

  it('os gatilhos de validação batem com a lista canônica e entre si', () => {
    const triggers = latestTriggerRoles();
    expect(Object.keys(triggers).length, 'nenhum gatilho de validação encontrado').toBeGreaterThan(0);
    for (const [name, roles] of Object.entries(triggers)) {
      expect(sorted(roles), `${name} divergiu da lista canônica`).toEqual(sorted(APP_ROLES));
    }
  });

  it('gatilho e CHECK constraint não divergem entre si', () => {
    const check = latestCheckConstraintRoles();
    const triggers = Object.values(latestTriggerRoles());
    for (const roles of triggers) {
      expect(sorted(roles)).toEqual(sorted(check!));
    }
  });
});
