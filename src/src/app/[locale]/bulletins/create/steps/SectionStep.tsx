"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
  CreateBulletinData,
  BulletinComment,
  BulletinSection,
  BulletinSectionPage,
} from "../../../../../types/bulletin";
import { Field } from "../../../../../types/template";
import {
  ListFieldEditor,
  TextInput,
  TextWithIconInput,
  NumberInput,
  DateInput,
  DateRangeInput,
  SelectInput,
  SearchableInput,
  SelectBackgroundField,
  CardFieldInput,
  ImageUploadInput,
  MoonCalendarInput,
} from "../components/fields";

interface SectionStepProps {
  bulletinData: CreateBulletinData;
  sectionIndex: number;
  onUpdate: (updater: (prev: CreateBulletinData) => CreateBulletinData) => void;
  currentPageIndex?: number;
  onPageChange?: (pageIndex: number) => void;
  fieldComments?: Record<string, BulletinComment[]>;
}

// Helper para normalizar valores de date_range
const normalizeDateRangeValue = (
  value: any,
): {
  start_date: string;
  end_date: string;
  start_moon_phase?: string;
  end_moon_phase?: string;
} => {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return {
      start_date: value.start_date || "",
      end_date: value.end_date || "",
      start_moon_phase: value.start_moon_phase,
      end_moon_phase: value.end_moon_phase,
    };
  }
  return { start_date: "", end_date: "" };
};

// Helper para normalizar valores de card
const normalizeCardValue = (value: any): string[] => {
  if (!Array.isArray(value)) return [];
  return value.map((item: any) =>
    typeof item === "string" ? item : item.cardId || item._id || item,
  );
};

