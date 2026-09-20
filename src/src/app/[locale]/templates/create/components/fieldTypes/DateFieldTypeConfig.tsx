"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { DateFieldConfig } from "../../../../../../types/template";
import { BaseFieldTypeConfigProps } from "./BaseFieldTypeConfig";
import { helpTextClass, labelClass } from "@/app/[locale]/components/ui";
import { DATE_FORMATS } from "@/utils/dateFormat";
import { DateFormatSelector } from "./DateFormatSelector";

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
      <DateFormatSelector
        value={config.date_format}
        presets={DATE_FORMATS}
        onChange={(format) => updateFieldConfig({ date_format: format })}
      />

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
