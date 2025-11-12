"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { DateFieldConfig } from "../../../../../../types/template";
import { BaseFieldTypeConfigProps } from "./BaseFieldTypeConfig";

// CSS Constants
const LABEL_CLASS = "block text-sm font-medium text-[#283618]/70 mb-2";
const SELECT_CLASS =
  "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500";

// Date format options
const DATE_FORMATS = [
  "YYYY-MM-DD",
  "DD/MM/YYYY",
  "MM/DD/YYYY",
  "DD-MM-YYYY",
  "dddd, DD - MM",
  "DD, MMMM YYYY",
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
      <label className={LABEL_CLASS}>{t("format")}</label>
      <select
        value={config.date_format || "YYYY-MM-DD"}
        onChange={(e) => updateFieldConfig({ date_format: e.target.value })}
        className={SELECT_CLASS}
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