export function SectionStep({
  bulletinData,
  sectionIndex,
  onUpdate,
  currentPageIndex,
  onPageChange,
  fieldComments = {},
}: SectionStepProps) {
  const t = useTranslations("CreateBulletin.section");

  const section = bulletinData.version.data.sections[sectionIndex];

  if (!section) {
    return <div className="text-center py-8 text-red-500">{t("notFound")}</div>;
  }

  const isRepeatableSection = Boolean(
    section.repeatable && section.repeatable_pages?.length,
  );
  const repeatablePages = section.repeatable_pages || [];
  const resolvedPageIndex = isRepeatableSection
    ? Math.min(
        Math.max(currentPageIndex ?? 0, 0),
        Math.max(repeatablePages.length - 1, 0),
      )
    : 0;
  const activeRepeatablePage = isRepeatableSection
    ? repeatablePages[resolvedPageIndex]
    : undefined;

  const blankFieldValue = (field: Field): any => {
    switch (field.type) {
      case "list":
      case "card":
        return [];
      case "climate_data_puntual":
      case "moon_calendar":
        return {};
      case "date_range":
        return { start_date: "", end_date: "" };
      case "number":
        return null;
      default:
        return "";
    }
  };

  const cloneFieldsWithBlankValues = (fields: Field[] | undefined) =>
    (fields || []).map((field) => ({
      ...field,
      field_id: crypto.randomUUID(),
      value: blankFieldValue(field),
    }));

  const cloneFieldsForRepeatablePage = (fields: Field[] | undefined) =>
    (fields || []).map((field) => {
      const clonedField = structuredClone(field);
      clonedField.field_id = crypto.randomUUID();
      if (clonedField.form) {
        clonedField.value = blankFieldValue(clonedField);
      }
      return clonedField;
    });

  const buildRepeatablePageFromSource = (
    sourcePage: BulletinSectionPage,
    pageTitle: string,
  ): BulletinSectionPage => ({
    page_id: crypto.randomUUID(),
    page_title: pageTitle,
    header_config: sourcePage.header_config
      ? {
          ...sourcePage.header_config,
          fields: cloneFieldsForRepeatablePage(sourcePage.header_config.fields),
        }
      : undefined,
    footer_config: sourcePage.footer_config
      ? {
          ...sourcePage.footer_config,
          fields: cloneFieldsForRepeatablePage(sourcePage.footer_config.fields),
        }
      : undefined,
    blocks: (sourcePage.blocks || []).map((block) => ({
      ...block,
      block_id: crypto.randomUUID(),
      fields: cloneFieldsForRepeatablePage(block.fields),
    })),
  });

  const syncSectionFromRepeatablePage = (
    nextData: CreateBulletinData,
    page: BulletinSectionPage,
    pageIndex: number,
  ) => {
    const nextSection = nextData.version.data.sections[
      sectionIndex
    ] as BulletinSection;
    nextSection.page_title = page.page_title;
    nextSection.header_config = page.header_config
      ? structuredClone(page.header_config)
      : undefined;
    nextSection.footer_config = page.footer_config
      ? structuredClone(page.footer_config)
      : undefined;
    nextSection.blocks = structuredClone(page.blocks);
    nextSection.active_page_index = pageIndex;
  };

  const updateRepeatablePage = (
    pageIndex: number,
    updater: (page: BulletinSectionPage) => BulletinSectionPage,
  ) => {
    onUpdate((prev) => {
      const next = structuredClone(prev);
      const nextSection = next.version.data.sections[
        sectionIndex
      ] as BulletinSection;
      const currentPage = nextSection.repeatable_pages?.[pageIndex];

      if (!nextSection.repeatable_pages || !currentPage) {
        return prev;
      }

      const updatedPage = updater(structuredClone(currentPage));
      nextSection.repeatable_pages[pageIndex] = updatedPage;
      syncSectionFromRepeatablePage(next, updatedPage, pageIndex);
      return next;
    });
  };

  const handleSelectPage = (pageIndex: number) => {
    if (!isRepeatableSection || pageIndex === resolvedPageIndex) {
      return;
    }

    onPageChange?.(pageIndex);
    onUpdate((prev) => {
      const next = structuredClone(prev);
      const nextSection = next.version.data.sections[
        sectionIndex
      ] as BulletinSection;
      const targetPage = nextSection.repeatable_pages?.[pageIndex];

      if (!nextSection.repeatable_pages || !targetPage) {
        return prev;
      }

      syncSectionFromRepeatablePage(next, targetPage, pageIndex);
      return next;
    });
  };

  const handleAddPage = () => {
    if (!isRepeatableSection) {
      return;
    }

    const nextPageIndex = repeatablePages.length;
    const sourcePage = activeRepeatablePage ?? repeatablePages[0];

    if (!sourcePage) {
      return;
    }

    const newPage = buildRepeatablePageFromSource(
      sourcePage,
      `Página ${nextPageIndex + 1}`,
    );

    onUpdate((prev) => {
      const next = structuredClone(prev);
      const nextSection = next.version.data.sections[
        sectionIndex
      ] as BulletinSection;

      if (!nextSection.repeatable_pages) {
        nextSection.repeatable_pages = [];
      }

      nextSection.repeatable_pages.push(newPage);
      syncSectionFromRepeatablePage(next, newPage, nextPageIndex);
      return next;
    });

    onPageChange?.(nextPageIndex);
  };

  const handleDeletePage = () => {
    if (!isRepeatableSection || repeatablePages.length <= 1) {
      return;
    }

    const pageIndexToDelete = resolvedPageIndex;
    const nextPageIndex = Math.max(0, resolvedPageIndex - 1);

    onUpdate((prev) => {
      const next = structuredClone(prev);
      const nextSection = next.version.data.sections[
        sectionIndex
      ] as BulletinSection;

      if (
        !nextSection.repeatable_pages ||
        nextSection.repeatable_pages.length <= 1
      ) {
        return prev;
      }

      nextSection.repeatable_pages.splice(pageIndexToDelete, 1);
      const targetPage = nextSection.repeatable_pages[nextPageIndex];

      if (!targetPage) {
        return prev;
      }

      syncSectionFromRepeatablePage(next, targetPage, nextPageIndex);
      return next;
    });

    onPageChange?.(nextPageIndex);
  };

  const sectionToRender: BulletinSection =
    isRepeatableSection && activeRepeatablePage
      ? {
          ...section,
          header_config:
            activeRepeatablePage.header_config || section.header_config,
          footer_config:
            activeRepeatablePage.footer_config || section.footer_config,
          blocks: activeRepeatablePage.blocks,
        }
      : section;

  const handleFieldChange = (
    blockIndex: number,
    fieldIndex: number,
    value: any,
  ) => {
    if (isRepeatableSection) {
      updateRepeatablePage(resolvedPageIndex, (page) => {
        const nextPage = structuredClone(page);
        nextPage.blocks[blockIndex].fields[fieldIndex] = {
          ...nextPage.blocks[blockIndex].fields[fieldIndex],
          value,
        };
        return nextPage;
      });
      return;
    }

    onUpdate((prev) => ({
      ...prev,
      version: {
        ...prev.version,
        data: {
          ...prev.version.data,
          sections: prev.version.data.sections.map((sec, sIdx) =>
            sIdx === sectionIndex
              ? {
                  ...sec,
                  blocks: sec.blocks.map((block, bIdx) =>
                    bIdx === blockIndex
                      ? {
                          ...block,
                          fields: block.fields.map((field, fIdx) =>
                            fIdx === fieldIndex ? { ...field, value } : field,
                          ),
                        }
                      : block,
                  ),
                }
              : sec,
          ),
        },
      },
    }));
  };

  const handleHeaderFieldChange = (fieldIndex: number, value: any) => {
    if (isRepeatableSection) {
      updateRepeatablePage(resolvedPageIndex, (page) => {
        const nextPage = structuredClone(page);
        if (nextPage.header_config?.fields?.[fieldIndex]) {
          nextPage.header_config.fields[fieldIndex] = {
            ...nextPage.header_config.fields[fieldIndex],
            value,
          };
        }
        return nextPage;
      });
      return;
    }

    onUpdate((prev) => ({
      ...prev,
      version: {
        ...prev.version,
        data: {
          ...prev.version.data,
          sections: prev.version.data.sections.map((sec, sIdx) =>
            sIdx === sectionIndex
              ? {
                  ...sec,
                  header_config: sec.header_config
                    ? {
                        ...sec.header_config,
                        fields: sec.header_config.fields.map((field, fIdx) =>
                          fIdx === fieldIndex ? { ...field, value } : field,
                        ),
                      }
                    : undefined,
                }
              : sec,
          ),
        },
      },
    }));
  };

  const handleFooterFieldChange = (fieldIndex: number, value: any) => {
    if (isRepeatableSection) {
      updateRepeatablePage(resolvedPageIndex, (page) => {
        const nextPage = structuredClone(page);
        if (nextPage.footer_config?.fields?.[fieldIndex]) {
          nextPage.footer_config.fields[fieldIndex] = {
            ...nextPage.footer_config.fields[fieldIndex],
            value,
          };
        }
        return nextPage;
      });
      return;
    }

    onUpdate((prev) => ({
      ...prev,
      version: {
        ...prev.version,
        data: {
          ...prev.version.data,
          sections: prev.version.data.sections.map((sec, sIdx) =>
            sIdx === sectionIndex
              ? {
                  ...sec,
                  footer_config: sec.footer_config
                    ? {
                        ...sec.footer_config,
                        fields: sec.footer_config.fields.map((field, fIdx) =>
                          fIdx === fieldIndex ? { ...field, value } : field,
                        ),
                      }
                    : undefined,
                }
              : sec,
          ),
        },
      },
    }));
  };

  // Función unificada para renderizar cualquier tipo de campo
  const renderComments = (fieldId: string) => {
    const comments = fieldComments[fieldId];
    if (!comments || comments.length === 0) return null;

    return (
      <div className="mt-2 bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-r-md text-sm shadow-sm">
        <div className="text-xs font-bold text-yellow-800 mb-1 uppercase tracking-wide">
          Comentarios
        </div>
        {comments.map((comment, idx) => (
          <div
            key={idx}
            className="mb-2 last:mb-0 border-b border-yellow-200 last:border-0 pb-2 last:pb-0"
          >
            <div className="flex justify-between items-start mb-0.5">
              <span className="font-semibold text-yellow-900 text-xs">
                {comment.author_first_name || "Reviewer"}
              </span>
              <span className="text-[10px] text-yellow-700 opacity-70">
                {new Date(comment.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
              {comment.text}
            </p>
            {comment.replies && comment.replies.length > 0 && (
              <div className="ml-3 mt-2 border-l-2 border-yellow-300 pl-3 bg-white/50 p-2 rounded-sm">
                {comment.replies.map((reply, rIdx) => (
                  <div key={rIdx} className="mb-1 last:mb-0">
                    <div className="flex gap-1 items-baseline">
                      <span className="font-semibold text-xs text-yellow-800">
                        {reply.author_first_name}:{" "}
                      </span>
                      <p className="text-xs text-gray-600">{reply.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderFieldByType = (field: Field, onChange: (value: any) => void) => {
    if (!field.form) return null;

    const fieldValue = field.value || "";

    switch (field.type) {
      case "list":
        const listValue = Array.isArray(fieldValue) ? fieldValue : [];
        return (
          <ListFieldEditor
            field={field}
            value={listValue}
            onChange={onChange}
          />
        );

      case "text":
        return (
          <TextInput
            field={field}
            value={fieldValue as string}
            onChange={onChange}
            maxLength={field.validation?.max_length}
          />
        );

      case "number":
        return (
          <NumberInput
            field={field}
            value={fieldValue as number}
            onChange={onChange}
          />
        );

      case "date":
        return (
          <DateInput
            field={field}
            value={fieldValue as string}
            onChange={onChange}
          />
        );

      case "date_range":
        return (
          <DateRangeInput
            field={field}
            value={normalizeDateRangeValue(fieldValue)}
            onChange={onChange}
          />
        );

      case "select":
        return (
          <SelectInput
            field={field}
            value={fieldValue as string}
            onChange={onChange}
          />
        );

      case "searchable":
        return (
          <SearchableInput
            field={field}
            value={fieldValue as string}
            onChange={onChange}
          />
        );

      case "select_background":
        return (
          <SelectBackgroundField
            field={field}
            value={fieldValue as string}
            onChange={onChange}
          />
        );

      case "text_with_icon":
        return (
          <TextWithIconInput
            field={field}
            value={fieldValue as string}
            onChange={onChange}
            maxLength={field.validation?.max_length}
          />
        );

      case "card":
        return (
          <CardFieldInput
            field={field}
            value={normalizeCardValue(fieldValue)}
            onChange={onChange}
            currentPageIndex={currentPageIndex}
            onPageChange={onPageChange}
          />
        );

      case "image_upload":
        return (
          <ImageUploadInput
            field={field}
            value={fieldValue as string}
            onChange={onChange}
          />
        );

      case "moon_calendar":
        const moonCalendarValue =
          typeof fieldValue === "object" && fieldValue !== null
            ? fieldValue
            : {};
        return (
          <MoonCalendarInput
            field={field}
            value={moonCalendarValue as any}
            onChange={onChange}
          />
        );

      default:
        return (
          <input
            type="text"
            value={fieldValue as string}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.description || field.label}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#283618]"
            maxLength={field.validation?.max_length}
          />
        );
    }
  };

  const renderHeaderField = (field: Field, fieldIndex: number) => {
    return renderFieldByType(field, (value) =>
      handleHeaderFieldChange(fieldIndex, value),
    );
  };

  const renderFooterField = (field: Field, fieldIndex: number) => {
    return renderFieldByType(field, (value) =>
      handleFooterFieldChange(fieldIndex, value),
    );
  };

  const renderField = (
    field: Field,
    blockIndex: number,
    fieldIndex: number,
  ) => {
    return renderFieldByType(field, (value) =>
      handleFieldChange(blockIndex, fieldIndex, value),
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[#283618] mb-2">
          {section.display_name}
        </h3>
        <p className="text-sm text-[#606c38] mb-4">{t("description")}</p>
      </div>

      {isRepeatableSection && (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleDeletePage}
            disabled={repeatablePages.length <= 1}
            className="px-3 py-3 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("deleteCurrentPage")}
          </button>
          <button
            type="button"
            onClick={handleAddPage}
            className="px-3 py-3 text-sm bg-[#283618] text-white rounded hover:bg-[#606c38] transition-colors"
          >
            + {t("addNewPage")}
          </button>
        </div>
      )}

      {/* Campos del header de la sección con form=true */}
      {sectionToRender.header_config?.fields &&
        sectionToRender.header_config.fields.some((field) => field.form) && (
          <div className="border-t pt-4">
            <h4 className="text-md font-semibold text-[#283618] mb-4">
              {t("headerFields", { defaultValue: "Header Fields" })}
            </h4>
            <div className="space-y-4">
              {sectionToRender.header_config.fields.map((field, fieldIndex) => {
                if (!field.form) {
                  return null;
                }

                return (
                  <div key={field.field_id}>
                    <label className="block text-sm font-medium text-[#283618] mb-1">
                      {field.display_name}
                    </label>
                    {renderHeaderField(field, fieldIndex)}
                    {renderComments(field.field_id)}
                    {field.description && (
                      <p className="text-xs text-[#606c38] mt-1">
                        {field.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      {sectionToRender.blocks.map((block, blockIndex) => {
        // Filtrar solo los campos que tienen form=true
        const formFields = block.fields.filter((field) => field.form);

        if (formFields.length === 0) {
          return null;
        }

        return (
          <div key={block.block_id} className="border-t pt-4">
            <h4 className="text-md font-semibold text-[#283618] mb-4">
              {block.display_name}
            </h4>
            <div className="space-y-4">
              {block.fields.map((field, fieldIndex) => {
                if (!field.form) {
                  return null;
                }

                return (
                  <div key={field.field_id}>
                    <label className="block text-sm font-medium text-[#283618] mb-1">
                      {field.display_name}
                    </label>
                    {renderField(field, blockIndex, fieldIndex)}
                    {renderComments(field.field_id)}
                    {field.description && (
                      <p className="text-xs text-[#606c38] mt-1">
                        {field.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Campos del footer de la sección con form=true */}
      {sectionToRender.footer_config?.fields &&
        sectionToRender.footer_config.fields.some((field) => field.form) && (
          <div className="border-t pt-4 mt-6">
            <h4 className="text-md font-semibold text-[#283618] mb-4">
              {t("footerFields")}
            </h4>
            <div className="space-y-4">
              {sectionToRender.footer_config.fields.map((field, fieldIndex) => {
                if (!field.form) {
                  return null;
                }

                return (
                  <div key={field.field_id}>
                    <label className="block text-sm font-medium text-[#283618] mb-1">
                      {field.display_name}
                    </label>
                    {renderFooterField(field, fieldIndex)}
                    {renderComments(field.field_id)}
                    {field.description && (
                      <p className="text-xs text-[#606c38] mt-1">
                        {field.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      {sectionToRender.blocks.every(
        (block) => !block.fields.some((field) => field.form),
      ) && (
        <div className="text-center py-8 text-[#606c38]">{t("noFields")}</div>
      )}
    </div>
  );
}
