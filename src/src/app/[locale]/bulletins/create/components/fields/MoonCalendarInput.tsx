"use client";

import React from "react";
import { Field } from "../../../../../../types/template";
import { useTranslations } from "next-intl";

interface MoonCalendarInputProps {
  field?: Field;
  value: {
    month?: string;
    year?: number;
    full_moon_date?: string;
    new_moon_date?: string;
    waxing_crescent_date?: string;
    waning_crescent_date?: string;
  };
  onChange: (value: {
    month?: string;
    year?: number;
    full_moon_date?: string;
    new_moon_date?: string;
    waxing_crescent_date?: string;
    waning_crescent_date?: string;
  }) => void;
  disabled?: boolean;
}

export function MoonCalendarInput({
  field,
  value,
  onChange,
  disabled = false,
}: MoonCalendarInputProps) {
  const t = useTranslations("CreateBulletin.moonCalendar");

  const currentDate = new Date();
  const currentYearMonth = `${currentDate.getFullYear()}-${String(
    currentDate.getMonth() + 1
  ).padStart(2, "0")}`;

  // Obtener mes y año del value o usar valor actual
  const getMonthYearFromValue = () => {
    if (value?.month && value?.year) {
      const monthNames = [
        "enero",
        "febrero",
        "marzo",
        "abril",
        "mayo",
        "junio",
        "julio",
        "agosto",
        "septiembre",
        "octubre",
        "noviembre",
        "diciembre",
      ];
      const monthIndex = monthNames.indexOf(value.month.toLowerCase());
      if (monthIndex !== -1) {
        return `${value.year}-${String(monthIndex + 1).padStart(2, "0")}`;
      }
    }
    return currentYearMonth;
  };

  const [selectedMonthYear, setSelectedMonthYear] = React.useState(
    getMonthYearFromValue()
  );

  // Actualizar cuando cambie el value externo
  React.useEffect(() => {
    setSelectedMonthYear(getMonthYearFromValue());
  }, [value?.month, value?.year]);

  const handleMonthYearChange = (monthYearString: string) => {
    setSelectedMonthYear(monthYearString);

    const [year, month] = monthYearString.split("-");
    const monthNames = [
      "enero",
      "febrero",
      "marzo",
      "abril",
      "mayo",
      "junio",
      "julio",
      "agosto",
      "septiembre",
      "octubre",
      "noviembre",
      "diciembre",
    ];
    const monthName = monthNames[parseInt(month) - 1];

    onChange({
      ...value,
      month: monthName,
      year: parseInt(year),
    });
  };

  const handlePhaseChange = (
    phaseKey:
      | "full_moon_date"
      | "new_moon_date"
      | "waxing_crescent_date"
      | "waning_crescent_date",
    dateString: string
  ) => {
    onChange({
      ...value,
      [phaseKey]: dateString,
    });
  };

  // Obtener el rango de fechas permitidas para el mes seleccionado
  const getDateRange = () => {
    const [year, month] = selectedMonthYear.split("-");
    const min = `${year}-${month}-01`;
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    const max = `${year}-${month}-${String(lastDay).padStart(2, "0")}`;
    return { min, max };
  };

  const dateRange = getDateRange();

  const renderPhaseSelector = (
    label: string,
    phaseKey:
      | "full_moon_date"
      | "new_moon_date"
      | "waxing_crescent_date"
      | "waning_crescent_date",
    emoji: string
  ) => {
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-[#283618]">
          {emoji} {label}
        </label>
        <input
          type="date"
          value={value?.[phaseKey] || ""}
          onChange={(e) => handlePhaseChange(phaseKey, e.target.value)}
          disabled={disabled}
          min={dateRange.min}
          max={dateRange.max}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#283618] disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Selector de Mes y Año */}
      <div>
        <label className="block text-sm font-medium text-[#283618] mb-1">
          {t("monthYear")}
        </label>
        <input
          type="month"
          value={selectedMonthYear}
          onChange={(e) => handleMonthYearChange(e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#283618] disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>

      {/* Selectores de Fases Lunares */}
      <div className="space-y-4">
        <h4 className="text-md font-semibold text-[#283618] border-b pb-2">
          {t("moonPhasesTitle")}
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderPhaseSelector(t("fullMoon"), "full_moon_date", "🌕")}
          {renderPhaseSelector(
            t("waningCrescent"),
            "waning_crescent_date",
            "🌗"
          )}
          {renderPhaseSelector(t("newMoon"), "new_moon_date", "🌑")}
          {renderPhaseSelector(
            t("waxingCrescent"),
            "waxing_crescent_date",
            "🌓"
          )}
        </div>
      </div>
    </div>
  );
}
