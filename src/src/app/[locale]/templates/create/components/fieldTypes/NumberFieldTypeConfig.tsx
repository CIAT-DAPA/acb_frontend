"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { BaseFieldTypeConfigProps } from "./BaseFieldTypeConfig";

export const NumberFieldTypeConfig: React.FC<BaseFieldTypeConfigProps> = ({
  currentField,
  updateField,
  updateFieldConfig,
  updateValidation,
  t: fieldT,
}) => {
  const t = useTranslations("CreateTemplate.fieldEditor");

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-[#283618]/70 mb-2">
          {t("numberConfig.minValue")}
        </label>
        <input
          type="number"
          value={currentField.validation?.min_value || ""}
          onChange={(e) =>
            updateValidation({
              min_value: parseFloat(e.target.value) || undefined,
            })
          }
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[#283618]/70 mb-2">
          {t("numberConfig.maxValue")}
        </label>
        <input
          type="number"
          value={currentField.validation?.max_value || ""}
          onChange={(e) =>
            updateValidation({
              max_value: parseFloat(e.target.value) || undefined,
            })
          }
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[#283618]/70 mb-2">
          {t("numberConfig.decimalPlaces")}
        </label>
        <input
          type="number"
          min="0"
          max="10"
          value={currentField.validation?.decimal_places || ""}
          onChange={(e) =>
            updateValidation({
              decimal_places: parseInt(e.target.value) || undefined,
            })
          }
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="2"
        />
      </div>
    </div>
  );
};
