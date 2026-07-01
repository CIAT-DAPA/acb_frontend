import type { BulletinWithCurrentVersion } from "@/types/bulletin";
import type {
  CreateTemplateData,
  Field,
  Block,
  Section,
} from "@/types/template";

export function safeDecode(value?: string | null): string {
  if (!value) return "";

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function decodeTextFieldValue(value: any): any {
  if (typeof value === "string" && value.trim() !== "") {
    return safeDecode(value);
  }

  return value;
}

function decodeObjectTextValues(value: any): any {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const nextValue = { ...value } as Record<string, any>;
  const textLikeKeys = ["text", "label", "title", "description", "value"];

  textLikeKeys.forEach((key) => {
    if (typeof nextValue[key] === "string") {
      nextValue[key] = decodeTextFieldValue(nextValue[key]);
    }
  });

  return nextValue;
}

function decodeFields(fields: Field[]) {
  fields.forEach((field) => {
    if (field.type === "text") {
      field.value = decodeTextFieldValue(field.value);
    } else if (field.type === "text_with_icon") {
      field.value =
        typeof field.value === "string"
          ? decodeTextFieldValue(field.value)
          : decodeObjectTextValues(field.value);
    } else if (field.type === "list" && Array.isArray(field.value)) {
      field.value = field.value.map((item: any) => {
        if (typeof item === "string") {
          return decodeTextFieldValue(item);
        }

        return decodeObjectTextValues(item);
      });
    }
  });
}

function decodeSectionFields(section: Section) {
  if (section.header_config?.fields) {
    decodeFields(section.header_config.fields);
  }

  if (section.footer_config?.fields) {
    decodeFields(section.footer_config.fields);
  }

  section.blocks?.forEach((block: Block) => {
    if (block.fields) {
      decodeFields(block.fields);
    }
  });

  (section as any).repeatable_pages?.forEach((page: any) => {
    if (page.header_config?.fields) {
      decodeFields(page.header_config.fields);
    }

    if (page.footer_config?.fields) {
      decodeFields(page.footer_config.fields);
    }

    page.blocks?.forEach((block: Block) => {
      if (block.fields) {
        decodeFields(block.fields);
      }
    });
  });
}

export function bulletinToTemplateData(
  bulletin: BulletinWithCurrentVersion,
  bulletinSlug: string,
): CreateTemplateData {
  const bulletinMaster = bulletin.master;
  const currentVersion = bulletin.current_version;

  const templateDataFormatted: CreateTemplateData = {
    master: {
      template_name:
        safeDecode(bulletinMaster.bulletin_name) || "Untitled Bulletin",
      name_machine: bulletinMaster.name_machine || bulletinSlug,
      description: safeDecode(bulletinMaster.description) || "",
      log: bulletinMaster.log || {
        created_at: new Date().toISOString(),
        creator_user_id: "",
        creator_first_name: null,
        creator_last_name: null,
      },
      status: "active",
      access_config: bulletinMaster.access_config || {
        access_type: "public",
        allowed_groups: [],
      },
      thumbnail_images: bulletinMaster.thumbnail_images || [],
    },
    version: {
      version_num: currentVersion.version_num || 1,
      log: currentVersion.log || {
        created_at: new Date().toISOString(),
        creator_user_id: "",
        creator_first_name: null,
        creator_last_name: null,
      },
      commit_message: currentVersion.commit_message || "Initial version",
      content: {
        style_config: currentVersion.data.style_config || {},
        header_config: currentVersion.data.header_config,
        sections: currentVersion.data.sections || [],
        footer_config: currentVersion.data.footer_config,
      },
    },
  };

  if (templateDataFormatted.version.content.header_config?.fields) {
    decodeFields(templateDataFormatted.version.content.header_config.fields);
  }

  if (templateDataFormatted.version.content.footer_config?.fields) {
    decodeFields(templateDataFormatted.version.content.footer_config.fields);
  }

  templateDataFormatted.version.content.sections?.forEach((section) => {
    decodeSectionFields(section);
  });

  return templateDataFormatted;
}

function looksLikeAsset(value: string): boolean {
  return (
    value.startsWith("/") ||
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    /\.(png|jpg|jpeg|webp|svg|gif|pdf)$/i.test(value)
  );
}

function looksLikeTechnicalValue(value: string): boolean {
  return (
    /^#[0-9a-f]{3,8}$/i.test(value) ||
    /^rgba?\(/i.test(value) ||
    /^field_\d+/i.test(value) ||
    /^block_\d+/i.test(value) ||
    /^section_\d+/i.test(value) ||
    /^\d+(px|rem|em|%)?(\s+\d+(px|rem|em|%)?){0,3}$/i.test(value)
  );
}

const TECHNICAL_TEXT_VALUES = new Set([
  "text",
  "text_with_icon",
  "date",
  "date_range",
  "list",
  "select",
  "searchable",
  "select_with_icons",
  "select_background",
  "number",
  "image_upload",
  "algorithm",
  "page_number",
  "card",
  "image",
  "moon_calendar",
  "climate_data_puntual",
  "short",
  "long",
  "horizontal",
  "vertical",
  "grid-2",
  "grid-3",
  "table",
  "none",
  "solid",
]);

const SKIP_OBJECT_KEYS = new Set([
  "id",
  "_id",
  "field_id",
  "block_id",
  "section_id",
  "page_id",
  "cardId",
  "icon_url",
  "icons_url",
  "selected_icon",
  "background_url",
  "background_image",
  "backgrounds_url",
  "thumbnail_images",
  "style_config",
  "field_config",
  "validation",
]);

function isUsefulSeoText(value: string): boolean {
  const text = value.trim();

  if (!text) return false;
  if (text.length < 2) return false;
  if (/^(true|false|null|undefined)$/i.test(text)) return false;
  if (looksLikeAsset(text)) return false;
  if (looksLikeTechnicalValue(text)) return false;
  if (TECHNICAL_TEXT_VALUES.has(text)) return false;

  return true;
}

function collectSeoTextFromValue(value: unknown, result: string[]) {
  if (value === null || value === undefined) {
    return;
  }

  if (typeof value === "string") {
    const decoded = safeDecode(value).trim();

    if (isUsefulSeoText(decoded)) {
      result.push(decoded);
    }

    return;
  }

  if (typeof value === "number") {
    result.push(String(value));
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectSeoTextFromValue(item, result));
    return;
  }

  if (typeof value === "object") {
    const objectValue = value as Record<string, unknown>;

    if (objectValue.fieldValues) {
      collectSeoTextFromValue(objectValue.fieldValues, result);
      return;
    }

    Object.entries(objectValue).forEach(([key, item]) => {
      if (SKIP_OBJECT_KEYS.has(key)) return;
      if (key.includes("style")) return;
      if (key.includes("color")) return;
      if (key.includes("image")) return;
      if (key.includes("icon")) return;
      if (key.includes("url")) return;

      collectSeoTextFromValue(item, result);
    });
  }
}

function collectSeoTextFromField(field: any, result: string[]) {
  if (!field || field.bulletin === false) {
    return;
  }

  collectSeoTextFromValue(field.value, result);
}

function collectSeoTextFromFields(fields: any[] | undefined, result: string[]) {
  if (!Array.isArray(fields)) {
    return;
  }

  fields.forEach((field) => collectSeoTextFromField(field, result));
}

function collectSeoTextFromConfig(config: any, result: string[]) {
  collectSeoTextFromFields(config?.fields, result);
}

function collectSeoTextFromBlock(block: any, result: string[]) {
  collectSeoTextFromFields(block?.fields, result);
}

function collectSeoTextFromSection(section: any, result: string[]) {
  if (!section) return;

  if (typeof section.display_name === "string") {
    const sectionName = safeDecode(section.display_name).trim();

    if (isUsefulSeoText(sectionName)) {
      result.push(sectionName);
    }
  }

  collectSeoTextFromConfig(section.header_config, result);

  if (Array.isArray(section.blocks)) {
    section.blocks.forEach((block: any) =>
      collectSeoTextFromBlock(block, result),
    );
  }

  collectSeoTextFromConfig(section.footer_config, result);

  if (Array.isArray(section.repeatable_pages)) {
    section.repeatable_pages.forEach((page: any) => {
      collectSeoTextFromConfig(page.header_config, result);

      if (Array.isArray(page.blocks)) {
        page.blocks.forEach((block: any) =>
          collectSeoTextFromBlock(block, result),
        );
      }

      collectSeoTextFromConfig(page.footer_config, result);
    });
  }
}

function uniqueTexts(values: string[]): string[] {
  const seen = new Set<string>();

  return values.filter((value) => {
    const normalized = value.trim().replace(/\s+/g, " ");

    if (!normalized || seen.has(normalized.toLowerCase())) {
      return false;
    }

    seen.add(normalized.toLowerCase());
    return true;
  });
}

export function extractBulletinText(value: unknown): string[] {
  const data = value as any;
  const result: string[] = [];

  collectSeoTextFromConfig(data?.header_config, result);

  if (Array.isArray(data?.sections)) {
    data.sections.forEach((section: any) =>
      collectSeoTextFromSection(section, result),
    );
  }

  collectSeoTextFromConfig(data?.footer_config, result);

  return uniqueTexts(result);
}

export function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

export function buildBulletinDescription(
  bulletin: BulletinWithCurrentVersion,
): string {
  const explicitDescription = safeDecode(bulletin.master.description);

  if (explicitDescription) {
    return truncateText(explicitDescription, 160);
  }

  const title = safeDecode(bulletin.master.bulletin_name);

  const extractedText = extractBulletinText(bulletin.current_version.data)
    .filter((text) => text.toLowerCase() !== title.toLowerCase())
    .join(" ");

  if (extractedText) {
    return truncateText(`${title}. ${extractedText}`, 160);
  }

  return `Published agroclimatic bulletin: ${title}.`;
}
