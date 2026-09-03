export const locales = ["vi", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "vi";

export const languages: ReadonlyArray<{
  locale: Locale;
  label: string;
  shortLabel: string;
}> = [
  { locale: "vi", label: "Tiếng Việt", shortLabel: "VI" },
  { locale: "en", label: "English", shortLabel: "EN" },
];

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}
