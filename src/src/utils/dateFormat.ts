
// Formatos ofrecidos en el selector del editor de plantillas.
export const DATE_FORMATS = [
  "YYYY-MM-DD",
  "DD/MM/YYYY",
  "MM/DD/YYYY",
  "DD-MM-YYYY",
  "dddd, DD - MM",
  "DD, MMMM YYYY",
  "MMMM, YYYY",
  "DD de MMMM",
  "MMMM",
  "MMMM/YY",
] as const;

export const DATE_RANGE_FORMATS = [
  "YYYY-MM-DD",
  "DD/MM/YYYY",
  "MM/DD/YYYY",
  "DD-MM-YYYY",
  "dddd, DD - MM",
  "DD-DD, MMMM YYYY",
  "MMMM, YYYY",
  "DD de MMMM",
  "MMMM/YY",
] as const;

export const DEFAULT_DATE_FORMAT = "YYYY-MM-DD";

export const COMBINED_RANGE_FORMAT = "DD-DD, MMMM YYYY";

function capitalize(text: string, localeCode: string): string {
  if (!text) {
    return text;
  }

  return text.charAt(0).toLocaleUpperCase(localeCode) + text.slice(1);
}

type DateParts = {
  day: string;
  dayNumber: string;
  month: string;
  monthNumber: string;
  year: string;
  shortYear: string;
  dayName: string;
  monthName: string;
};

function getDateParts(date: Date, localeCode: string): DateParts {
  const dayNumber = date.getDate();
  const monthNumber = date.getMonth() + 1;
  const year = date.getFullYear();

  return {
    day: dayNumber.toString().padStart(2, "0"),
    dayNumber: dayNumber.toString(),
    month: monthNumber.toString().padStart(2, "0"),
    monthNumber: monthNumber.toString(),
    year: year.toString(),
    shortYear: year.toString().slice(-2),
    dayName: capitalize(
      date.toLocaleDateString(localeCode, { weekday: "long" }),
      localeCode,
    ),
    monthName: capitalize(
      date.toLocaleDateString(localeCode, { month: "long" }),
      localeCode,
    ),
  };
}

const FORMAT_TOKENS: [string, keyof DateParts][] = [
  ["dddd", "dayName"],
  ["MMMM", "monthName"],
  ["YYYY", "year"],
  ["YY", "shortYear"],
  ["MM", "month"],
  ["DD", "day"],
  ["M", "monthNumber"],
  ["D", "dayNumber"],
];

const TOKEN_PATTERN = new RegExp(
  `\\[([^\\]]*)\\]|${FORMAT_TOKENS.map(([token]) => token).join("|")}`,
  "g",
);


function applyFormatTemplate(
  template: string,
  parts: DateParts,
): string {
  return template.replace(TOKEN_PATTERN, (match, literal?: string) => {
    if (literal !== undefined) {
      return literal;
    }

    const token = FORMAT_TOKENS.find(([name]) => name === match);

    return token ? parts[token[1]] : match;
  });
}

export function formatDateWithPattern(
  date: Date,
  format: string,
  localeCode: string,
): string {
  const parts = getDateParts(date, localeCode);

  switch (format) {
    case "DD/MM/YYYY":
      return `${parts.day}/${parts.month}/${parts.year}`;
    case "MM/DD/YYYY":
      return `${parts.month}/${parts.day}/${parts.year}`;
    case "DD-MM-YYYY":
      return `${parts.day}-${parts.month}-${parts.year}`;
    case "dddd, DD - MM":
      return `${parts.dayName}, ${parts.day} - ${parts.month}`;
    case "DD, MMMM YYYY":
      return `${parts.day}, ${parts.monthName} ${parts.year}`;
    case "MMMM, YYYY":
      return `${parts.monthName}, ${parts.year}`;
    case "DD de MMMM":

      return new Intl.DateTimeFormat(localeCode, {
        day: "2-digit",
        month: "long",
      }).format(date);
    case "MMMM":
      return parts.monthName;
    case "MMMM/YY":
      return `${parts.monthName}/${parts.shortYear}`;
    case "YYYY-MM-DD":
      return `${parts.year}-${parts.month}-${parts.day}`;
    default:
      return applyFormatTemplate(format, parts);
  }
}

// Plantilla por defecto del rango: reproduce el separador que estaba fijo en el código.
export const DEFAULT_RANGE_TEMPLATE = "{start} - {end}";

const RANGE_TOKEN_PATTERN = /\{start\}|\{end\}/g;

/**
 * Resuelve la plantilla de un rango, por ejemplo "Ngày {start} – {end}".
 *
 * Aquí no hacen falta corchetes: las llaves ya delimitan los dos huecos, así
 * que todo lo demás es literal.
 */
export function applyRangeTemplate(
  template: string,
  start: string,
  end: string,
): string {
  return template.replace(RANGE_TOKEN_PATTERN, (match) =>
    match === "{start}" ? start : end,
  );
}

/*
 * Número del ítem dentro de su lista, 1-based, igual que las viñetas numeradas.
 *
 * Sirve en cualquier texto que se pinte dentro de un ítem: el valor, la
 * etiqueta, el formato de una fecha o la plantilla de un rango.
 */
const ITEM_NUMBER_TOKEN_PATTERN = /\{item\}/g;

export function applyItemNumberToken(
  text: string,
  itemNumber?: number,
): string {
  if (typeof itemNumber !== "number" || !text.includes("{item}")) {
    return text;
  }

  return text.replace(ITEM_NUMBER_TOKEN_PATTERN, String(itemNumber));
}

export function isKnownDateFormat(format: string): boolean {
  return (
    (DATE_FORMATS as readonly string[]).includes(format) ||
    (DATE_RANGE_FORMATS as readonly string[]).includes(format)
  );
}
