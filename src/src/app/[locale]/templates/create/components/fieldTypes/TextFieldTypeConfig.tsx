"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { TextFieldConfig } from "../../../../../../types/template";
import { BaseFieldTypeConfigProps } from "./BaseFieldTypeConfig";
import {
  inputClass,
  labelClass,
  helpTextClass,
} from "@/app/[locale]/components/ui";

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
        <label className={labelClass}>{t("textConfig.subtype")}</label>
        <select
          value={fieldConfig?.subtype || "short"}
          onChange={(e) => updateFieldConfig({ subtype: e.target.value })}
          className={inputClass}
        >
          <option value="short">{t("textConfig.short")}</option>
          <option value="long">{t("textConfig.long")}</option>
        </select>
        <p className={helpTextClass}>{t("textConfig.subtypeHelp")}</p>
      </div>

      {/* Validaciones */}
      <div>
        <h4 className="text-sm font-medium text-[#283618] mb-2">
          {t("validation.title")}
        </h4>
        <p className={`${helpTextClass} mb-3`}>
          {t("textConfig.validationsHelp")}
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>{t("validation.minLength")}</label>
            <input
              type="number"
              value={currentField.validation?.min_length || ""}
              onChange={(e) =>
                updateValidation({
                  min_length: parseInt(e.target.value) || undefined,
                })
              }
              className={inputClass}
              placeholder="0"
            />
          </div>
          <div>
            <label className={labelClass}>{t("validation.maxLength")}</label>
            <input
              type="number"
              value={currentField.validation?.max_length || ""}
              onChange={(e) =>
                updateValidation({
                  max_length: parseInt(e.target.value) || undefined,
                })
              }
              className={inputClass}
              placeholder="255"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
