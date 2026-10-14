import en from './en.json';
import vi from './vi.json';

export type Language = 'en' | 'vi';

export const LOCALES: Record<Language, Record<string, string>> = {
  en,
  vi,
};

export type TranslationKey = keyof typeof en;
