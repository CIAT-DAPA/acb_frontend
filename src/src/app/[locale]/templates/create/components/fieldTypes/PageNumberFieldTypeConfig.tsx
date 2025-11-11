"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { PageNumberFieldConfig } from "../../../../../../types/template";
import { BaseFieldTypeConfigProps } from "./BaseFieldTypeConfig";

// Constantes CSS reutilizables
const INPUT_CLASS =
  "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500";
const LABEL_CLASS = "block text-sm font-medium text-[#283618]/70 mb-2";
const HELP_TEXT_CLASS = "mt-1 text-xs text-[#283618]/50";

// Formato por defecto
const DEFAULT_FORMAT = "Página {page} de {total}";

export const PageNumberFieldTypeConfig: React.FC<BaseFieldTypeConfigProps> = ({
  currentField,
  updateField,
  updateFieldConfig,
  updateValidation,
  t: fieldT,
}) => {
  const t = useTranslations("CreateTemplate.fieldEditor");

  // Helper para obtener config tipada
  const fieldConfig = currentField.field_config as PageNumberFieldConfig;
  const currentFormat = fieldConfig?.format || DEFAULT_FORMAT;

  return (
    <div className="space-y-4">
      {/* Formato */}
      <div>
        <label className={LABEL_CLASS}>{t("pageNumberConfig.format")}</label>
        <input
          type="text"
          value={currentFormat}
          onChange={(e) => updateFieldConfig({ format: e.target.value })}
          className={INPUT_CLASS}
          placeholder={DEFAULT_FORMAT}
        />
        <p className={HELP_TEXT_CLASS}>{t("pageNumberConfig.help")}</p>
      </div>
    </div>
  );
};
