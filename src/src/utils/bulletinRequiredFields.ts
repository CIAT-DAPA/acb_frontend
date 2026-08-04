import type {
  BulletinSection,
  BulletinSectionPage,
  CreateBulletinData,
} from "@/types/bulletin";
import type { Field } from "@/types/template";

export const BULLETIN_NAME_VALIDATION_ID = "__bulletin_name__";
export const BULLETIN_SLUG_VALIDATION_ID = "__bulletin_name_machine__";

export interface RequiredFieldIssue {
  key: string;
  fieldId: string;
  label: string;
  path: string;
  pageIndex?: number;
}

export interface RequiredFieldValidationResult {
  isValid: boolean;
  issues: RequiredFieldIssue[];
  invalidFieldIds: string[];
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isPlainRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value) &&
  !(value instanceof Date);

/**
 * Checks whether a value contains user-provided information.
 * Important details:
 * - 0 and false are valid values.
 * - Empty strings, empty arrays and empty objects are invalid.
 * - Arrays/objects must contain at least one meaningful nested value.
 */
export const hasMeaningfulFieldValue = (value: unknown): boolean => {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  if (typeof value === "boolean") {
    return true;
  }

  if (value instanceof Date) {
    return !Number.isNaN(value.getTime());
  }

  if (Array.isArray(value)) {
    return value.length > 0 && value.some(hasMeaningfulFieldValue);
  }

  if (isPlainRecord(value)) {
    const entries = Object.entries(value);
    return (
      entries.length > 0 &&
      entries.some(([, item]) => hasMeaningfulFieldValue(item))
    );
  }

  return false;
};

export const isRequiredBulletinField = (field: Field): boolean =>
  field.form === true && field.validation?.required === true;

export const isRequiredBulletinFieldComplete = (field: Field): boolean => {
  if (!isRequiredBulletinField(field)) {
    return true;
  }

  const value = field.value;

  switch (field.type) {
    case "number":
      return (
        value !== null &&
        value !== undefined &&
        value !== "" &&
        Number.isFinite(Number(value))
      );

    case "date_range": {
      if (!isPlainRecord(value)) {
        return false;
      }

      const range = value;
      return (
        isNonEmptyString(range.start_date) && isNonEmptyString(range.end_date)
      );
    }

    case "list":
    case "card":
      return (
        Array.isArray(value) &&
        value.length > 0 &&
        value.some(hasMeaningfulFieldValue)
      );

    case "text_with_icon": {
      if (typeof value === "string") {
        return value.trim().length > 0;
      }

      if (isPlainRecord(value)) {
        const record = value;
        const textLikeValue =
          record.text ??
          record.value ??
          record.label ??
          record.title ??
          record.description;

        return textLikeValue !== undefined
          ? hasMeaningfulFieldValue(textLikeValue)
          : hasMeaningfulFieldValue(value);
      }

      return false;
    }

    default:
      return hasMeaningfulFieldValue(value);
  }
};

const collectIssuesFromFields = (
  fields: Field[] | undefined,
  path: string,
  issues: RequiredFieldIssue[],
  pageIndex?: number,
) => {
  fields?.forEach((field, fieldIndex) => {
    if (
      !isRequiredBulletinField(field) ||
      isRequiredBulletinFieldComplete(field)
    ) {
      return;
    }

    const fieldId = field.field_id || `${path}-field-${fieldIndex}`;
    issues.push({
      key: `${path}:${fieldId}`,
      fieldId,
      label: field.label || field.display_name || fieldId,
      path,
      pageIndex,
    });
  });
};

const collectIssuesFromPage = (
  page: BulletinSectionPage,
  path: string,
  issues: RequiredFieldIssue[],
  pageIndex: number,
) => {
  collectIssuesFromFields(
    page.header_config?.fields,
    `${path}.header`,
    issues,
    pageIndex,
  );

  page.blocks?.forEach((block, blockIndex) => {
    collectIssuesFromFields(
      block.fields,
      `${path}.blocks.${block.block_id || blockIndex}`,
      issues,
      pageIndex,
    );
  });

  collectIssuesFromFields(
    page.footer_config?.fields,
    `${path}.footer`,
    issues,
    pageIndex,
  );
};

export const getBasicInfoRequiredFieldIssues = (
  data: CreateBulletinData,
): RequiredFieldIssue[] => {
  const issues: RequiredFieldIssue[] = [];

  collectIssuesFromFields(
    data.version.data.header_config?.fields,
    "basicInfo.header",
    issues,
  );
  collectIssuesFromFields(
    data.version.data.footer_config?.fields,
    "basicInfo.footer",
    issues,
  );

  return issues;
};

/**
 * Validates a bulletin section, including every repeatable/temporary page.
 * A repeatable section is validated from repeatable_pages to avoid validating
 * the active page twice through the synchronized section.blocks snapshot.
 */
export const getSectionRequiredFieldIssues = (
  section: BulletinSection | undefined,
  sectionIndex: number,
): RequiredFieldIssue[] => {
  if (!section) {
    return [];
  }

  const issues: RequiredFieldIssue[] = [];
  const sectionPath = `sections.${section.section_id || sectionIndex}`;

  if (section.repeatable_pages?.length) {
    section.repeatable_pages.forEach((page, pageIndex) => {
      collectIssuesFromPage(
        page,
        `${sectionPath}.pages.${page.page_id || pageIndex}`,
        issues,
        pageIndex,
      );
    });

    return issues;
  }

  collectIssuesFromFields(
    section.header_config?.fields,
    `${sectionPath}.header`,
    issues,
  );

  section.blocks?.forEach((block, blockIndex) => {
    collectIssuesFromFields(
      block.fields,
      `${sectionPath}.blocks.${block.block_id || blockIndex}`,
      issues,
    );
  });

  collectIssuesFromFields(
    section.footer_config?.fields,
    `${sectionPath}.footer`,
    issues,
  );

  return issues;
};

export const toRequiredFieldValidationResult = (
  issues: RequiredFieldIssue[],
): RequiredFieldValidationResult => ({
  isValid: issues.length === 0,
  issues,
  invalidFieldIds: Array.from(new Set(issues.map((issue) => issue.fieldId))),
});

// Alias explícito para componentes que editan una sección temporal antes de
// incorporarla al boletín. Usa exactamente las mismas reglas de validación.
export const getTemporarySectionRequiredFieldIssues =
  getSectionRequiredFieldIssues;
