export type SiteVariant = 'petlove' | 'public';

/**
 * Determines which landing variant to render based on hostname.
 * - longevidade.ai (root)         → 'petlove' (default EN, includes PetLove refs)
 * - pet.longevidade.ai            → 'public'  (default PT, no PetLove refs)
 * - lovable previews              → 'public', overridable via ?variant=petlove
 */
export function getSiteVariant(): SiteVariant {
  if (typeof window === 'undefined') return 'public';

  const params = new URLSearchParams(window.location.search);
  const override = params.get('variant');
  if (override === 'petlove' || override === 'public') {
    try { sessionStorage.setItem('site-variant-override', override); } catch {}
    return override;
  }
  try {
    const stored = sessionStorage.getItem('site-variant-override');
    if (stored === 'petlove' || stored === 'public') return stored;
  } catch {}

  const host = window.location.hostname.toLowerCase();
  if (host.startsWith('pet.')) return 'public';
  if (host === 'longevidade.ai' || host === 'www.longevidade.ai') return 'petlove';
  return 'public';
}

export function getDefaultLanguageForVariant(v: SiteVariant): 'en' | 'pt' {
  return v === 'petlove' ? 'en' : 'pt';
}