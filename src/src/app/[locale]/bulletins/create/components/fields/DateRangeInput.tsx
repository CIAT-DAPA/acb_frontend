import React from "react";
import { Field, DateRangeFieldConfig } from "../../../../../../types/template";
import { useTranslations } from "next-intl";

interface DateRangeInputProps {
  field?: Field;
  value: {
    start_date: string;
    end_date: string;
    start_moon_phase?: string;
    end_moon_phase?: string;
  };
  onChange: (value: {
    start_date: string;
    end_date: string;
    start_moon_phase?: string;
    end_moon_phase?: string;
  }) => void;
  disabled?: boolean;
}

export function DateRangeInput({
  field,
  value,
  onChange,
  disabled = false,
}: DateRangeInputProps) {
  const t = useTranslations("CreateTemplate.fieldEditor.dateRangeConfig");

  const fieldConfig = (
    field?.type === "date_range" ? field.field_config : {}
  ) as DateRangeFieldConfig;
  const showMoonPhases = fieldConfig.show_moon_phases || false;

  const startDateLabel = fieldConfig.start_date_label || "Fecha de inicio";
  const endDateLabel = fieldConfig.end_date_label || "Fecha de fin";
  const startDateDescription = fieldConfig.start_date_description;
  const endDateDescription = fieldConfig.end_date_description;

  const handleStartDateChange = (newStartDate: string) => {
    onChange({
      ...value,
      start_date: newStartDate,
      end_date: value?.end_date || "",
    });
  };

  const handleEndDateChange = (newEndDate: string) => {
    onChange({
      ...value,
      start_date: value?.start_date || "",
      end_date: newEndDate,
    });
  };

  const handleStartMoonPhaseChange = (phase: string) => {
    onChange({
      ...value,
      start_moon_phase: phase,
    });
  };

  const handleEndMoonPhaseChange = (phase: string) => {
    onChange({
      ...value,
      end_moon_phase: phase,
    });
  };

  return (
    <div className="space-y-4">
      {/* Start Date */}
      <div>
        <label className="block text-sm font-medium text-[#283618] mb-1">
          {startDateLabel}
        </label>
        <input
          type="date"
          value={value?.start_date || ""}
          onChange={(e) => handleStartDateChange(e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#283618] disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        {startDateDescription && (
          <p className="text-xs text-[#606c38] mt-1">{startDateDescription}</p>
        )}

        {/* Start Moon Phase */}
        {showMoonPhases && (
          <div className="mt-3">
            <label className="block text-xs font-medium text-[#283618] mb-1">
              {t("startMoonPhase")}
            </label>
            <select
              value={value?.start_moon_phase || "llena"}
              onChange={(e) => handleStartMoonPhaseChange(e.target.value)}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#283618] disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
            >
              <option value="llena">🌕 {t("moonPhases.full")}</option>
              <option value="nueva">🌑 {t("moonPhases.new")}</option>
              <option value="cuartoCreciente">
                🌓 {t("moonPhases.waxingCrescent")}
              </option>
              <option value="cuartoMenguante">
                🌗 {t("moonPhases.waningCrescent")}
              </option>
            </select>
          </div>
        )}
      </div>

      {/* End Date */}
      <div>
        <label className="block text-sm font-medium text-[#283618] mb-1">
          {endDateLabel}
        </label>
        <input
          type="date"
          value={value?.end_date || ""}
          onChange={(e) => handleEndDateChange(e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#283618] disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        {endDateDescription && (
          <p className="text-xs text-[#606c38] mt-1">{endDateDescription}</p>
        )}

        {/* End Moon Phase */}
        {showMoonPhases && (
          <div className="mt-3">
            <label className="block text-xs font-medium text-[#283618] mb-1">
              {t("endMoonPhase")}
            </label>
            <select
              value={value?.end_moon_phase || "llena"}
              onChange={(e) => handleEndMoonPhaseChange(e.target.value)}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#283618] disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
            >
              <option value="llena">🌕 {t("moonPhases.full")}</option>
              <option value="nueva">🌑 {t("moonPhases.new")}</option>
              <option value="cuartoCreciente">
                🌓 {t("moonPhases.waxingCrescent")}
              </option>
              <option value="cuartoMenguante">
                🌗 {t("moonPhases.waningCrescent")}
              </option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
