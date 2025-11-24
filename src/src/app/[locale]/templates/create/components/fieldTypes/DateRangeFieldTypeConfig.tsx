"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { DateRangeFieldConfig } from "../../../../../../types/template";
import { BaseFieldTypeConfigProps } from "./BaseFieldTypeConfig";
import {
  labelClass,
  labelXsClass,
  inputClass,
  sectionTitleDark,
} from "@/app/[locale]/components/ui";

// Date format options
const DATE_FORMATS = [
  "YYYY-MM-DD",
  "DD/MM/YYYY",
  "MM/DD/YYYY",
  "DD-MM-YYYY",
  "dddd, DD - MM",
  "DD-DD, MMMM YYYY",
  "MMMM/YY",
] as const;

export const DateRangeFieldTypeConfig: React.FC<BaseFieldTypeConfigProps> = ({
  currentField,
  updateField,
  updateFieldConfig,
  updateValidation,
  t: fieldT,
}) => {
  const t = useTranslations("CreateTemplate.fieldEditor.dateRangeConfig");

  const config = (currentField.field_config as DateRangeFieldConfig) || {};

  return (
    <div className="space-y-4">
      {/* Formato de Fecha */}
      <div>
        <label className={labelClass}>{t("format")}</label>
        <select
          value={config.date_format || "YYYY-MM-DD"}
          onChange={(e) => updateFieldConfig({ date_format: e.target.value })}
          className={inputClass}
        >
          {DATE_FORMATS.map((format) => (
            <option key={format} value={format}>
              {format}
            </option>
          ))}
        </select>
      </div>

      {/* Configuración Fecha de Inicio */}
      <div className="pt-4">
        <h4 className={sectionTitleDark}>{t("startDateSection")}</h4>

        <div className="space-y-3">
          <div>
            <label className={labelXsClass}>{t("startDateLabel")}</label>
            <input
              type="text"
              value={config.start_date_label || ""}
              onChange={(e) =>
                updateFieldConfig({ start_date_label: e.target.value })
              }
              placeholder={t("startDateLabelPlaceholder")}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelXsClass}>{t("startDateDescription")}</label>
            <textarea
              value={config.start_date_description || ""}
              onChange={(e) =>
                updateFieldConfig({ start_date_description: e.target.value })
              }
              placeholder={t("startDateDescriptionPlaceholder")}
              rows={2}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Configuración Fecha de Fin */}
      <div className="pt-4">
        <h4 className={sectionTitleDark}>{t("endDateSection")}</h4>

        <div className="space-y-3">
          <div>
            <label className={labelXsClass}>{t("endDateLabel")}</label>
            <input
              type="text"
              value={config.end_date_label || ""}
              onChange={(e) =>
                updateFieldConfig({ end_date_label: e.target.value })
              }
              placeholder={t("endDateLabelPlaceholder")}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelXsClass}>{t("endDateDescription")}</label>
            <textarea
              value={config.end_date_description || ""}
              onChange={(e) =>
                updateFieldConfig({ end_date_description: e.target.value })
              }
              placeholder={t("endDateDescriptionPlaceholder")}
              rows={2}
              className={inputClass}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
