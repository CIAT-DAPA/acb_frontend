"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { CreateBulletinData } from "../../../../../types/bulletin";
import { Field } from "../../../../../types/template";
import { ListFieldEditor } from "../components/fields";

interface SectionStepProps {
  bulletinData: CreateBulletinData;
  sectionIndex: number;
  onUpdate: (updater: (prev: CreateBulletinData) => CreateBulletinData) => void;
}

export function SectionStep({
  bulletinData,
  sectionIndex,
  onUpdate,
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
        const isLongText =
          "field_config" in field &&
          field.field_config &&
          "subtype" in field.field_config &&
          field.field_config.subtype === "long";

        return isLongText ? (
          <textarea
            value={fieldValue as string}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.description || field.label}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#283618] min-h-[100px]"
          />
        ) : (
          <input
            type="text"
            value={fieldValue as string}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.description || field.label}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#283618]"
          />
        );

      case "number":
        return (
          <input
            type="number"
            value={fieldValue as number}
            onChange={(e) => handleChange(parseFloat(e.target.value))}
            placeholder={field.description || field.label}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#283618]"
          />
        );

      case "date":
        return (
          <input
            type="date"
            value={fieldValue as string}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#283618]"
          />
        );

      case "select":
        const options =
          "field_config" in field &&
          field.field_config &&
          "options" in field.field_config
            ? field.field_config.options
            : [];

        return (
          <select
            value={fieldValue as string}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#283618]"
          >
            <option value="">{t("selectOption")}</option>
            {options.map((option: string) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
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
