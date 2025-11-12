"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { BaseFieldTypeConfigProps } from "./BaseFieldTypeConfig";
import { Plus, X } from "lucide-react";
import {
  btnOutlineSecondary,
  labelClass,
  helpTextClass,
  inputClass,
  btnDangerIconClass,
  emptyStateClass,
  checkboxClass,
} from "@/app/[locale]/components/ui";

interface SearchableFieldConfig {
  options: string[];
}

// CSS Constants
const OPTION_ITEM_CLASS =
  "flex items-center gap-2 p-2 border border-gray-200 rounded-md bg-gray-50";
const OPTION_NUMBER_CLASS = "text-sm text-gray-500 font-medium w-8";

export const SearchableFieldTypeConfig: React.FC<BaseFieldTypeConfigProps> = ({
  currentField,
  updateField,
  updateFieldConfig,
  updateValidation,
  t: fieldT,
}) => {
  const t = useTranslations("CreateTemplate.fieldEditor.searchableConfig");

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
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className={labelClass}>{t("options")}</label>
          <button
            type="button"
            onClick={addOption}
            className={`${btnOutlineSecondary} text-sm flex items-center`}
          >
            <Plus className="w-4 h-4 mr-1" /> {t("addOption")}
          </button>
        </div>

        <p className={helpTextClass}>{t("help")}</p>

        <div className="space-y-2">
          {options.map((option, index) => (
            <div key={index} className={OPTION_ITEM_CLASS}>
              <span className={OPTION_NUMBER_CLASS}>{index + 1}.</span>
              <input
                type="text"
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                className={inputClass}
                placeholder={t("optionPlaceholder")}
              />
              <button
                type="button"
                onClick={() => removeOption(index)}
                className={btnDangerIconClass}
                title={t("removeOption")}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          {options.length === 0 && (
            <div className={emptyStateClass}>{t("noOptionsMessage")}</div>
          )}
        </div>
      </div>

      <div>
        <label className="flex items-center text-sm">
          <input
            type="checkbox"
            checked={currentField.validation?.required || false}
            onChange={(e) => updateValidation({ required: e.target.checked })}
            className={checkboxClass}
          />
          {fieldT("validation.required")}
        </label>
      </div>
    </div>
  );
};
