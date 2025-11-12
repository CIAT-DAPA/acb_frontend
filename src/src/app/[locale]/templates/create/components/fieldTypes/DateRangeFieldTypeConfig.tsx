"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { DateRangeFieldConfig } from "../../../../../../types/template";
import { BaseFieldTypeConfigProps } from "./BaseFieldTypeConfig";

// CSS Constants
const LABEL_CLASS = "block text-sm font-medium text-[#283618]/70 mb-2";
const LABEL_SMALL_CLASS = "block text-sm font-medium text-[#283618]/70 mb-1";
const INPUT_CLASS =
  "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500";
const SECTION_TITLE_CLASS = "text-sm font-semibold text-[#283618] mb-3";

// Date format options
const DATE_FORMATS = [
  "YYYY-MM-DD",
  "DD/MM/YYYY",
  "MM/DD/YYYY",
  "DD-MM-YYYY",
  "dddd, DD - MM",
  "DD-DD, MMMM YYYY",
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
        <label className={LABEL_CLASS}>{t("format")}</label>
        <select
          value={config.date_format || "YYYY-MM-DD"}
          onChange={(e) => updateFieldConfig({ date_format: e.target.value })}
          className={INPUT_CLASS}
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
        <h4 className={SECTION_TITLE_CLASS}>{t("startDateSection")}</h4>

        <div className="space-y-3">
          <div>
            <label className={LABEL_SMALL_CLASS}>{t("startDateLabel")}</label>
            <input
              type="text"
              value={config.start_date_label || ""}
              onChange={(e) =>
                updateFieldConfig({ start_date_label: e.target.value })
              }
              placeholder={t("startDateLabelPlaceholder")}
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label className={LABEL_SMALL_CLASS}>
              {t("startDateDescription")}
            </label>
            <textarea
              value={config.start_date_description || ""}
              onChange={(e) =>
                updateFieldConfig({ start_date_description: e.target.value })
              }
              placeholder={t("startDateDescriptionPlaceholder")}
              rows={2}
              className={INPUT_CLASS}
            />
          </div>
        </div>
      </div>

      {/* Configuración Fecha de Fin */}
      <div className="pt-4">
        <h4 className={SECTION_TITLE_CLASS}>{t("endDateSection")}</h4>

        <div className="space-y-3">
          <div>
            <label className={LABEL_SMALL_CLASS}>{t("endDateLabel")}</label>
            <input
              type="text"
              value={config.end_date_label || ""}
              onChange={(e) =>
                updateFieldConfig({ end_date_label: e.target.value })
              }
              placeholder={t("endDateLabelPlaceholder")}
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label className={LABEL_SMALL_CLASS}>
              {t("endDateDescription")}
            </label>
            <textarea
              value={config.end_date_description || ""}
              onChange={(e) =>
                updateFieldConfig({ end_date_description: e.target.value })
              }
              placeholder={t("endDateDescriptionPlaceholder")}
              rows={2}
              className={INPUT_CLASS}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
