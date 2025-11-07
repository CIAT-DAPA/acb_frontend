"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { PageNumberFieldConfig } from "../../../../../../types/template";
import { BaseFieldTypeConfigProps } from "./BaseFieldTypeConfig";

export const PageNumberFieldTypeConfig: React.FC<BaseFieldTypeConfigProps> = ({
  currentField,
  updateField,
  updateFieldConfig,
  updateValidation,
  t: fieldT,
}) => {
  const t = useTranslations("CreateTemplate.fieldEditor");

  return (
    <div>
      <label className="block text-sm font-medium text-[#283618]/70 mb-2">
        {t("pageNumberConfig.format")}
      </label>
      <input
        type="text"
        value={
          (currentField.field_config as PageNumberFieldConfig)?.format ||
          "Página {page} de {total}"
        }
        onChange={(e) => updateFieldConfig({ format: e.target.value })}
        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        placeholder="Página {page} de {total}"
      />
      <p className="mt-1 text-xs text-[#283618]/50">
        {t("pageNumberConfig.help")}
      </p>
    </div>
  );
};
