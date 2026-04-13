"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { DateFieldConfig } from "../../../../../../types/template";
import { BaseFieldTypeConfigProps } from "./BaseFieldTypeConfig";
import {
  helpTextClass,
  labelClass,
  selectClass,
} from "@/app/[locale]/components/ui";

// Date format options
const DATE_FORMATS = [
  "YYYY-MM-DD",
  "DD/MM/YYYY",
  "MM/DD/YYYY",
  "DD-MM-YYYY",
  "dddd, DD - MM",
  "DD, MMMM YYYY",
  "DD de MMMM",
  "MMMM/YY",
] as const;

export const DateFieldTypeConfig: React.FC<BaseFieldTypeConfigProps> = ({
  currentField,
  updateField,
  updateFieldConfig,
  updateValidation,
  t: fieldT,
}) => {
  const t = useTranslations("CreateTemplate.fieldEditor");

  const config = (currentField.field_config as DateFieldConfig) || {};
  const showLabel = config.showLabel ?? false;

  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>{t("dateConfig.format")}</label>
        <select
          value={config.date_format || "YYYY-MM-DD"}
          onChange={(e) => updateFieldConfig({ date_format: e.target.value })}
          className={selectClass}
        >
          {DATE_FORMATS.map((format) => (
            <option key={format} value={format}>
              {format}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="dateShowLabel"
          checked={showLabel}
          onChange={(e) => updateFieldConfig({ showLabel: e.target.checked })}
          className="w-4 h-4 text-[#bc6c25] border-gray-300 rounded focus:ring-[#bc6c25]"
        />
        <label htmlFor="dateShowLabel" className={labelClass}>
          {currentField.form
            ? t("textWithIconConfig.showLabelForm")
            : t("textWithIconConfig.showLabelPreview")}
        </label>
        <p className={helpTextClass}>
          {currentField.form
            ? t("textWithIconConfig.showLabelFormHelp")
            : t("textWithIconConfig.showLabelPreviewHelp")}
        </p>
      </div>
    </div>
  );
};
