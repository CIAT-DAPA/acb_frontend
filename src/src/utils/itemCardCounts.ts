import type {
  BulletinBlock,
  BulletinSection,
  BulletinVersion,
} from "@/types/bulletin";
import type { Field } from "@/types/template";
import { shouldRenderBulletinSection } from "@/utils/sectionVisibility";

const getFieldPageCount = (field: Field): number => {
  if (field.bulletin === false) {
    return 1;
  }

  if (field.type === "list") {
    const maxItemsPerPage = Number(
      (field.field_config as { max_items_per_page?: number } | undefined)
        ?.max_items_per_page || 0,
    );
    const items = Array.isArray(field.value) ? field.value : [];

    if (maxItemsPerPage > 0 && items.length > 0) {
      return Math.max(Math.ceil(items.length / maxItemsPerPage), 1);
    }
  }

  if (field.type === "card" && Array.isArray(field.value)) {
    return Math.max(field.value.length, 1);
  }

  return 1;
};

const getBlocksPageCount = (blocks: BulletinBlock[] = []): number => {
  let totalPages = 1;

  blocks.forEach((block) => {
    block.fields?.forEach((field) => {
      totalPages = Math.max(totalPages, getFieldPageCount(field));
    });
  });

  return totalPages;
};

const getSectionPageCount = (section: BulletinSection): number => {
  if (
    Array.isArray(section.repeatable_pages) &&
    section.repeatable_pages.length > 0
  ) {
    // TemplatePreview treats every repeatable page as one base page.
    return section.repeatable_pages.length;
  }

  return getBlocksPageCount(section.blocks);
};

/**
 * Returns the logical number of bulletin pages represented by the current
 * version data. It mirrors the base pagination rules used by TemplatePreview:
 * repeatable pages first, otherwise list/card pagination inside each section.
 * Empty skippable sections are excluded because they are not rendered in the
 * final bulletin output.
 */
export const getBulletinPageCount = (version: BulletinVersion): number => {
  const sections = (version.data?.sections || []).filter((section) =>
    shouldRenderBulletinSection(section),
  );

  return sections.reduce(
    (total, section) => total + getSectionPageCount(section),
    0,
  );
};