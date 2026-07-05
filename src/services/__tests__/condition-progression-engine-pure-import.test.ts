import { describe, it, expect } from 'vitest';

/**
 * Regression guard: the pure core MUST be importable in Node without
 * triggering `ReferenceError: localStorage is not defined`. If someone
 * reintroduces `import { supabase } from '@/integrations/supabase/client'`
 * (or any transitive import that touches `localStorage`) into
 * `condition-progression-engine.pure.ts`, this test fails.
 *
 * We deliberately do NOT stub localStorage here — that's the whole point.
 */
describe('condition-progression-engine.pure — SSR/Node import safety', () => {
  it('imports cleanly without localStorage in globalThis', async () => {
    // Sanity: this Node runner has no browser globals.
    expect(typeof (globalThis as any).localStorage).toBe('undefined');

    const mod = await import('../condition-progression-engine.pure');
    expect(typeof mod.classifyCompound).toBe('function');
    expect(typeof mod.buildPointsFromRow).toBe('function');
    expect(typeof mod.pickBestCurve).toBe('function');
    expect(typeof mod.emptyBaselineOnly).toBe('function');
    expect(Array.isArray(mod.COMPOUND_CLASS_DICTIONARY)).toBe(true);
  });
});