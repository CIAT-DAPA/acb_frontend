"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { DateFieldConfig } from "../../../../../../types/template";
import { BaseFieldTypeConfigProps } from "./BaseFieldTypeConfig";

export const DateFieldTypeConfig: React.FC<BaseFieldTypeConfigProps> = ({
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
        {t("dateConfig.format")}
      </label>
      <select
        value={
          (currentField.field_config as DateFieldConfig)?.date_format ||
          "YYYY-MM-DD"
        }
        onChange={(e) => updateFieldConfig({ date_format: e.target.value })}
        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
        <option value="DD-MM-YYYY">DD-MM-YYYY</option>
        <option value="dddd, DD - MM">Nombre día, DD - MM</option>
      </select>
    </div>
  );
};
