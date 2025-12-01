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
  "DD de MMMM",
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

      {/* Mostrar Fases de Luna */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={config.show_moon_phases || false}
            onChange={(e) =>
              updateFieldConfig({ show_moon_phases: e.target.checked })
            }
            className="w-4 h-4 text-[#283618] border-gray-300 rounded focus:ring-[#283618]"
          />
          <span className={labelClass}>{t("showMoonPhases")}</span>
        </label>
        <p className="text-xs text-gray-500 mt-1 ml-6">
          {t("showMoonPhasesHelp")}
        </p>
      </div>

      {/* Configuración de Lunas (solo si show_moon_phases es true y form es false) */}
      {config.show_moon_phases && !currentField.form && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
          <div className="flex items-start gap-2">
            <span className="text-2xl">🌙</span>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-900 mb-1">
                {t("moonPhasesConfigTitle")}
              </h4>
              <p className="text-xs text-blue-700">
                {t("moonPhasesConfigHelp")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Fase de luna para fecha inicio */}
            <div>
              <label className={labelXsClass}>{t("startMoonPhase")}</label>
              <select
                value={config.start_moon_phase || "llena"}
                onChange={(e) =>
                  updateFieldConfig({
                    start_moon_phase: e.target.value as any,
                  })
                }
                className={inputClass}
              >
                <option value="llena">{t("moonPhases.full")}</option>
                <option value="nueva">{t("moonPhases.new")}</option>
                <option value="cuartoCreciente">
                  {t("moonPhases.waxingCrescent")}
                </option>
                <option value="cuartoMenguante">
                  {t("moonPhases.waningCrescent")}
                </option>
              </select>
            </div>

            {/* Fase de luna para fecha fin */}
            <div>
              <label className={labelXsClass}>{t("endMoonPhase")}</label>
              <select
                value={config.end_moon_phase || "llena"}
                onChange={(e) =>
                  updateFieldConfig({ end_moon_phase: e.target.value as any })
                }
                className={inputClass}
              >
                <option value="llena">{t("moonPhases.full")}</option>
                <option value="nueva">{t("moonPhases.new")}</option>
                <option value="cuartoCreciente">
                  {t("moonPhases.waxingCrescent")}
                </option>
                <option value="cuartoMenguante">
                  {t("moonPhases.waningCrescent")}
                </option>
              </select>
            </div>
          </div>
        </div>
      )}

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
