import React, { createContext, useContext, useMemo } from 'react';
import type { Lex4Translations } from './types';
import { DEFAULT_TRANSLATIONS } from './defaults';

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

function deepMerge<T>(
  target: T,
  source: DeepPartial<T>,
): T {
  if (typeof target !== 'object' || target === null) {
    return (source ?? target) as T;
  }
  const result = { ...target } as Record<string, unknown>;
  for (const key of Object.keys(source as Record<string, unknown>)) {
    const sourceVal = (source as Record<string, unknown>)[key];
    const targetVal = (target as Record<string, unknown>)[key];
    if (
      sourceVal !== undefined &&
      typeof sourceVal === 'object' &&
      sourceVal !== null &&
      !Array.isArray(sourceVal) &&
      typeof targetVal === 'object' &&
      targetVal !== null
    ) {
      result[key] = deepMerge(targetVal, sourceVal as DeepPartial<typeof targetVal>);
    } else if (sourceVal !== undefined) {
      result[key] = sourceVal;
    }
  }
  return result as T;
}

const TranslationsContext = createContext<Lex4Translations>(DEFAULT_TRANSLATIONS);

/**
 * Returns the active translations. Use inside any editor component
 * to access localized strings.
 */
export function useTranslations(): Lex4Translations {
  return useContext(TranslationsContext);
}

/**
 * Interpolates `{{key}}` placeholders in a translation string.
 *
 * @example
 * interpolate('Font changed to {{value}}', { value: 'Inter' })
 * // => 'Font changed to Inter'
 */
export function interpolate(
  template: string,
  params: Record<string, string | number>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    String(params[key] ?? `{{${key}}}`),
  );
}

interface TranslationsProviderProps {
  translations?: DeepPartial<Lex4Translations>;
  children: React.ReactNode;
}

/**
 * TranslationsProvider — merges consumer overrides with DEFAULT_TRANSLATIONS.
 */
export const TranslationsProvider: React.FC<TranslationsProviderProps> = ({
  translations,
  children,
}) => {
  const merged = useMemo(
    () =>
      translations
        ? deepMerge(DEFAULT_TRANSLATIONS, translations)
        : DEFAULT_TRANSLATIONS,
    [translations],
  );

  return (
    <TranslationsContext.Provider value={merged}>
      {children}
    </TranslationsContext.Provider>
  );
};
