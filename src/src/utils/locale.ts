export const SUPPORTED_APP_LOCALES = ["es", "en", "vi"] as const;

export type AppLocale = (typeof SUPPORTED_APP_LOCALES)[number];

const SPANISH_MONTH_NAMES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

const SUPPORTED_DATE_LOCALES = ["es-ES", "en-US", "vi-VN"] as const;

function normalizeLabel(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isSupportedLocale(
  value: string | null | undefined,
): value is AppLocale {
  return Boolean(value) && SUPPORTED_APP_LOCALES.includes(value as AppLocale);
}

export function resolveAppLocale(
  pathname: string | null | undefined,
  fallbackLocale: string | null | undefined,
): AppLocale {
  const pathLocale = pathname?.split("/")[1]?.toLowerCase();
  if (isSupportedLocale(pathLocale)) {
    return pathLocale;
  }

  const normalizedFallback = fallbackLocale?.toLowerCase();
  if (isSupportedLocale(normalizedFallback)) {
    return normalizedFallback;
  }

  return "es";
}

export function toDateLocaleCode(locale: string): string {
  switch (locale) {
    case "es":
      return "es-ES";
    case "vi":
      return "vi-VN";
    case "en":
    default:
      return "en-US";
  }
}

export function getLocalizedMonthNames(
  localeCode: string,
  format: "long" | "short" = "long",
): string[] {
  const formatter = new Intl.DateTimeFormat(localeCode, { month: format });
  return Array.from({ length: 12 }, (_, monthIndex) =>
    formatter.format(new Date(2024, monthIndex, 1)),
  );
}

export function getLocalizedWeekdayLabels(
  localeCode: string,
  format: "short" | "narrow" = "short",
): string[] {
  const formatter = new Intl.DateTimeFormat(localeCode, { weekday: format });
  const firstSunday = new Date(2024, 0, 7);

  return Array.from({ length: 7 }, (_, index) => {
    const label = formatter.format(
      new Date(2024, 0, firstSunday.getDate() + index),
    );
    return label.replace(/\.$/, "");
  });
}

export function getMonthIndexFromName(
  monthValue: string | undefined | null,
): number | null {
  if (!monthValue) {
    return null;
  }

  const trimmedValue = monthValue.trim();
  if (/^\d{1,2}$/.test(trimmedValue)) {
    const numericMonth = Number.parseInt(trimmedValue, 10);
    if (numericMonth >= 1 && numericMonth <= 12) {
      return numericMonth - 1;
    }
  }

  if (/^\d{4}-\d{2}$/.test(trimmedValue)) {
    const numericMonth = Number.parseInt(trimmedValue.split("-")[1], 10);
    if (numericMonth >= 1 && numericMonth <= 12) {
      return numericMonth - 1;
    }
  }

  const normalizedValue = normalizeLabel(trimmedValue);
  const normalizedSpanishNames = SPANISH_MONTH_NAMES.map(normalizeLabel);
  const spanishIndex = normalizedSpanishNames.indexOf(normalizedValue);
  if (spanishIndex !== -1) {
    return spanishIndex;
  }

  for (const localeCode of SUPPORTED_DATE_LOCALES) {
    const longNames = getLocalizedMonthNames(localeCode, "long").map(
      normalizeLabel,
    );
    const shortNames = getLocalizedMonthNames(localeCode, "short").map(
      normalizeLabel,
    );

    const longIndex = longNames.indexOf(normalizedValue);
    if (longIndex !== -1) {
      return longIndex;
    }

    const shortIndex = shortNames.indexOf(normalizedValue);
    if (shortIndex !== -1) {
      return shortIndex;
    }
  }

  return null;
}

export function getCanonicalSpanishMonthName(monthIndex: number): string {
  return SPANISH_MONTH_NAMES[monthIndex] || SPANISH_MONTH_NAMES[0];
}

export function getMonthNameByIndex(
  monthIndex: number,
  localeCode: string,
  format: "long" | "short" = "long",
): string {
  if (monthIndex < 0 || monthIndex > 11) {
    return "";
  }

  return new Intl.DateTimeFormat(localeCode, { month: format }).format(
    new Date(2024, monthIndex, 1),
  );
}

export function getLocaleDatePattern(localeCode: string): string {
  const formatter = new Intl.DateTimeFormat(localeCode);
  const parts = formatter.formatToParts(new Date(2001, 10, 22));

  return parts
    .map((part) => {
      if (part.type === "day") return "DD";
      if (part.type === "month") return "MM";
      if (part.type === "year") return "YYYY";
      return part.value;
    })
    .join("")
    .replace(/\u200f/g, "");
}
