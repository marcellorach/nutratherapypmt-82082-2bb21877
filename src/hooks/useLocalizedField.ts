
import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';

/**
 * Hook to get localized field values from database entities.
 * Entities in the DB have `name` (PT) and `name_en` (EN) fields.
 * This hook returns a helper that picks the right field based on current language.
 * 
 * Usage:
 *   const { localizedField } = useLocalizedField();
 *   localizedField(entity, 'name');        // returns entity.name or entity.name_en
 *   localizedField(entity, 'description'); // returns entity.description or entity.description_en
 */
export function useLocalizedField() {
  const { i18n } = useTranslation();
  const isEnglish = i18n.language?.startsWith('en');

  const localizedField = useCallback(
    (entity: any, field: string, fallback?: string): string => {
      if (!entity) return fallback || '';
      
      if (isEnglish) {
        // Try English field first, fall back to default (PT)
        const enValue = entity[`${field}_en`];
        if (enValue) return enValue;
      }
      
      // Default field (Portuguese)
      return entity[field] || fallback || '';
    },
    [isEnglish]
  );

  return { localizedField, isEnglish };
}
