"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { DateRangeFieldConfig } from "../../../../../../types/template";
import { BaseFieldTypeConfigProps } from "./BaseFieldTypeConfig";

export const DateRangeFieldTypeConfig: React.FC<BaseFieldTypeConfigProps> = ({
  currentField,
  updateField,
  updateFieldConfig,
  updateValidation,
  t: fieldT,
}) => {
  const t = useTranslations("CreateTemplate.fieldEditor");

  const config = currentField.field_config as DateRangeFieldConfig;

  return (
    <div className="space-y-4">
      {/* Formato de Fecha */}
      <div>
        <label className="block text-sm font-medium text-[#283618]/70 mb-2">
          {t("dateRangeConfig.format")}
        </label>
        <select
          value={config?.date_format || "YYYY-MM-DD"}
          onChange={(e) => updateFieldConfig({ date_format: e.target.value })}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
          <option value="DD-MM-YYYY">DD-MM-YYYY</option>
          <option value="dddd, DD - MM">dddd, DD - MM</option>
          <option value="DD-DD, MMMM YYYY">DD-DD, MMMM YYYY</option>
        </select>
      </div>

      {/* Configuración Fecha de Inicio */}
      <div className="pt-4">
        <h4 className="text-sm font-semibold text-[#283618] mb-3">
          {t("dateRangeConfig.startDateSection")}
        </h4>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-[#283618]/70 mb-1">
              {t("dateRangeConfig.startDateLabel")}
            </label>
            <input
              type="text"
              value={config?.start_date_label || ""}
              onChange={(e) =>
                updateFieldConfig({ start_date_label: e.target.value })
              }
              placeholder={t("dateRangeConfig.startDateLabelPlaceholder")}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#283618]/70 mb-1">
              {t("dateRangeConfig.startDateDescription")}
            </label>
            <textarea
              value={config?.start_date_description || ""}
              onChange={(e) =>
                updateFieldConfig({ start_date_description: e.target.value })
              }
              placeholder={t("dateRangeConfig.startDateDescriptionPlaceholder")}
              rows={2}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Configuración Fecha de Fin */}
      <div className="pt-4">
        <h4 className="text-sm font-semibold text-[#283618] mb-3">
          {t("dateRangeConfig.endDateSection")}
        </h4>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-[#283618]/70 mb-1">
              {t("dateRangeConfig.endDateLabel")}
            </label>
            <input
              type="text"
              value={config?.end_date_label || ""}
              onChange={(e) =>
                updateFieldConfig({ end_date_label: e.target.value })
              }
              placeholder={t("dateRangeConfig.endDateLabelPlaceholder")}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#283618]/70 mb-1">
              {t("dateRangeConfig.endDateDescription")}
            </label>
            <textarea
              value={config?.end_date_description || ""}
              onChange={(e) =>
                updateFieldConfig({ end_date_description: e.target.value })
              }
              placeholder={t("dateRangeConfig.endDateDescriptionPlaceholder")}
              rows={2}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
