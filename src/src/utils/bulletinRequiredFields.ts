import type {
  BulletinSection,
  BulletinSectionPage,
  CreateBulletinData,
} from "@/types/bulletin";
import type { Field } from "@/types/template";

export const BULLETIN_NAME_VALIDATION_ID = "__bulletin_name__";
export const BULLETIN_SLUG_VALIDATION_ID = "__bulletin_name_machine__";

export type BulletinFieldValidationCode =
  | "required"
  | "list_min_items"
  | "list_max_items";

export interface RequiredFieldIssue {
  key: string;
  fieldId: string;
  label: string;
  path: string;
  pageIndex?: number;
  code?: BulletinFieldValidationCode;
  limit?: number;
  actual?: number;
}

export interface ListItemLimits {
  minItems?: number;
  maxItems?: number;
}

export interface ListItemConstraintViolation {
  type: "min" | "max";
  limit: number;
  actual: number;
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

const toNonNegativeInteger = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return undefined;
  }

  return Math.floor(parsed);
};

const firstDefinedInteger = (candidates: unknown[]): number | undefined => {
  for (const candidate of candidates) {
    const parsed = toNonNegativeInteger(candidate);

    if (parsed !== undefined) {
      return parsed;
    }
  }

  return undefined;
};

/**
 * Reads the total-item limits configured for a list field.
 *
 * The canonical keys are validation.min_items and validation.max_items.
 * The aliases keep this compatible with templates serialized by older UI
 * versions. max_items_per_page is intentionally excluded because it controls
 * pagination, not the total number of allowed items.
 */
export const getListItemLimits = (field: Field): ListItemLimits => {
  if (field.type !== "list") {
    return {};
  }

  const validation: Record<string, unknown> = isPlainRecord(field.validation)
    ? field.validation
    : {};

  const fieldConfig: Record<string, unknown> = isPlainRecord(field.field_config)
    ? field.field_config
    : {};

  const minItems = firstDefinedInteger([
    validation.min_items,
    validation.minItems,
    validation.minimum_items,
    validation.minimumItems,
    fieldConfig.min_items,
    fieldConfig.minItems,
    fieldConfig.minimum_items,
    fieldConfig.minimumItems,
  ]);

  const maxItems = firstDefinedInteger([
    validation.max_items,
    validation.maxItems,
    validation.maximum_items,
    validation.maximumItems,
    fieldConfig.max_items,
    fieldConfig.maxItems,
    fieldConfig.maximum_items,
    fieldConfig.maximumItems,
  ]);

  return {
    minItems,
    maxItems,
  };
};

export const getListItemConstraintViolation = (
  field: Field,
): ListItemConstraintViolation | null => {
  if (field.form !== true || field.type !== "list") {
    return null;
  }

  const actual = Array.isArray(field.value) ? field.value.length : 0;
  const { minItems, maxItems } = getListItemLimits(field);

  if (minItems !== undefined && actual < minItems) {
    return {
      type: "min",
      limit: minItems,
      actual,
    };
  }

  if (maxItems !== undefined && actual > maxItems) {
    return {
      type: "max",
      limit: maxItems,
      actual,
    };
  }

  return null;
};

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
    if (field.form !== true) {
      return;
    }

    const fieldId = field.field_id || `${path}-field-${fieldIndex}`;
    const baseIssue = {
      fieldId,
      label: field.label || field.display_name || fieldId,
      path,
      pageIndex,
    };

    const listViolation = getListItemConstraintViolation(field);

    if (listViolation) {
      issues.push({
        ...baseIssue,
        key: `${path}:${fieldId}:${listViolation.type}`,
        code:
          listViolation.type === "min" ? "list_min_items" : "list_max_items",
        limit: listViolation.limit,
        actual: listViolation.actual,
      });
      return;
    }

    if (
      isRequiredBulletinField(field) &&
      !isRequiredBulletinFieldComplete(field)
    ) {
      issues.push({
        ...baseIssue,
        key: `${path}:${fieldId}:required`,
        code: "required",
      });
    }
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
