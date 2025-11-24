"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { DateFieldConfig } from "../../../../../../types/template";
import { BaseFieldTypeConfigProps } from "./BaseFieldTypeConfig";
import { labelClass, selectClass } from "@/app/[locale]/components/ui";

// Date format options
const DATE_FORMATS = [
  "YYYY-MM-DD",
  "DD/MM/YYYY",
  "MM/DD/YYYY",
  "DD-MM-YYYY",
  "dddd, DD - MM",
  "DD, MMMM YYYY",
  "MMMM/YY",
] as const;

export const DateFieldTypeConfig: React.FC<BaseFieldTypeConfigProps> = ({
  currentField,
  updateField,
  updateFieldConfig,
  updateValidation,
  t: fieldT,
}) => {
  const t = useTranslations("CreateTemplate.fieldEditor.dateConfig");

  const config = (currentField.field_config as DateFieldConfig) || {};

  return (
    <div>
      <label className={labelClass}>{t("format")}</label>
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
  );
};
