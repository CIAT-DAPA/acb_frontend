"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { ImageUploadFieldConfig } from "../../../../../../types/template";
import { BaseFieldTypeConfigProps } from "./BaseFieldTypeConfig";
import {
  inputClass,
  labelClass,
  helpTextClass,
  infoBoxClass,
} from "@/app/[locale]/components/ui";
import { X } from "lucide-react";

const IMAGE_FORMAT_OPTIONS = [
  { value: "jpg", label: "JPG" },
  { value: "jpeg", label: "JPEG" },
  { value: "png", label: "PNG" },
  { value: "gif", label: "GIF" },
  { value: "webp", label: "WebP" },
  { value: "svg", label: "SVG" },
];

export const ImageUploadFieldTypeConfig: React.FC<BaseFieldTypeConfigProps> = ({
  currentField,
  updateFieldConfig,
  t: fieldT,
}) => {
  const t = useTranslations("CreateTemplate.fieldEditor.imageUploadConfig");

  // Helper para obtener config tipada
  const fieldConfig =
    (currentField.field_config as ImageUploadFieldConfig) || {};

  const allowedFormats = fieldConfig.allowed_formats || ["jpg", "jpeg", "png"];
  const maxFileSize = fieldConfig.max_file_size || "5MB";
  const maxHeight = fieldConfig.max_height || undefined;
  const maxWidth = fieldConfig.max_width || undefined;

  // Toggle formato
  const toggleFormat = (format: string) => {
    const currentFormats = [...allowedFormats];
    const index = currentFormats.indexOf(format);

    if (index > -1) {
      // Si está presente, removerlo
      currentFormats.splice(index, 1);
    } else {
      // Si no está, agregarlo
      currentFormats.push(format);
    }

    updateFieldConfig({ allowed_formats: currentFormats });
  };

  return (
    <div className="space-y-4">
      {/* Formatos permitidos */}
      <div>
        <label className={labelClass}>{t("allowedFormatsLabel")}</label>
        <p className={helpTextClass}>{t("allowedFormatsHelp")}</p>

        <div className="flex flex-wrap gap-2 mt-2">
          {IMAGE_FORMAT_OPTIONS.map((format) => {
            const isSelected = allowedFormats.includes(format.value);
            return (
              <button
                key={format.value}
                type="button"
                onClick={() => toggleFormat(format.value)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isSelected
                    ? "bg-[#283618] text-white hover:bg-[#1e2912]"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
                }`}
              >
                {format.label}
                {isSelected && <X className="inline-block w-3 h-3 ml-1" />}
              </button>
            );
          })}
        </div>

        {allowedFormats.length === 0 && (
          <div className={`${infoBoxClass} mt-2 border-amber-500 bg-amber-50`}>
            <p className="text-sm text-amber-700">
              {t("noFormatsSelectedWarning")}
            </p>
          </div>
        )}
      </div>

      {/* Tamaño máximo de archivo */}
      <div>
        <label className={labelClass}>{t("maxFileSizeLabel")}</label>
        <p className={helpTextClass}>{t("maxFileSizeHelp")}</p>

        <select
          value={maxFileSize}
          onChange={(e) => updateFieldConfig({ max_file_size: e.target.value })}
          className={inputClass}
        >
          <option value="1MB">1 MB</option>
          <option value="2MB">2 MB</option>
          <option value="5MB">5 MB</option>
          <option value="10MB">10 MB</option>
          <option value="20MB">20 MB</option>
        </select>
      </div>

      {/* Dimensiones del preview */}
      <div className={infoBoxClass}>
        <h4 className="text-sm font-medium text-[#283618] mb-2">
          {t("previewDimensionsTitle")}
        </h4>
        <p className={`${helpTextClass} mb-3`}>{t("previewDimensionsHelp")}</p>

        <div className="grid grid-cols-2 gap-4">
          {/* Altura */}
          <div>
            <label className={labelClass}>{t("heightLabel")}</label>
            <input
              type="number"
              value={maxHeight || ""}
              onChange={(e) =>
                updateFieldConfig({
                  max_height: e.target.value
                    ? parseInt(e.target.value)
                    : undefined,
                })
              }
              className={inputClass}
              placeholder={t("heightPlaceholder")}
              min="50"
              step="10"
            />
            <p className="text-xs text-gray-500 mt-1">{t("dimensionUnit")}</p>
          </div>

          {/* Ancho (opcional) */}
          <div>
            <label className={labelClass}>
              {t("widthLabel")}{" "}
              <span className="text-gray-400 font-normal">
                ({t("optional")})
              </span>
            </label>
            <input
              type="number"
              value={maxWidth || ""}
              onChange={(e) =>
                updateFieldConfig({
                  max_width: e.target.value
                    ? parseInt(e.target.value)
                    : undefined,
                })
              }
              className={inputClass}
              placeholder={t("widthPlaceholder")}
              min="50"
              step="10"
            />
            <p className="text-xs text-gray-500 mt-1">{t("dimensionUnit")}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
