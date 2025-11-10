"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { CreateBulletinData } from "../../../../../types/bulletin";
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
} from "../components/fields";

interface SectionStepProps {
  bulletinData: CreateBulletinData;
  sectionIndex: number;
  onUpdate: (updater: (prev: CreateBulletinData) => CreateBulletinData) => void;
  currentPageIndex?: number;
  onPageChange?: (pageIndex: number) => void;
}

export function SectionStep({
  bulletinData,
  sectionIndex,
  onUpdate,
  currentPageIndex,
  onPageChange,
}: SectionStepProps) {
  const t = useTranslations("CreateBulletin.section");

  const section = bulletinData.version.data.sections[sectionIndex];

  if (!section) {
    return (
      <div className="text-center py-8 text-red-500">Sección no encontrada</div>
    );
  }

  const handleFieldChange = (
    blockIndex: number,
    fieldIndex: number,
    value: any
  ) => {
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
                            fIdx === fieldIndex ? { ...field, value } : field
                          ),
                        }
                      : block
                  ),
                }
              : sec
          ),
        },
      },
    }));
  };

  // Handler para campos del header de la sección
  const handleHeaderFieldChange = (fieldIndex: number, value: any) => {
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
                          fIdx === fieldIndex ? { ...field, value } : field
                        ),
                      }
                    : undefined,
                }
              : sec
          ),
        },
      },
    }));
  };

  const renderHeaderField = (field: Field, fieldIndex: number) => {
    // Solo renderizar si form es true
    if (!field.form) {
      return null;
    }

    const fieldValue = field.value || "";

    const handleChange = (value: any) => {
      handleHeaderFieldChange(fieldIndex, value);
    };

    switch (field.type) {
      case "list":
        const listValue = Array.isArray(fieldValue) ? fieldValue : [];
        return (
          <ListFieldEditor
            field={field}
            value={listValue}
            onChange={handleChange}
          />
        );

      case "text":
        return (
          <TextInput
            field={field}
            value={fieldValue as string}
            onChange={handleChange}
          />
        );

      case "number":
        return (
          <NumberInput
            field={field}
            value={fieldValue as number}
            onChange={handleChange}
          />
        );

      case "date":
        return (
          <DateInput
            field={field}
            value={fieldValue as string}
            onChange={handleChange}
          />
        );

      case "date_range":
        const headerDateRangeValue =
          typeof fieldValue === "object" &&
          fieldValue !== null &&
          !Array.isArray(fieldValue)
            ? (fieldValue as unknown as {
                start_date: string;
                end_date: string;
              })
            : { start_date: "", end_date: "" };
        return (
          <DateRangeInput
            field={field}
            value={headerDateRangeValue}
            onChange={handleChange}
          />
        );

      case "select":
        return (
          <SelectInput
            field={field}
            value={fieldValue as string}
            onChange={handleChange}
          />
        );

      case "searchable":
        return (
          <SearchableInput
            field={field}
            value={fieldValue as string}
            onChange={handleChange}
          />
        );

      case "select_background":
        return (
          <SelectBackgroundField
            field={field}
            value={fieldValue as string}
            onChange={handleChange}
          />
        );

      case "text_with_icon":
        return (
          <TextWithIconInput
            field={field}
            value={fieldValue as string}
            onChange={handleChange}
          />
        );

      case "card":
        const headerCardValue = Array.isArray(fieldValue)
          ? fieldValue.map((item: any) =>
              typeof item === "string" ? item : item.cardId || item._id || item
            )
          : [];
        return (
          <CardFieldInput
            field={field}
            value={headerCardValue}
            onChange={handleChange}
            currentPageIndex={currentPageIndex}
            onPageChange={onPageChange}
          />
        );

      default:
        return (
          <input
            type="text"
            value={fieldValue as string}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.description || field.label}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#283618]"
          />
        );
    }
  };

  const renderField = (
    field: Field,
    blockIndex: number,
    fieldIndex: number
  ) => {
    // Solo renderizar si form es true
    if (!field.form) {
      return null;
    }

    const fieldValue = field.value || "";

    const handleChange = (value: any) => {
      handleFieldChange(blockIndex, fieldIndex, value);
    };

    switch (field.type) {
      case "list":
        // Para campos de tipo lista, usar el editor especializado
        const listValue = Array.isArray(fieldValue) ? fieldValue : [];
        return (
          <ListFieldEditor
            field={field}
            value={listValue}
            onChange={handleChange}
          />
        );

      case "text":
        return (
          <TextInput
            field={field}
            value={fieldValue as string}
            onChange={handleChange}
          />
        );

      case "number":
        return (
          <NumberInput
            field={field}
            value={fieldValue as number}
            onChange={handleChange}
          />
        );

      case "date":
        return (
          <DateInput
            field={field}
            value={fieldValue as string}
            onChange={handleChange}
          />
        );

      case "date_range":
        const blockDateRangeValue =
          typeof fieldValue === "object" &&
          fieldValue !== null &&
          !Array.isArray(fieldValue)
            ? (fieldValue as unknown as {
                start_date: string;
                end_date: string;
              })
            : { start_date: "", end_date: "" };
        return (
          <DateRangeInput
            field={field}
            value={blockDateRangeValue}
            onChange={handleChange}
          />
        );

      case "select":
        return (
          <SelectInput
            field={field}
            value={fieldValue as string}
            onChange={handleChange}
          />
        );

      case "searchable":
        return (
          <SearchableInput
            field={field}
            value={fieldValue as string}
            onChange={handleChange}
          />
        );

      case "select_background":
        return (
          <SelectBackgroundField
            field={field}
            value={fieldValue as string}
            onChange={handleChange}
          />
        );

      case "text_with_icon":
        return (
          <TextWithIconInput
            field={field}
            value={fieldValue as string}
            onChange={handleChange}
          />
        );

      case "card":
        const cardValue = Array.isArray(fieldValue)
          ? fieldValue.map((item: any) =>
              typeof item === "string" ? item : item.cardId || item._id || item
            )
          : [];
        return (
          <CardFieldInput
            field={field}
            value={cardValue}
            onChange={handleChange}
            currentPageIndex={currentPageIndex}
            onPageChange={onPageChange}
          />
        );

      default:
        return (
          <input
            type="text"
            value={fieldValue as string}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.description || field.label}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#283618]"
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[#283618] mb-2">
          {section.display_name}
        </h3>
        <p className="text-sm text-[#606c38] mb-4">{t("description")}</p>
      </div>

      {/* Campos del header de la sección con form=true */}
      {section.header_config?.fields &&
        section.header_config.fields.some((field) => field.form) && (
          <div className="border-t pt-4">
            <h4 className="text-md font-semibold text-[#283618] mb-4">
              {t("headerFields", { defaultValue: "Header Fields" })}
            </h4>
            <div className="space-y-4">
              {section.header_config.fields.map((field, fieldIndex) => {
                if (!field.form) {
                  return null;
                }

                return (
                  <div key={field.field_id}>
                    <label className="block text-sm font-medium text-[#283618] mb-1">
                      {field.display_name}
                    </label>
                    {renderHeaderField(field, fieldIndex)}
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

      {section.blocks.map((block, blockIndex) => {
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

      {section.blocks.every(
        (block) => !block.fields.some((field) => field.form)
      ) && (
        <div className="text-center py-8 text-[#606c38]">{t("noFields")}</div>
      )}
    </div>
  );
}
