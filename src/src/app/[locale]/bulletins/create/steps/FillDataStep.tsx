"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { CreateBulletinData } from "../../../../../types/bulletin";
import { TemplateVersion, Field } from "../../../../../types/template";
import { Loader2 } from "lucide-react";

interface FillDataStepProps {
  bulletinData: CreateBulletinData;
  templateVersion: TemplateVersion;
  currentSectionIndex: number;
  onDataChange: (updater: (prev: CreateBulletinData) => CreateBulletinData) => void;
  onNext: () => void;
  onPrevious: () => void;
  isLoading: boolean;
  isLastSection: boolean;
}

export function FillDataStep({
  bulletinData,
  templateVersion,
  currentSectionIndex,
  onDataChange,
  onNext,
  onPrevious,
  isLoading,
  isLastSection,
}: FillDataStepProps) {
  const t = useTranslations("CreateBulletin");

  const currentSection = bulletinData.version.data.sections[currentSectionIndex];

  if (!currentSection) {
    return <div>Error: Section not found</div>;
  }

  // Actualizar el valor de un campo
  const handleFieldChange = (
    sectionIndex: number,
    blockIndex: number,
    fieldIndex: number,
    value: any
  ) => {
    onDataChange((prev) => ({
      ...prev,
      version: {
        ...prev.version,
        data: {
          ...prev.version.data,
          sections: prev.version.data.sections.map((section, sIdx) =>
            sIdx === sectionIndex
              ? {
                  ...section,
                  blocks: section.blocks.map((block, bIdx) =>
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
              : section
          ),
        },
      },
    }));
  };

  // Renderizar campo según su tipo
  const renderField = (
    field: Field,
    sectionIndex: number,
    blockIndex: number,
    fieldIndex: number
  ) => {
    // Solo renderizar campos que deben aparecer en el formulario
    if (!field.form) {
      return null;
    }

    const value = field.value || "";

    switch (field.type) {
      case "text":
        const isLongText = field.field_config?.subtype === "long";
        return (
          <div key={field.field_id} className="space-y-2">
            <label className="block text-sm font-medium text-[#283618]">
              {field.label || field.display_name}
              {field.validation?.required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </label>
            {isLongText ? (
              <textarea
                value={String(value)}
                onChange={(e) =>
                  handleFieldChange(
                    sectionIndex,
                    blockIndex,
                    fieldIndex,
                    e.target.value
                  )
                }
                placeholder={field.description}
                rows={4}
                className="w-full px-4 py-2 border border-[#283618]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffaf68] resize-none"
              />
            ) : (
              <input
                type="text"
                value={String(value)}
                onChange={(e) =>
                  handleFieldChange(
                    sectionIndex,
                    blockIndex,
                    fieldIndex,
                    e.target.value
                  )
                }
                placeholder={field.description}
                className="w-full px-4 py-2 border border-[#283618]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffaf68]"
              />
            )}
          </div>
        );

      case "number":
        return (
          <div key={field.field_id} className="space-y-2">
            <label className="block text-sm font-medium text-[#283618]">
              {field.label || field.display_name}
              {field.validation?.required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </label>
            <input
              type="number"
              value={String(value)}
              onChange={(e) =>
                handleFieldChange(
                  sectionIndex,
                  blockIndex,
                  fieldIndex,
                  parseFloat(e.target.value) || 0
                )
              }
              placeholder={field.description}
              className="w-full px-4 py-2 border border-[#283618]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffaf68]"
            />
          </div>
        );

      case "date":
        return (
          <div key={field.field_id} className="space-y-2">
            <label className="block text-sm font-medium text-[#283618]">
              {field.label || field.display_name}
              {field.validation?.required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </label>
            <input
              type="date"
              value={value ? new Date(value as any).toISOString().split("T")[0] : ""}
              onChange={(e) =>
                handleFieldChange(
                  sectionIndex,
                  blockIndex,
                  fieldIndex,
                  e.target.value
                )
              }
              className="w-full px-4 py-2 border border-[#283618]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffaf68]"
            />
          </div>
        );

      case "select":
        return (
          <div key={field.field_id} className="space-y-2">
            <label className="block text-sm font-medium text-[#283618]">
              {field.label || field.display_name}
              {field.validation?.required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </label>
            <select
              value={String(value)}
              onChange={(e) =>
                handleFieldChange(
                  sectionIndex,
                  blockIndex,
                  fieldIndex,
                  e.target.value
                )
              }
              className="w-full px-4 py-2 border border-[#283618]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffaf68]"
            >
              <option value="">{t("fillData.selectOption")}</option>
              {field.field_config?.options?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        );

      // Agregar más tipos según sea necesario
      default:
        return (
          <div key={field.field_id} className="space-y-2">
            <label className="block text-sm font-medium text-[#283618]">
              {field.label || field.display_name}
              {field.validation?.required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </label>
            <input
              type="text"
              value={String(value)}
              onChange={(e) =>
                handleFieldChange(
                  sectionIndex,
                  blockIndex,
                  fieldIndex,
                  e.target.value
                )
              }
              placeholder={field.description || `${field.type} field`}
              className="w-full px-4 py-2 border border-[#283618]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffaf68]"
            />
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <h2 className="text-xl font-semibold text-[#283618] mb-2">
          {currentSection.display_name}
        </h2>
        <p className="text-sm text-[#283618]/70">
          {t("fillData.sectionProgress", {
            current: currentSectionIndex + 1,
            total: bulletinData.version.data.sections.length,
          })}
        </p>
      </div>

      {/* Fields */}
      <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
        {currentSection.blocks.map((block, blockIndex) => (
          <div key={block.block_id} className="space-y-4">
            <h3 className="font-medium text-[#283618] border-b pb-2">
              {block.display_name}
            </h3>
            {block.fields.map((field, fieldIndex) =>
              renderField(field, currentSectionIndex, blockIndex, fieldIndex)
            )}
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <button
          onClick={onPrevious}
          disabled={isLoading}
          className="px-6 py-2 border border-[#283618]/20 rounded-lg font-medium text-[#283618] hover:bg-[#283618]/5 transition-colors disabled:opacity-50"
        >
          {t("navigation.previous")}
        </button>
        <button
          onClick={onNext}
          disabled={isLoading}
          className="px-6 py-2 bg-[#ffaf68] text-white rounded-lg font-medium hover:bg-[#e09952] transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isLastSection ? t("navigation.finish") : t("navigation.next")}
        </button>
      </div>
    </div>
  );
}
