// Shared helpers used by the duplicate-key guard script and its vitest test.
// Detects duplicate keys at any nesting level inside a JSON document.
// JSON.parse silently keeps the last value when keys collide, which has
// historically erased entire admin namespaces — see CHANGELOG.

export function findDuplicateKeys(text) {
  const dups = [];
  let i = 0;
  const n = text.length;

  function skipWs() { while (i < n && /\s/.test(text[i])) i++; }
  function parseString() {
    if (text[i] !== '"') throw new Error('expected string at ' + i);
    let s = ''; i++;
    while (i < n) {
      const c = text[i++];
      if (c === '\\') { s += c + text[i++]; continue; }
      if (c === '"') return JSON.parse('"' + s + '"');
      s += c;
    }
    throw new Error('unterminated string');
  }
  function parseValue(path) {
    skipWs();
    const c = text[i];
    if (c === '{') return parseObject(path);
    if (c === '[') return parseArray(path);
    if (c === '"') { parseString(); return; }
    while (i < n && !',}]\r\n\t '.includes(text[i])) i++;
  }
  function parseArray(path) {
    i++; skipWs();
    if (text[i] === ']') { i++; return; }
    let idx = 0;
    while (i < n) {
      parseValue(path + '[' + idx + ']');
      skipWs();
      if (text[i] === ',') { i++; idx++; skipWs(); continue; }
      if (text[i] === ']') { i++; return; }
      throw new Error('bad array at ' + i);
    }
  }
  function parseObject(path) {
    i++; skipWs();
    const seen = new Set();
    if (text[i] === '}') { i++; return; }
    while (i < n) {
      skipWs();
      const key = parseString();
      const fullPath = path ? path + '.' + key : key;
      if (seen.has(key)) dups.push(fullPath); else seen.add(key);
      skipWs();
      if (text[i] !== ':') throw new Error('expected : at ' + i);
      i++;
      parseValue(fullPath);
      skipWs();
      if (text[i] === ',') { i++; continue; }
      if (text[i] === '}') { i++; return; }
      throw new Error('bad object at ' + i + ' got ' + text[i]);
    }
  }

  parseValue('');
  return dups;
}

// Root namespaces that MUST exist in every locale. Add to this list when a new
// top-level namespace becomes a hard dependency of the UI. A missing entry
// here means a whole feature area renders literal "foo.bar.baz" keys.
export const REQUIRED_ROOT_NAMESPACES = [
  'common',
  'navbar',
  'admin',
  'petRegistration',
  'knowledgeGraph',
  'studies',
  'predictiveModels',
  'visualization',
];
