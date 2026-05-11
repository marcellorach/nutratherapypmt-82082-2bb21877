import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  findDuplicateKeys,
  REQUIRED_ROOT_NAMESPACES,
} from '../lib/translation-validation.mjs';

const LOCALES = [
  { lng: 'pt', path: 'src/locales/pt/translation.json' },
  { lng: 'en', path: 'src/locales/en/translation.json' },
];

function load(p) {
  return readFileSync(resolve(process.cwd(), p), 'utf8');
}

describe('translation JSON integrity', () => {
  describe.each(LOCALES)('$lng — $path', ({ path }) => {
    const text = load(path);
    const json = JSON.parse(text);

    it('has no duplicate keys at any nesting level', () => {
      // Duplicate keys at the same level (e.g. two top-level "admin" blocks)
      // make JSON.parse silently keep only the last value, erasing entire
      // namespaces and surfacing literal "admin.foo.bar" strings in the UI.
      expect(findDuplicateKeys(text)).toEqual([]);
    });

    it.each(REQUIRED_ROOT_NAMESPACES)(
      'declares required root namespace "%s"',
      (ns) => {
        expect(json[ns], `missing root namespace "${ns}" in ${path}`).toBeTypeOf('object');
        expect(json[ns]).not.toBeNull();
      },
    );
  });

  it('PT and EN expose the same set of root namespaces', () => {
    const [pt, en] = LOCALES.map(({ path }) => Object.keys(JSON.parse(load(path))).sort());
    expect(pt).toEqual(en);
  });
});
