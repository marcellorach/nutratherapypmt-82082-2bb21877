import React, { createContext, useContext, useEffect, useMemo } from 'react';
import i18n from '@/i18n';
import { getSiteVariant, getDefaultLanguageForVariant, type SiteVariant } from '@/lib/site-variant';

interface SiteVariantContextValue {
  variant: SiteVariant;
}

const SiteVariantContext = createContext<SiteVariantContextValue>({ variant: 'public' });

export const SiteVariantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const variant = useMemo(() => getSiteVariant(), []);

  useEffect(() => {
    // Apply variant default language only if user has no saved preference.
    const saved = typeof window !== 'undefined' ? localStorage.getItem('language') : null;
    if (!saved) {
      const lng = getDefaultLanguageForVariant(variant);
      if (i18n.language !== lng) i18n.changeLanguage(lng);
    }
    try { sessionStorage.setItem('entry-variant', variant); } catch {}
  }, [variant]);

  return (
    <SiteVariantContext.Provider value={{ variant }}>
      {children}
    </SiteVariantContext.Provider>
  );
};

export const useSiteVariant = () => useContext(SiteVariantContext);

export const useIsPetloveVariant = () => useContext(SiteVariantContext).variant === 'petlove';