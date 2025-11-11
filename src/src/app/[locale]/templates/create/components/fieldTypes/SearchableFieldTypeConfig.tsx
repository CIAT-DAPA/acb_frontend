"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { BaseFieldTypeConfigProps } from "./BaseFieldTypeConfig";
import { Plus, X } from "lucide-react";
import {
  btnOutlineSecondary,
} from "@/app/[locale]/components/ui";

interface SearchableFieldConfig {
  options: string[];
}

export const SearchableFieldTypeConfig: React.FC<BaseFieldTypeConfigProps> = ({
  currentField,
  updateField,
  updateFieldConfig,
  updateValidation,
  t: fieldT,
}) => {
  const t = useTranslations("CreateTemplate.fieldEditor");

  const config = (currentField.field_config as SearchableFieldConfig) || {};
  const options = config.options || [];

  const updateOptions = (newOptions: string[]) => {
    updateFieldConfig({ options: newOptions });
  };

  const addOption = () => {
    const newOptions = [...options, ""];
    updateOptions(newOptions);
  };

  const removeOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index);
    updateOptions(newOptions);
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    updateOptions(newOptions);
  };

  return (
    <div className="space-y-4">
      {/* Opciones */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-[#283618]/70">
            {t("searchableConfig.options")}
          </label>
          <button
            type="button"
            onClick={addOption}
            className={`${btnOutlineSecondary} text-sm flex items-center`}
          >
            <Plus className="w-4 h-4 mr-1" /> {t("searchableConfig.addOption")}
          </button>
        </div>

        <div className="space-y-2">
          {options.map((option, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-2 border border-gray-200 rounded-md bg-gray-50"
            >
              <span className="text-sm text-gray-500 font-medium w-8">
                {index + 1}.
              </span>
              <input
                type="text"
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                placeholder={t("searchableConfig.optionPlaceholder")}
              />
              <button
                type="button"
                onClick={() => removeOption(index)}
                className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded transition-colors"
                title={t("searchableConfig.removeOption")}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          {options.length === 0 && (
            <div className="text-center py-6 text-gray-500 text-sm border border-gray-200 rounded-md bg-gray-50">
              {t("searchableConfig.noOptionsMessage")}
            </div>
          )}
        </div>
      </div>

      {/* Campo requerido */}
      <div>
        <label className="flex items-center text-sm">
          <input
            type="checkbox"
            checked={currentField.validation?.required || false}
            onChange={(e) => updateValidation({ required: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
          />
          {t("validation.required")}
        </label>
      </div>
    </div>
  );
};
