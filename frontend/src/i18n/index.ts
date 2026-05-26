import ru from "./ru.json";
import en from "./en.json";

const dictionaries = { ru, en } as const;
export type Locale = keyof typeof dictionaries;

export function getDictionary(locale: Locale) {
  return dictionaries[locale] ?? dictionaries.ru;
}

type NestedKeys<T> = T extends object
  ? { [K in keyof T]: K extends string ? (T[K] extends object ? `${K}.${NestedKeys<T[K]>}` : K) : never }[keyof T]
  : never;

export type TranslationKey = NestedKeys<typeof ru>;

export function t(dict: typeof ru, key: string): string {
  const keys = key.split(".");
  let result: unknown = dict;
  for (const k of keys) {
    if (result && typeof result === "object" && k in result) {
      result = (result as Record<string, unknown>)[k];
    } else {
      return key;
    }
  }
  return typeof result === "string" ? result : key;
}
