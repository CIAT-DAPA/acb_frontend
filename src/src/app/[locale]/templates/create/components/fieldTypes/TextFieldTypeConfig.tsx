"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { TextFieldConfig } from "../../../../../../types/template";
import { BaseFieldTypeConfigProps } from "./BaseFieldTypeConfig";

export const TextFieldTypeConfig: React.FC<BaseFieldTypeConfigProps> = ({
  currentField,
  updateField,
  updateFieldConfig,
  updateValidation,
  t: fieldT,
}) => {
  // Usar las traducciones locales para este componente
  const t = useTranslations("CreateTemplate.fieldEditor");

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[#283618]/70 mb-2">
          {t("textConfig.subtype")}
        </label>
        <select
          value={
            (currentField.field_config as TextFieldConfig)?.subtype || "short"
          }
          onChange={(e) => updateFieldConfig({ subtype: e.target.value })}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="short">{t("textConfig.short")}</option>
          <option value="long">{t("textConfig.long")}</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#283618]/70 mb-2">
            {t("validation.minLength")}
          </label>
          <input
            type="number"
            value={currentField.validation?.min_length || ""}
            onChange={(e) =>
              updateValidation({
                min_length: parseInt(e.target.value) || undefined,
              })
            }
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#283618]/70 mb-2">
            {t("validation.maxLength")}
          </label>
          <input
            type="number"
            value={currentField.validation?.max_length || ""}
            onChange={(e) =>
              updateValidation({
                max_length: parseInt(e.target.value) || undefined,
              })
            }
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="255"
          />
        </div>
      </div>
    </div>
  );
};
