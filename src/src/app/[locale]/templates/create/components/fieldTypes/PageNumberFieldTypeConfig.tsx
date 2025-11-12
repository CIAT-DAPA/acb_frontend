"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { PageNumberFieldConfig } from "../../../../../../types/template";
import { BaseFieldTypeConfigProps } from "./BaseFieldTypeConfig";
import {
  inputClass,
  labelClass,
  helpTextClass,
} from "@/app/[locale]/components/ui";

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
        <label className={labelClass}>{t("pageNumberConfig.format")}</label>
        <input
          type="text"
          value={currentFormat}
          onChange={(e) => updateFieldConfig({ format: e.target.value })}
          className={inputClass}
          placeholder={DEFAULT_FORMAT}
        />
        <p className={helpTextClass}>{t("pageNumberConfig.help")}</p>
      </div>
    </div>
  );
};
