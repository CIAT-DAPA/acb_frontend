"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { BaseFieldTypeConfigProps } from "./BaseFieldTypeConfig";
import { labelClass, inputClass } from "@/app/[locale]/components/ui";

export const NumberFieldTypeConfig: React.FC<BaseFieldTypeConfigProps> = ({
  currentField,
  updateField,
  updateFieldConfig,
  updateValidation,
  t: fieldT,
}) => {
  const t = useTranslations("CreateTemplate.fieldEditor.numberConfig");

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className={labelClass}>{t("minValue")}</label>
        <input
          type="number"
          value={currentField.validation?.min_value || ""}
          onChange={(e) =>
            updateValidation({
              min_value: parseFloat(e.target.value) || undefined,
            })
          }
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>{t("maxValue")}</label>
        <input
          type="number"
          value={currentField.validation?.max_value || ""}
          onChange={(e) =>
            updateValidation({
              max_value: parseFloat(e.target.value) || undefined,
            })
          }
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>{t("decimalPlaces")}</label>
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
          className={inputClass}
          placeholder="2"
        />
      </div>
    </div>
  );
};
