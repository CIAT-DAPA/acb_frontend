"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { TextFieldConfig } from "../../../../../../types/template";
import { BaseFieldTypeConfigProps } from "./BaseFieldTypeConfig";

// Constantes para clases CSS reutilizables
const INPUT_CLASS =
  "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500";
const LABEL_CLASS = "block text-sm font-medium text-[#283618]/70 mb-2";
const HELP_TEXT_CLASS = "text-xs text-[#283618]/50 mt-1";

export const TextFieldTypeConfig: React.FC<BaseFieldTypeConfigProps> = ({
  currentField,
  updateField,
  updateFieldConfig,
  updateValidation,
  t: fieldT,
}) => {
  const t = useTranslations("CreateTemplate.fieldEditor");

  // Helper para obtener config tipada
  const fieldConfig = currentField.field_config as TextFieldConfig;

  return (
    <div className="space-y-4">
      {/* Tipo de texto */}
      <div>
        <label className={LABEL_CLASS}>{t("textConfig.subtype")}</label>
        <select
          value={fieldConfig?.subtype || "short"}
          onChange={(e) => updateFieldConfig({ subtype: e.target.value })}
          className={INPUT_CLASS}
        >
          <option value="short">{t("textConfig.short")}</option>
          <option value="long">{t("textConfig.long")}</option>
        </select>
        <p className={HELP_TEXT_CLASS}>{t("textConfig.subtypeHelp")}</p>
      </div>

      {/* Validaciones */}
      <div>
        <h4 className="text-sm font-medium text-[#283618] mb-2">
          {t("validation.title")}
        </h4>
        <p className={`${HELP_TEXT_CLASS} mb-3`}>
          {t("textConfig.validationsHelp")}
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLASS}>{t("validation.minLength")}</label>
            <input
              type="number"
              value={currentField.validation?.min_length || ""}
              onChange={(e) =>
                updateValidation({
                  min_length: parseInt(e.target.value) || undefined,
                })
              }
              className={INPUT_CLASS}
              placeholder="0"
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>{t("validation.maxLength")}</label>
            <input
              type="number"
              value={currentField.validation?.max_length || ""}
              onChange={(e) =>
                updateValidation({
                  max_length: parseInt(e.target.value) || undefined,
                })
              }
              className={INPUT_CLASS}
              placeholder="255"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
