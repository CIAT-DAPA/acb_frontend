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
import { MessageCircle } from "lucide-react";

interface SectionStepProps {
  bulletinData: CreateBulletinData;
  sectionIndex: number;
  onUpdate: (updater: (prev: CreateBulletinData) => CreateBulletinData) => void;
  currentPageIndex?: number;
  onPageChange?: (pageIndex: number) => void;
  sectionComments?: Record<string, BulletinComment[]>;
  blockComments?: Record<string, BulletinComment[]>;
  fieldComments?: Record<string, BulletinComment[]>;
  fieldAllComments?: Record<string, BulletinComment[]>;
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

// Helper para extraer tags de cards seleccionadas en la primera sección con cards
const getFirstCardSectionTags = (
  sections: BulletinSection[],
  currentSectionIndex: number,
): string[] => {
  // Buscar hacia atrás desde la sección actual la sección previa MÁS CERCANA
  // que tenga cards seleccionadas. Ignorar secciones que tengan campos card
  // pero sin valores seleccionados.
  for (let i = currentSectionIndex - 1; i >= 0; i--) {
    const section = sections[i];
    const allFields = [
      ...(section.header_config?.fields || []),
      ...(section.blocks?.flatMap((b) => b.fields) || []),
      ...(section.footer_config?.fields || []),
      ...(section.repeatable_pages?.flatMap((p) => [
        ...(p.header_config?.fields || []),
        ...(p.blocks?.flatMap((b) => b.fields) || []),
        ...(p.footer_config?.fields || []),
      ]) || []),
    ];

    const cardFields = allFields.filter((f) => f.type === "card");

    if (cardFields.length > 0) {
      // Extraer solo los IDs que ya estén seleccionados en esa sección
      const selectedCardIds: string[] = [];
      cardFields.forEach((field) => {
        const value = field.value;
        if (Array.isArray(value) && value.length > 0) {
          selectedCardIds.push(
            ...value.map((item: any) =>
              typeof item === "string"
                ? item
                : (item as any).cardId || (item as any)._id || item,
            ),
          );
        }
      });

      // Si encontramos IDs seleccionados, retornarlos; si no, seguir buscando atrás
      if (selectedCardIds.length > 0) {
        return selectedCardIds;
      }
    }
  }

  return [];
};

export function SectionStep({
  bulletinData,
  sectionIndex,
  onUpdate,
  currentPageIndex,
  onPageChange,
  sectionComments = {},
  blockComments = {},
  fieldComments = {},
  fieldAllComments = {},
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
  const renderComments = (targetComments: BulletinComment[] | undefined) => {
    if (!targetComments || targetComments.length === 0) {
      return null;
    }

    return (
      <div className="mt-2 bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-r-md text-sm shadow-sm">
        <div className="text-xs font-bold text-yellow-800 mb-2 uppercase tracking-wide">
          Comentarios
        </div>

        {targetComments.map((comment) => (
          <div
            key={comment.comment_id}
            className="mb-2 last:mb-0 border-b border-yellow-200 last:border-0 pb-2 last:pb-0"
          >
            <div className="flex justify-between items-start mb-1">
              <span className="font-semibold text-yellow-900 text-xs">
                {comment.author_first_name || "Reviewer"}
              </span>

              <span className="text-[10px] text-yellow-700 opacity-70">
                {comment.created_at
                  ? new Date(comment.created_at).toLocaleDateString()
                  : ""}
              </span>
            </div>

            <p className="text-sm text-yellow-900 whitespace-pre-wrap">
              {comment.text}
            </p>

            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-2 pl-3 border-l-2 border-yellow-300 space-y-2">
                {comment.replies.map((reply) => (
                  <div key={reply.comment_id}>
                    <span className="text-xs font-semibold text-yellow-800">
                      {reply.author_first_name || "Reviewer"}:
                    </span>

                    <p className="text-xs text-gray-600">{reply.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const getDirectFieldCommentCount = (fieldId?: string): number => {
    if (!fieldId) return 0;

    // Solo comentarios dirigidos exactamente al campo.
    // No incluye comentarios de ítems internos.
    return fieldComments[fieldId]?.length || 0;
  };

  const getFieldContainerClassName = (fieldId?: string): string => {
    const hasDirectComments = getDirectFieldCommentCount(fieldId) > 0;

    return [
      "relative rounded-lg p-3 transition-all duration-200",
      hasDirectComments
        ? "border-2 border-amber-400 bg-amber-50/60 shadow-sm"
        : "border-2 border-transparent",
    ].join(" ");
  };

  const renderFieldCommentBadge = (fieldId?: string) => {
    const count = getDirectFieldCommentCount(fieldId);

    if (count === 0) return null;

    return (
      <span
        className="
        inline-flex items-center gap-1 rounded-full
        bg-amber-500 px-2 py-0.5
        text-xs font-semibold text-white shadow-sm
      "
        title={`${count} comentario${count === 1 ? "" : "s"} en este campo`}
      >
        <MessageCircle className="h-3.5 w-3.5" />
        {count}
      </span>
    );
  };

  const getBlockCommentCount = (blockId?: string): number => {
    if (!blockId) return 0;

    return blockComments[blockId]?.length || 0;
  };

  const getBlockContainerClassName = (blockId?: string): string => {
    const hasComments = getBlockCommentCount(blockId) > 0;

    return [
      "border-t pt-4 rounded-lg transition-all duration-200",
      hasComments
        ? "border-2 border-amber-400 bg-amber-50/60 p-4 shadow-sm"
        : "",
    ].join(" ");
  };

  const renderBlockCommentBadge = (blockId?: string) => {
    const count = getBlockCommentCount(blockId);

    if (count === 0) return null;

    return (
      <span
        className="
        inline-flex items-center gap-1 rounded-full
        bg-amber-500 px-2 py-0.5
        text-xs font-semibold text-white shadow-sm
      "
        title={`${count} comentario${count === 1 ? "" : "s"} en este bloque`}
      >
        <MessageCircle className="h-3.5 w-3.5" />
        {count}
      </span>
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
            commentsByTarget={fieldComments}
            renderComments={renderComments}
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
        const precedingCardIds = getFirstCardSectionTags(
          bulletinData.version.data.sections,
          sectionIndex,
        );
        return (
          <CardFieldInput
            field={field}
            value={Array.isArray(fieldValue) ? fieldValue : []}
            onChange={onChange}
            currentPageIndex={currentPageIndex}
            onPageChange={onPageChange}
            sectionIndex={sectionIndex}
            precedingCardIds={precedingCardIds}
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

  const formatReadOnlyValue = (value: unknown): string => {
    if (value === undefined || value === null || value === "") {
      return "Sin valor";
    }

    if (typeof value === "boolean") {
      return value ? "Sí" : "No";
    }

    if (typeof value === "string" || typeof value === "number") {
      return String(value);
    }

    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  };

  const renderReadOnlyField = (field: Field) => {
    if (field.type === "list") {
      const listValue = Array.isArray(field.value) ? field.value : [];

      return (
        <ListFieldEditor
          field={field}
          value={listValue}
          onChange={() => {
            // Campo no editable.
          }}
          commentsByTarget={fieldComments}
          renderComments={renderComments}
          readOnly={true}
        />
      );
    }

    return (
      <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 whitespace-pre-wrap">
        {formatReadOnlyValue(field.value)}
      </div>
    );
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
        {section.section_id &&
          renderComments(sectionComments[section.section_id])}
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
        sectionToRender.header_config.fields.some(
          (field) =>
            field.form || Boolean(fieldAllComments[field.field_id]?.length),
        ) && (
          <div className="border-t pt-4">
            <h4 className="text-md font-semibold text-[#283618] mb-4">
              {t("headerFields", { defaultValue: "Header Fields" })}
            </h4>
            <div className="space-y-4">
              {sectionToRender.header_config.fields.map((field, fieldIndex) => {
                const hasAnyFieldComments = Boolean(
                  fieldAllComments[field.field_id]?.length,
                );

                const hasDirectFieldComments = Boolean(
                  fieldComments[field.field_id]?.length,
                );

                if (!field.form && !hasAnyFieldComments) {
                  return null;
                }

                return (
                  <div
                    key={field.field_id}
                    id={`field-${field.field_id}`}
                    className={getFieldContainerClassName(field.field_id)}
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label className="text-sm font-medium text-[#283618]">
                        {field.display_name || field.label || "Campo"}
                      </label>

                      {renderFieldCommentBadge(field.field_id)}
                    </div>

                    {field.form
                      ? renderHeaderField(field, fieldIndex)
                      : renderReadOnlyField(field)}

                    {renderComments(fieldComments[field.field_id])}

                    {field.description && (
                      <p className="mt-1 text-xs text-[#606c38]">
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
        const fieldsToShow = block.fields.filter((field) => {
          const hasComments = Boolean(fieldAllComments[field.field_id]?.length);

          return field.form || hasComments;
        });

        const hasBlockComments = Boolean(blockComments[block.block_id]?.length);

        if (fieldsToShow.length === 0 && !hasBlockComments) {
          return null;
        }

        return (
          <div
            key={block.block_id}
            id={`block-${block.block_id}`}
            className={getBlockContainerClassName(block.block_id)}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h4 className="text-md font-semibold text-[#283618]">
                {block.display_name}
              </h4>

              {renderBlockCommentBadge(block.block_id)}
            </div>

            {renderComments(blockComments[block.block_id])}
            <div className="space-y-4">
              {block.fields.map((field, fieldIndex) => {
                const hasAnyFieldComments = Boolean(
                  fieldAllComments[field.field_id]?.length,
                );

                const hasDirectFieldComments = Boolean(
                  fieldComments[field.field_id]?.length,
                );

                if (!field.form && !hasAnyFieldComments) {
                  return null;
                }

                return (
                  <div
                    key={field.field_id}
                    id={`field-${field.field_id}`}
                    className={getFieldContainerClassName(field.field_id)}
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label className="text-sm font-medium text-[#283618]">
                        {field.display_name || field.label || "Campo"}
                      </label>

                      {renderFieldCommentBadge(field.field_id)}
                    </div>

                    {field.form
                      ? renderField(field, blockIndex, fieldIndex)
                      : renderReadOnlyField(field)}

                    {/* Comentarios hechos directamente al campo padre */}
                    {renderComments(fieldComments[field.field_id])}

                    {field.description && (
                      <p className="mt-1 text-xs text-[#606c38]">
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
        sectionToRender.footer_config.fields.some(
          (field) =>
            field.form || Boolean(fieldAllComments[field.field_id]?.length),
        ) && (
          <div className="border-t pt-4 mt-6">
            <h4 className="text-md font-semibold text-[#283618] mb-4">
              {t("footerFields")}
            </h4>
            <div className="space-y-4">
              {sectionToRender.footer_config.fields.map((field, fieldIndex) => {
                const hasAnyFieldComments = Boolean(
                  fieldAllComments[field.field_id]?.length,
                );

                const hasDirectFieldComments = Boolean(
                  fieldComments[field.field_id]?.length,
                );

                if (!field.form && !hasAnyFieldComments) {
                  return null;
                }

                return (
                  <div
                    key={field.field_id}
                    id={`field-${field.field_id}`}
                    className={getFieldContainerClassName(field.field_id)}
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label className="text-sm font-medium text-[#283618]">
                        {field.display_name || field.label || "Campo"}
                      </label>

                      {renderFieldCommentBadge(field.field_id)}
                    </div>

                    {field.form
                      ? renderFooterField(field, fieldIndex)
                      : renderReadOnlyField(field)}

                    {renderComments(fieldComments[field.field_id])}

                    {field.description && (
                      <p className="mt-1 text-xs text-[#606c38]">
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
        (block) =>
          !block.fields.some(
            (field) =>
              field.form || Boolean(fieldAllComments[field.field_id]?.length),
          ) && !blockComments[block.block_id]?.length,
      ) && (
        <div className="text-center py-8 text-[#606c38]">{t("noFields")}</div>
      )}
    </div>
  );
}
