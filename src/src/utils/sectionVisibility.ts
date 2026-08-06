import type { CreateTemplateData, Field, Section } from "@/types/template";

type SectionLike = Section & {
  skippable?: boolean;
  repeatable_pages?: Array<{
    header_config?: Section["header_config"];
    footer_config?: Section["footer_config"];
    blocks?: Section["blocks"];
  }>;
};

const RESERVED_VALUE_KEYS = new Set([
  "__highlight",
  "__selected",
  "__expanded",
]);

const decodePossibleText = (value: string): string => {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  try {
    return decodeURIComponent(trimmed).trim();
  } catch {
    return trimmed;
  }
};

const tryParseStructuredString = (value: string): unknown => {
  const decoded = decodePossibleText(value);

  if (!decoded) {
    return "";
  }

  const looksStructured =
    (decoded.startsWith("[") && decoded.endsWith("]")) ||
    (decoded.startsWith("{") && decoded.endsWith("}"));

  if (!looksStructured) {
    return decoded;
  }

  try {
    return JSON.parse(decoded);
  } catch {
    return decoded;
  }
};

export const hasMeaningfulBulletinValue = (value: unknown): boolean => {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === "string") {
    const parsed = tryParseStructuredString(value);

    if (parsed !== value && typeof parsed !== "string") {
      return hasMeaningfulBulletinValue(parsed);
    }

    return decodePossibleText(value).length > 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (value instanceof Date) {
    return !Number.isNaN(value.getTime());
  }

  if (Array.isArray(value)) {
    return value.some(hasMeaningfulBulletinValue);
  }

  if (typeof value === "object") {
    const objectValue = value as Record<string, unknown>;

    const knownCollections = [
      objectValue.selectedCards,
      objectValue.selected_cards,
      objectValue.cards,
    ];

    for (const collection of knownCollections) {
      if (Array.isArray(collection)) {
        return collection.some(hasMeaningfulBulletinValue);
      }
    }

    return Object.entries(objectValue).some(([key, nestedValue]) => {
      if (RESERVED_VALUE_KEYS.has(key) || key.startsWith("__")) {
        return false;
      }

      return hasMeaningfulBulletinValue(nestedValue);
    });
  }

  return false;
};

const isEditableBulletinField = (field: Field): boolean =>
  field.form === true && field.bulletin !== false;

export const isBulletinFieldFilled = (field: Field): boolean => {
  if (!isEditableBulletinField(field)) {
    return false;
  }

  if (field.type === "list") {
    const items = Array.isArray(field.value) ? field.value : [];
    const itemSchema = field.field_config?.item_schema || {};
    const editableSchemaEntries = Object.entries(itemSchema).filter(
      ([, nestedField]) =>
        nestedField.form !== false && nestedField.bulletin !== false,
    );

    if (editableSchemaEntries.length === 0) {
      return items.some(hasMeaningfulBulletinValue);
    }

    return items.some((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return hasMeaningfulBulletinValue(item);
      }

      const itemValue = item as Record<string, unknown>;

      return editableSchemaEntries.some(([schemaKey, nestedDefinition]) =>
        isBulletinFieldFilled({
          ...nestedDefinition,
          value: itemValue[schemaKey] as Field["value"],
        } as Field),
      );
    });
  }

  if (field.type === "card") {
    const value = field.value as unknown;

    if (typeof value === "string") {
      return hasMeaningfulBulletinValue(tryParseStructuredString(value));
    }

    return hasMeaningfulBulletinValue(value);
  }

  return hasMeaningfulBulletinValue(field.value);
};

const hasFilledField = (fields?: Field[]): boolean =>
  Boolean(fields?.some(isBulletinFieldFilled));

const hasFilledPageContent = (
  page: NonNullable<SectionLike["repeatable_pages"]>[number],
  section: SectionLike,
): boolean => {
  const headerConfig = page.header_config || section.header_config;
  const footerConfig = page.footer_config || section.footer_config;
  const blocks = page.blocks || section.blocks || [];

  return (
    hasFilledField(headerConfig?.fields) ||
    blocks.some((block) => hasFilledField(block.fields)) ||
    hasFilledField(footerConfig?.fields)
  );
};

export const sectionHasUserContent = (
  section?: SectionLike | null,
): boolean => {
  if (!section) {
    return false;
  }

  if (
    section.repeatable === true &&
    Array.isArray(section.repeatable_pages) &&
    section.repeatable_pages.length > 0
  ) {
    return section.repeatable_pages.some((page) =>
      hasFilledPageContent(page, section),
    );
  }

  return (
    hasFilledField(section.header_config?.fields) ||
    (section.blocks || []).some((block) => hasFilledField(block.fields)) ||
    hasFilledField(section.footer_config?.fields)
  );
};

export const isEmptySkippableSection = (
  section?: SectionLike | null,
): boolean => Boolean(section?.skippable) && !sectionHasUserContent(section);

export const shouldRenderBulletinSection = (
  section?: SectionLike | null,
): boolean => Boolean(section) && !isEmptySkippableSection(section);

export const filterRenderableSections = <T extends SectionLike>(
  sections: T[],
): T[] => sections.filter(shouldRenderBulletinSection);

export const filterTemplateDataForOutput = (
  data: CreateTemplateData,
): CreateTemplateData => ({
  ...data,
  version: {
    ...data.version,
    content: {
      ...data.version.content,
      sections: filterRenderableSections(
        data.version.content.sections as SectionLike[],
      ) as Section[],
    },
  },
});
